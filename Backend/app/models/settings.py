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
    footer_about_text: str = "We design and craft premium, customized wool and cotton products, bringing warm smiles and authentic handmade joy to your homes."
    footer_email: str = "contact@crochetcreation.in"
    footer_hours: str = "Mon - Sat, 9:00 AM - 6:00 PM"
    footer_copyright_text: str = "Crochet Creation. All rights reserved."
