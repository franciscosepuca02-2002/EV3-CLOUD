from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from models import get_db
from utils.security import (
    create_access_token,
    generate_verification_code,
    get_current_user_id,
    hash_password,
    verify_password,
)

router = APIRouter()


# ---------- Schemas ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class VerifyRequest(BaseModel):
    email: str
    code: str


# ---------- Endpoints ----------

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Verificar si ya existe
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"), {"email": req.email}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    hashed = hash_password(req.password)
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=15)

    result = db.execute(
        text("""
            INSERT INTO users (email, password_hash, full_name, phone,
                               verification_code, verification_code_expires)
            VALUES (:email, :pw, :name, :phone, :code, :expires)
            RETURNING id
        """),
        {
            "email": req.email,
            "pw": hashed,
            "name": req.full_name,
            "phone": req.phone,
            "code": code,
            "expires": expires,
        },
    )
    db.commit()
    user_id = result.fetchone()[0]

    # Enviar correo de validación vía microservicio de notificaciones
    try:
        httpx.post(
            f"{settings.NOTIFICATION_SERVICE_URL}/send-verification",
            json={"email": req.email, "full_name": req.full_name, "code": code},
            timeout=10,
        )
    except Exception as e:
        print(f"[WARN] Error enviando correo de verificación: {e}")

    return {
        "message": "Usuario registrado. Revisa tu correo para el código de verificación.",
        "user_id": user_id,
    }


@router.post("/verify")
def verify_account(req: VerifyRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text(
            "SELECT id, verification_code, verification_code_expires "
            "FROM users WHERE email = :email"
        ),
        {"email": req.email},
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user[1] != req.code:
        raise HTTPException(status_code=400, detail="Código incorrecto")
    if user[2] and datetime.utcnow() > user[2]:
        raise HTTPException(status_code=400, detail="Código expirado")

    db.execute(
        text(
            "UPDATE users SET is_verified = TRUE, verification_code = NULL "
            "WHERE id = :id"
        ),
        {"id": user[0]},
    )
    db.commit()
    return {"message": "Cuenta verificada exitosamente"}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text(
            "SELECT id, password_hash, is_verified, full_name "
            "FROM users WHERE email = :email"
        ),
        {"email": req.email},
    ).fetchone()

    if not user or not verify_password(req.password, user[1]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user[2]:
        raise HTTPException(
            status_code=403, detail="Cuenta no verificada. Revisa tu correo."
        )

    token = create_access_token({"user_id": user[0], "email": req.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user[0],
        "full_name": user[3],
    }


@router.get("/me")
def get_me(
    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    user = db.execute(
        text(
            "SELECT id, email, full_name, phone, "
            "storage_used_bytes, storage_limit_bytes "
            "FROM users WHERE id = :id"
        ),
        {"id": user_id},
    ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": user[0],
        "email": user[1],
        "full_name": user[2],
        "phone": user[3],
        "storage_used_bytes": user[4],
        "storage_limit_bytes": user[5],
    }
