import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "crochetcreation")
    
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # SECURITY: SECRET_KEY must be set via environment variable. No hardcoded fallback.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Resend configuration
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "crochetcreation@samiransamanta.in")

    # Brevo configuration
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")                                                                                     
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "crochetcreation@samiransamanta.in")

    # Cron-job.org configuration
    CRONJOB_API_KEY: str = os.getenv("CRONJOB_API_KEY", "")

    # Database Fallback Configuration
    DB_FALLBACK_ENABLED: bool = os.getenv("DB_FALLBACK_ENABLED", "false").lower() == "true"

    def __init__(self):
        if not self.SECRET_KEY:
            raise RuntimeError(
                "FATAL: SECRET_KEY environment variable is not set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\" "
                "and add it to your .env file."
            )

settings = Settings()
