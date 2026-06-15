from pydantic import BaseModel, Field

class SettingsModel(BaseModel):
    store_name: str = "CrochetCreation"
    support_email: str = "support@crochetcreation.com"
    support_phone: str = "+91 86375 10045"
    currency: str = "INR"
    enable_cod: bool = True
    enable_upi: bool = True
    upi_id: str = "samiran.samanta@upi"
    max_custom_requests_per_day: int = 5
    enable_email_notifications: bool = True
