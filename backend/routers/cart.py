from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from models import get_db
from utils.security import get_current_user_id

router = APIRouter()


class CartItemRequest(BaseModel):
    product_id: int
    quantity: int = 1


@router.get("/")
def get_cart(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity,
                   (p.price * ci.quantity) AS subtotal
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = :uid
        """),
        {"uid": user_id},
    ).fetchall()

    items = [
        {
            "id": r[0],
            "product_id": r[1],
            "name": r[2],
            "price": float(r[3]),
            "quantity": r[4],
            "subtotal": float(r[5]),
        }
        for r in rows
    ]
    total = sum(i["subtotal"] for i in items)
    return {"items": items, "total": total}


@router.post("/add")
def add_to_cart(
    req: CartItemRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Verificar stock
    product = db.execute(
        text("SELECT stock FROM products WHERE id = :pid"), {"pid": req.product_id}
    ).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product[0] < req.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    existing = db.execute(
        text("SELECT id FROM cart_items WHERE user_id = :uid AND product_id = :pid"),
        {"uid": user_id, "pid": req.product_id},
    ).fetchone()

    if existing:
        db.execute(
            text("UPDATE cart_items SET quantity = quantity + :qty WHERE id = :id"),
            {"qty": req.quantity, "id": existing[0]},
        )
    else:
        db.execute(
            text(
                "INSERT INTO cart_items (user_id, product_id, quantity) "
                "VALUES (:uid, :pid, :qty)"
            ),
            {"uid": user_id, "pid": req.product_id, "qty": req.quantity},
        )
    db.commit()
    return {"message": "Producto agregado al carrito"}


@router.put("/{item_id}")
def update_cart_item(
    item_id: int,
    req: CartItemRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    db.execute(
        text("UPDATE cart_items SET quantity = :qty WHERE id = :id AND user_id = :uid"),
        {"qty": req.quantity, "id": item_id, "uid": user_id},
    )
    db.commit()
    return {"message": "Carrito actualizado"}


@router.delete("/{item_id}")
def remove_from_cart(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    db.execute(
        text("DELETE FROM cart_items WHERE id = :id AND user_id = :uid"),
        {"id": item_id, "uid": user_id},
    )
    db.commit()
    return {"message": "Producto eliminado del carrito"}


@router.delete("/")
def clear_cart(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM cart_items WHERE user_id = :uid"), {"uid": user_id})
    db.commit()
    return {"message": "Carrito vaciado"}
