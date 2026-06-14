from datetime import datetime

import boto3
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from models import get_db
from utils.security import get_current_user_id

router = APIRouter()


def _get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


def _format_bytes(b: int) -> str:
    if b >= 1_073_741_824:
        return f"{b / 1_073_741_824:.2f} GB"
    if b >= 1_048_576:
        return f"{b / 1_048_576:.2f} MB"
    return f"{b / 1024:.2f} KB"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Obtener datos del usuario
    user = db.execute(
        text(
            "SELECT storage_used_bytes, storage_limit_bytes, email, phone, full_name "
            "FROM users WHERE id = :id"
        ),
        {"id": user_id},
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    contents = await file.read()
    file_size = len(contents)

    # Verificar espacio disponible
    if user[0] + file_size > user[1]:
        raise HTTPException(
            status_code=400,
            detail=f"No hay espacio suficiente. "
                   f"Disponible: {_format_bytes(user[1] - user[0])}, "
                   f"Archivo: {_format_bytes(file_size)}",
        )

    # Subir a S3 (Alternativa B: bucket centralizado con carpetas por usuario)
    s3_key = f"users/{user_id}/{file.filename}"
    s3 = _get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=contents,
            ContentType=file.content_type or "application/octet-stream",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo archivo a S3: {str(e)}")

    # Registrar en DB
    new_used = user[0] + file_size
    db.execute(
        text("""
            INSERT INTO user_files (user_id, file_name, file_key, file_size, content_type)
            VALUES (:uid, :fname, :fkey, :fsize, :ctype)
        """),
        {
            "uid": user_id,
            "fname": file.filename,
            "fkey": s3_key,
            "fsize": file_size,
            "ctype": file.content_type,
        },
    )
    db.execute(
        text("UPDATE users SET storage_used_bytes = :used WHERE id = :id"),
        {"used": new_used, "id": user_id},
    )
    db.commit()

    space_available = user[1] - new_used

    # Enviar notificación SMS/WhatsApp vía microservicio de notificaciones
    try:
        httpx.post(
            f"{settings.NOTIFICATION_SERVICE_URL}/send-file-notification",
            json={
                "phone": user[3],
                "full_name": user[4],
                "file_name": file.filename,
                "upload_date": datetime.utcnow().isoformat(),
                "space_used": new_used,
                "space_available": space_available,
            },
            timeout=10,
        )
    except Exception as e:
        print(f"[WARN] Error enviando notificación SMS/WhatsApp: {e}")

    return {
        "message": "Archivo subido exitosamente",
        "file_name": file.filename,
        "file_size": file_size,
        "file_size_formatted": _format_bytes(file_size),
        "space_used": new_used,
        "space_used_formatted": _format_bytes(new_used),
        "space_available": space_available,
        "space_available_formatted": _format_bytes(space_available),
    }


@router.get("/")
def list_files(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    files = db.execute(
        text("""
            SELECT id, file_name, file_size, content_type, uploaded_at
            FROM user_files WHERE user_id = :uid ORDER BY uploaded_at DESC
        """),
        {"uid": user_id},
    ).fetchall()

    return [
        {
            "id": f[0],
            "file_name": f[1],
            "file_size": f[2],
            "file_size_formatted": _format_bytes(f[2]),
            "content_type": f[3],
            "uploaded_at": str(f[4]),
        }
        for f in files
    ]


@router.get("/storage")
def get_storage_info(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT storage_used_bytes, storage_limit_bytes FROM users WHERE id = :id"),
        {"id": user_id},
    ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    used, limit = user[0], user[1]
    available = limit - used
    return {
        "used_bytes": used,
        "limit_bytes": limit,
        "available_bytes": available,
        "used_formatted": _format_bytes(used),
        "limit_formatted": _format_bytes(limit),
        "available_formatted": _format_bytes(available),
        "percentage_used": round((used / limit) * 100, 2) if limit > 0 else 0,
    }


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    file_row = db.execute(
        text("SELECT file_key, file_size FROM user_files WHERE id = :id AND user_id = :uid"),
        {"id": file_id, "uid": user_id},
    ).fetchone()

    if not file_row:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # Eliminar de S3
    s3 = _get_s3_client()
    try:
        s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=file_row[0])
    except Exception as e:
        print(f"[WARN] Error eliminando de S3: {e}")

    # Actualizar DB
    db.execute(text("DELETE FROM user_files WHERE id = :id"), {"id": file_id})
    db.execute(
        text("UPDATE users SET storage_used_bytes = GREATEST(storage_used_bytes - :size, 0) WHERE id = :uid"),
        {"size": file_row[1], "uid": user_id},
    )
    db.commit()
    return {"message": "Archivo eliminado exitosamente"}
