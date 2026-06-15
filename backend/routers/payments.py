"""
Router de pagos.
Se comunica con el microservicio de pagos del profesor (app-pagos) en puerto 8002.

Endpoints del microservicio de pagos:
  POST /pagos/crear           → crea preferencia checkout (redirige a Mercado Pago)
  POST /pagos/directo/procesar → pago directo con datos de tarjeta
  GET  /pagos/{id}/estado     → consultar estado
  POST /pagos/webhook         → webhook de Mercado Pago 
"""
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from models import get_db
from utils.security import get_current_user_id

router = APIRouter()


# ---------- Schemas ----------

class PagoDirectoRequest(BaseModel):
    """Para pago directo con tarjeta (sin redirección a MercadoPago)."""
    order_id: int
    numero_tarjeta: str
    mes_vencimiento: int
    anio_vencimiento: int
    cvv: str
    nombre_titular: str


# ---------- Endpoints ----------

@router.post("/create-checkout/{order_id}")
def create_checkout(
    order_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Crea una preferencia de pago en Mercado Pago (modo checkout).
    El usuario es redirigido a la página de Mercado Pago para pagar.
    Llama a POST /pagos/crear del microservicio de pagos.
    """
    order = db.execute(
        text("""
            SELECT o.id, o.order_number, o.total, u.email, u.full_name
            FROM orders o JOIN users u ON o.user_id = u.id
            WHERE o.id = :oid AND o.user_id = :uid
        """),
        {"oid": order_id, "uid": user_id},
    ).fetchone()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Obtener items para la descripción
    items = db.execute(
        text("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = :oid"),
        {"oid": order_id},
    ).fetchall()
    descripcion = ", ".join([f"{i[0]} x{i[1]}" for i in items])

    # Llamar al microservicio de pagos
    try:
        response = httpx.post(
            f"{settings.PAYMENT_SERVICE_URL}/pagos/crear",
            json={
                "id_usuario": user_id,
                "descripcion": descripcion[:200],  # Limitar longitud
                "monto": float(order[2]),
                "email_pagador": order[3],
            },
            timeout=15,
        )
        data = response.json()

        if not data.get("success"):
            raise HTTPException(status_code=502, detail=data.get("message", "Error en microservicio de pagos"))

        payment_data = data.get("data", {})

        # Guardar referencia del pago en la orden
        db.execute(
            text("""
                UPDATE orders
                SET payment_id = :pid, payment_status = 'PENDIENTE'
                WHERE id = :oid
            """),
            {"pid": str(payment_data.get("id_pago")), "oid": order_id},
        )
        db.commit()

        return {
            "id_pago": payment_data.get("id_pago"),
            "url_pago": payment_data.get("url_pago"),
            "external_reference": payment_data.get("external_reference"),
            "preference_id": payment_data.get("preference_id"),
        }

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Microservicio de pagos no disponible: {str(e)}")


@router.post("/directo")
def pago_directo(
    req: PagoDirectoRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Pago directo con datos de tarjeta.
    Llama a POST /pagos/directo/procesar del microservicio de pagos.
    """
    order = db.execute(
        text("""
            SELECT o.id, o.order_number, o.total, u.email
            FROM orders o JOIN users u ON o.user_id = u.id
            WHERE o.id = :oid AND o.user_id = :uid
        """),
        {"oid": req.order_id, "uid": user_id},
    ).fetchone()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    items = db.execute(
        text("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = :oid"),
        {"oid": req.order_id},
    ).fetchall()
    descripcion = ", ".join([f"{i[0]} x{i[1]}" for i in items])

    try:
        response = httpx.post(
            f"{settings.PAYMENT_SERVICE_URL}/pagos/directo/procesar",
            json={
                "id_usuario": user_id,
                "numero_tarjeta": req.numero_tarjeta,
                "mes_vencimiento": req.mes_vencimiento,
                "anio_vencimiento": req.anio_vencimiento,
                "cvv": req.cvv,
                "nombre_titular": req.nombre_titular,
                "email": order[3],
                "descripcion": descripcion[:200],
                "monto": float(order[2]),
            },
            timeout=20,
        )
        data = response.json()

        if not data.get("success"):
            raise HTTPException(status_code=502, detail=data.get("message", "Error procesando pago"))

        payment_data = data.get("data", {})
        estado = payment_data.get("estado", "PENDIENTE")

        # Actualizar orden
        new_status = "paid" if estado == "PAGADO" else "pending"
        db.execute(
            text("""
                UPDATE orders
                SET payment_id = :pid, payment_status = :pstatus,
                    payment_date = :pdate, status = :status
                WHERE id = :oid
            """),
            {
                "pid": str(payment_data.get("mp_payment_id", payment_data.get("id_pago"))),
                "pstatus": estado,
                "pdate": datetime.utcnow() if estado == "PAGADO" else None,
                "status": new_status,
                "oid": req.order_id,
            },
        )
        db.commit()

        # Si fue pagado, enviar correos de notificación
        if estado == "PAGADO":
            _send_purchase_notifications(req.order_id, user_id, db)

        return {
            "id_pago": payment_data.get("id_pago"),
            "estado": estado,
            "mp_payment_id": payment_data.get("mp_payment_id"),
        }

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Microservicio de pagos no disponible: {str(e)}")


@router.get("/status/{id_pago}")
def check_payment_status(id_pago: int):
    """Consulta el estado de un pago en el microservicio."""
    try:
        response = httpx.get(
            f"{settings.PAYMENT_SERVICE_URL}/pagos/{id_pago}/estado",
            timeout=10,
        )
        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"No se pudo consultar estado: {str(e)}")


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Recibe notificaciones de Mercado Pago (vía el microservicio de pagos).
    Actualiza el estado de la orden y envía notificaciones.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "ignored"}

    payment_type = body.get("type")
    if payment_type != "payment":
        return {"status": "ignored"}

    payment_id = body.get("data", {}).get("id")
    if not payment_id:
        return {"status": "no_id"}

    # Consultar Mercado Pago directamente
    try:
        response = httpx.get(
            f"https://api.mercadopago.com/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"},
            timeout=10,
        )
        payment_data = response.json()

        external_ref = payment_data.get("external_reference", "")
        mp_status = payment_data.get("status", "")
        amount = payment_data.get("transaction_amount", 0)

        # Buscar orden que tenga este external_reference o payment_id
        order = db.execute(
            text("""
                SELECT o.id, o.user_id, o.order_number, o.total
                FROM orders o
                WHERE o.payment_id IS NOT NULL
                ORDER BY o.created_at DESC
                LIMIT 1
            """),
        ).fetchone()

        if order and mp_status == "approved":
            db.execute(
                text("""
                    UPDATE orders
                    SET payment_id = :pid, payment_status = 'PAGADO',
                        payment_date = :pdate, status = 'paid'
                    WHERE id = :oid
                """),
                {"pid": str(payment_id), "pdate": datetime.utcnow(), "oid": order[0]},
            )
            db.commit()

            _send_purchase_notifications(order[0], order[1], db)

    except Exception as e:
        print(f"[WARN] Error procesando webhook: {e}")

    return {"status": "ok"}


