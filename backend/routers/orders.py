import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from models import get_db
from utils.security import get_current_user_id

router = APIRouter()


@router.post("/create")
def create_order(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Obtener carrito
    cart = db.execute(
        text("""
            SELECT ci.product_id, p.name, p.price, ci.quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = :uid
        """),
        {"uid": user_id},
    ).fetchall()

    if not cart:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    total = sum(float(r[2]) * r[3] for r in cart)

    # Crear orden
    result = db.execute(
        text("""
            INSERT INTO orders (user_id, order_number, total, status)
            VALUES (:uid, :onum, :total, 'pending')
            RETURNING id
        """),
        {"uid": user_id, "onum": order_number, "total": total},
    )
    order_id = result.fetchone()[0]

    # Crear items de la orden
    for item in cart:
        db.execute(
            text("""
                INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
                VALUES (:oid, :pid, :pname, :qty, :price)
            """),
            {
                "oid": order_id,
                "pid": item[0],
                "pname": item[1],
                "qty": item[3],
                "price": float(item[2]),
            },
        )

    # Descontar stock
    for item in cart:
        db.execute(
            text("UPDATE products SET stock = stock - :qty WHERE id = :pid"),
            {"qty": item[3], "pid": item[0]},
        )

    # Limpiar carrito
    db.execute(text("DELETE FROM cart_items WHERE user_id = :uid"), {"uid": user_id})
    db.commit()

    return {"order_id": order_id, "order_number": order_number, "total": total}


@router.get("/")
def list_orders(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id, order_number, total, status, payment_status, created_at
            FROM orders WHERE user_id = :uid ORDER BY created_at DESC
        """),
        {"uid": user_id},
    ).fetchall()
    return [
        {
            "id": r[0],
            "order_number": r[1],
            "total": float(r[2]),
            "status": r[3],
            "payment_status": r[4],
            "created_at": str(r[5]),
        }
        for r in rows
    ]


@router.get("/{order_id}")
def get_order(
    order_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    order = db.execute(
        text("""
            SELECT id, user_id, order_number, total, status,
                   payment_id, payment_status, payment_date, created_at
            FROM orders WHERE id = :id AND user_id = :uid
        """),
        {"id": order_id, "uid": user_id},
    ).fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    items = db.execute(
        text("SELECT product_name, quantity, unit_price FROM order_items WHERE order_id = :oid"),
        {"oid": order_id},
    ).fetchall()

    return {
        "id": order[0],
        "order_number": order[2],
        "total": float(order[3]),
        "status": order[4],
        "payment_id": order[5],
        "payment_status": order[6],
        "payment_date": str(order[7]) if order[7] else None,
        "created_at": str(order[8]),
        "items": [{"name": i[0], "quantity": i[1], "price": float(i[2])} for i in items],
    }
