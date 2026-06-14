from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from services.email_sender import (
    send_verification_email,
    send_purchase_email,
    send_payment_email,
)
from services.sms_sender import send_file_sms
from services.whatsapp_sender import send_file_whatsapp

app = FastAPI(title="Microservicio de Notificaciones", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Schemas ----------

class VerificationRequest(BaseModel):
    email: str
    full_name: str
    code: str


class PurchaseItem(BaseModel):
    name: str
    quantity: int
    price: float


class PurchaseEmailRequest(BaseModel):
    email: str
    full_name: str
    order_number: str
    total: float
    items: List[PurchaseItem]
    purchase_date: str


class PaymentEmailRequest(BaseModel):
    email: str
    full_name: str
    payment_id: str
    payment_status: str
    payment_date: str
    amount: float
    order_number: str
    items: List[PurchaseItem]


class FileNotificationRequest(BaseModel):
    phone: Optional[str] = None
    full_name: str
    file_name: str
    upload_date: str
    space_used: int
    space_available: int


# ---------- Endpoints ----------

@app.get("/health")
def health():
    return {"status": "ok", "service": "microservicio-notificaciones"}


@app.post("/send-verification")
def endpoint_send_verification(req: VerificationRequest):
    ok = send_verification_email(req.email, req.full_name, req.code)
    return {"status": "sent" if ok else "error"}


@app.post("/send-purchase-email")
def endpoint_send_purchase(req: PurchaseEmailRequest):
    ok = send_purchase_email(
        req.email, req.full_name, req.order_number,
        req.total, req.items, req.purchase_date,
    )
    return {"status": "sent" if ok else "error"}


@app.post("/send-payment-email")
def endpoint_send_payment(req: PaymentEmailRequest):
    ok = send_payment_email(
        req.email, req.full_name, req.payment_id,
        req.payment_status, req.payment_date, req.amount,
        req.order_number, req.items,
    )
    return {"status": "sent" if ok else "error"}


@app.post("/send-file-notification")
def endpoint_send_file_notification(req: FileNotificationRequest):
    sms_ok = False
    whatsapp_ok = False

    if req.phone:
        sms_ok = send_file_sms(
            req.phone, req.file_name, req.upload_date,
            req.space_used, req.space_available,
        )
        whatsapp_ok = send_file_whatsapp(
            req.phone, req.file_name, req.upload_date,
            req.space_used, req.space_available,
        )

    return {
        "sms": "sent" if sms_ok else "error_or_no_phone",
        "whatsapp": "sent" if whatsapp_ok else "error_or_no_phone",
    }