def _send_purchase_notifications(order_id: int, user_id: int, db: Session):
    """Envía correos de confirmación de compra y de pago."""
    try:
        user = db.execute(
            text("SELECT email, full_name FROM users WHERE id = :id"),
            {"id": user_id},
        ).fetchone()
        order = db.execute(
            text("SELECT order_number, total, payment_id, payment_status, payment_date FROM orders WHERE id = :id"),
            {"id": order_id},
        ).fetchone()
        items = db.execute(
            text("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = :oid"),
            {"oid": order_id},
        ).fetchall()

        items_list = [{"name": i[0], "quantity": i[1], "price": float(i[2])} for i in items]
        now = datetime.utcnow().isoformat()

        # Correo de confirmación de compra
        httpx.post(
            f"{settings.NOTIFICATION_SERVICE_URL}/send-purchase-email",
            json={
                "email": user[0],
                "full_name": user[1],
                "order_number": order[0],
                "total": float(order[1]),
                "items": items_list,
                "purchase_date": now,
            },
            timeout=10,
        )

        # Correo de detalle de pago (Mercado Pago)
        httpx.post(
            f"{settings.NOTIFICATION_SERVICE_URL}/send-payment-email",
            json={
                "email": user[0],
                "full_name": user[1],
                "payment_id": str(order[2] or ""),
                "payment_status": order[3] or "",
                "payment_date": str(order[4] or now),
                "amount": float(order[1]),
                "order_number": order[0],
                "items": items_list,
            },
            timeout=10,
        )
    except Exception as e:
        print(f"[WARN] Error enviando notificaciones de compra: {e}")
