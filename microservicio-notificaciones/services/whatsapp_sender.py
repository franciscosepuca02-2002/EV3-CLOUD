import os
from twilio.rest import Client


def _format_bytes(b: int) -> str:
    if b >= 1_073_741_824:
        return f"{b / 1_073_741_824:.2f} GB"
    if b >= 1_048_576:
        return f"{b / 1_048_576:.2f} MB"
    return f"{b / 1024:.2f} KB"


def send_file_whatsapp(phone: str, file_name: str, upload_date: str,
                       space_used: int, space_available: int) -> bool:
    sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    token = os.getenv("TWILIO_AUTH_TOKEN", "")
    wa_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "")

    if not all([sid, token, wa_number, phone]):
        print("[WARN] Twilio WhatsApp no configurado o sin teléfono destino")
        return False

    try:
        client = Client(sid, token)
        client.messages.create(
            body=(
                f"📁 *Archivo subido exitosamente*\n\n"
                f"Archivo: {file_name}\n"
                f"Fecha: {upload_date}\n"
                f"Espacio usado: {_format_bytes(space_used)}\n"
                f"Espacio disponible: {_format_bytes(space_available)}"
            ),
            from_=f"whatsapp:{wa_number}",
            to=f"whatsapp:{phone}",
        )
        print(f"[OK] WhatsApp enviado a {phone}")
        return True
    except Exception as e:
        print(f"[ERROR] WhatsApp Twilio: {e}")
        return False
