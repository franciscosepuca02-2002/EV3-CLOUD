from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from models import get_db

router = APIRouter()


@router.get("/")
def list_products(db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT id, name, description, price, stock, image_url FROM products ORDER BY id")
    ).fetchall()
    return [
        {
            "id": r[0],
            "name": r[1],
            "description": r[2],
            "price": float(r[3]),
            "stock": r[4],
            "image_url": r[5],
        }
        for r in rows
    ]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    r = db.execute(
        text("SELECT id, name, description, price, stock, image_url FROM products WHERE id = :id"),
        {"id": product_id},
    ).fetchone()
    if not r:
        raise Exception("Producto no encontrado")
    return {
        "id": r[0],
        "name": r[1],
        "description": r[2],
        "price": float(r[3]),
        "stock": r[4],
        "image_url": r[5],
    }
