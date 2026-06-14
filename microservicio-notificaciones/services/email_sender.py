import os

import boto3

ses_client = boto3.client(
    "ses",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_SES_REGION", os.getenv("AWS_REGION", "us-east-2")),
)

SENDER = os.getenv("SES_SENDER_EMAIL", "")


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not SENDER:
        print("[WARN] SES_SENDER_EMAIL no configurado, correo no enviado")
        return False
    try:
        ses_client.send_email(
            Source=SENDER,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
            },
        )
        print(f"[OK] Correo enviado a {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[ERROR] SES: {e}")
        return False


def send_verification_email(email: str, name: str, code: str) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
        <h2 style="color: #1a56db;">¡Hola {name}!</h2>
        <p>Gracias por registrarte. Tu código de verificación es:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #1a56db;
                         letter-spacing: 8px; background: #f0f4ff; padding: 15px 25px;
                         border-radius: 8px;">{code}</span>
        </div>
        <p style="color: #666;">Este código expira en <strong>15 minutos</strong>.</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste esta verificación, ignora este correo.</p>
    </div>
    """
    return _send_email(email, "Código de verificación - EV3 Cloud", html)


def send_purchase_email(email, name, order_number, total, items, purchase_date) -> bool:
    items_html = "".join(
        f"<tr><td style='padding:8px;border:1px solid #ddd;'>{i.name}</td>"
        f"<td style='padding:8px;border:1px solid #ddd;text-align:center;'>{i.quantity}</td>"
        f"<td style='padding:8px;border:1px solid #ddd;text-align:right;'>${i.price:,.0f}</td></tr>"
        for i in items
    )
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #16a34a;">¡Gracias por tu compra, {name}!</h2>
        <p><strong>Número de compra:</strong> {order_number}</p>
        <p><strong>Fecha:</strong> {purchase_date}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#f0f4ff;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Producto</th>
                <th style="padding:8px;border:1px solid #ddd;">Cantidad</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Precio</th>
            </tr>
            {items_html}
        </table>
        <h3 style="text-align:right;color:#1a56db;">Total: ${total:,.0f}</h3>
    </div>
    """
    return _send_email(email, f"Confirmación de compra {order_number}", html)


def send_payment_email(email, name, payment_id, payment_status, payment_date,
                       amount, order_number, items) -> bool:
    items_html = "".join(
        f"<tr><td style='padding:8px;border:1px solid #ddd;'>{i.name}</td>"
        f"<td style='padding:8px;border:1px solid #ddd;text-align:center;'>{i.quantity}</td>"
        f"<td style='padding:8px;border:1px solid #ddd;text-align:right;'>${i.price:,.0f}</td></tr>"
        for i in items
    )
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #1a56db;">Detalle de pago - Mercado Pago</h2>
        <p>Hola {name},</p>
        <table style="margin:20px 0;">
            <tr><td style="padding:5px;"><strong>ID Transacción:</strong></td><td style="padding:5px;">{payment_id}</td></tr>
            <tr><td style="padding:5px;"><strong>Estado:</strong></td><td style="padding:5px;">{payment_status}</td></tr>
            <tr><td style="padding:5px;"><strong>Fecha de pago:</strong></td><td style="padding:5px;">{payment_date}</td></tr>
            <tr><td style="padding:5px;"><strong>Monto pagado:</strong></td><td style="padding:5px;">${amount:,.0f}</td></tr>
        </table>
        <h3>Resumen de la compra ({order_number}):</h3>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
            <tr style="background:#f0f4ff;">
                <th style="padding:8px;border:1px solid #ddd;text-align:left;">Producto</th>
                <th style="padding:8px;border:1px solid #ddd;">Cantidad</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right;">Precio</th>
            </tr>
            {items_html}
        </table>
    </div>
    """
    return _send_email(email, f"Pago confirmado - {order_number}", html)
