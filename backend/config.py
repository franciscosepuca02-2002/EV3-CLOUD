import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ev3clouddb"

    # JWT
    SECRET_KEY: str = "cambiar-esta-clave-secreta"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Mercado Pago (para consultar estado de pagos directamente)
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-2"
    S3_BUCKET_NAME: str = "ev3-cloud-storage"

    # SES
    SES_SENDER_EMAIL: str = ""

    # Microservicios internos
    PAYMENT_SERVICE_URL: str = "http://app-pagos:8002"
    NOTIFICATION_SERVICE_URL: str = "http://app-notificaciones:8001"

    # URLs públicas (para Mercado Pago back_urls)
    FRONTEND_URL: str = "http://localhost:4200"

    class Config:
        env_file = ".env"


settings = Settings()
