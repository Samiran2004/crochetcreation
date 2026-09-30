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

    # Where new uploads go: "cloudinary" or "r2". Existing assets keep working
    # either way, because their absolute URLs are stored on the documents that
    # reference them — so this can be flipped, and flipped back, at any time.
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "cloudinary").strip().lower()

    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET: str = os.getenv("R2_BUCKET", "")
    # The custom domain in front of the bucket, e.g. https://cdn.example.com.
    # Never the r2.dev address: Cloudflare rate-limits that one and says so.
    R2_PUBLIC_BASE_URL: str = os.getenv("R2_PUBLIC_BASE_URL", "").rstrip("/")

    # Uploads are re-encoded before they are stored. Bandwidth, not disk, is
    # what a media budget actually goes on, and an untouched phone photo is
    # several megabytes of it per visitor.
    IMAGE_MAX_DIMENSION: int = int(os.getenv("IMAGE_MAX_DIMENSION", "2000"))
    IMAGE_QUALITY: int = int(os.getenv("IMAGE_QUALITY", "82"))
    
    # SECURITY: SECRET_KEY must be set via environment variable. No hardcoded fallback.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080")) # 7 days
    
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
        if self.STORAGE_BACKEND == "r2":
            missing = [
                name
                for name in (
                    "R2_ACCOUNT_ID",
                    "R2_ACCESS_KEY_ID",
                    "R2_SECRET_ACCESS_KEY",
                    "R2_BUCKET",
                    "R2_PUBLIC_BASE_URL",
                )
                if not getattr(self, name)
            ]
            if missing:
                raise RuntimeError(
                    "FATAL: STORAGE_BACKEND=r2 but these are not set: "
                    + ", ".join(missing)
                    + ". Set them, or switch STORAGE_BACKEND back to cloudinary."
                )

        if not self.SECRET_KEY:
            raise RuntimeError(
                "FATAL: SECRET_KEY environment variable is not set. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\" "
                "and add it to your .env file."
            )

settings = Settings()
