import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Ensure the backend app directory is in Python PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Configure simple stdout logging so the user can see HTTP request/response details
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

try:
    from app.core.config import settings
    from app.utils.email_sender import send_order_email
    from app.utils.pdf_generator import generate_invoice_pdf
except ImportError as e:
    print(f"❌ ERROR: Failed to import backend modules: {str(e)}")
    print("Please make sure you are running this script inside the 'Backend' directory.")
    sys.exit(1)

async def test_invoice_delivery():
    print("====================================================")
    print("  Crochet Creation Invoice PDF & Email Test Tool    ")
    print("====================================================")

    # 1. Validate Configurations
    api_key = settings.BREVO_API_KEY
    sender_email = settings.SENDER_EMAIL

    if not api_key:
        print("❌ ERROR: BREVO_API_KEY is not defined in your environment/settings!")
        print("Please check your .env file or configuration parameters.")
        return

    if not sender_email:
        print("❌ ERROR: SENDER_EMAIL is not defined in your environment/settings!")
        return

    print(f"✅ BREVO_API_KEY is loaded (Prefix: {api_key[:10]}...)")
    print(f"✅ SENDER_EMAIL: {sender_email}")

    # 2. Get Test Recipient
    recipient = input("\nEnter recipient email address for testing: ").strip()
    if not recipient:
        print("❌ ERROR: Recipient email address cannot be empty.")
        return

    # 3. Premium Order Details for PDF invoice and email templates
    test_order = {
        "id": "64a09b32fa0d140c176c5a86",
        "customer_name": "Premium Customer",
        "customer_email": recipient,
        "customer_mobile": "+91 98765 43210",
        "shipping_address": "Flat 4B, Loom Weaver Residency, Handcrafted Lane, Kolkata - 700029",
        "payment_method": "UPI",
        "total_amount": 1850.0,
        "transaction_id": "TXN982347610",
        "notes": "Custom color request: Light pastel pink border. UPI UTR: 618290384729",
        "created_at": "2026-07-03T15:53:12Z",
        "items": [
            {
                "title": "Bespoke Pastel Flower Crochet Cardigan 🌸",
                "quantity": 1,
                "price": 1250.0
            },
            {
                "title": "Cute Amigurumi Crochet Bunny Plushie 🐰",
                "quantity": 2,
                "price": 300.0
            }
        ]
    }

    # 4. Generate the PDF invoice in-memory
    print("\n[Step 1/3] Generating PDF Invoice in-memory...")
    try:
        pdf_bytes = await generate_invoice_pdf(test_order)
        print(f"✅ PDF Invoice generated successfully! ({len(pdf_bytes)} bytes)")
        
        # Save a copy locally so the user can verify the visual design
        pdf_filename = "test_invoice_output.pdf"
        with open(pdf_filename, "wb") as f:
            f.write(pdf_bytes)
        print(f"💾 Local copy saved as: {pdf_filename} (Open it to check the cream template design!)")
    except Exception as err:
        print(f"❌ ERROR: Failed to generate PDF invoice: {str(err)}")
        return

    # 5. Trigger sending via Brevo with attachment
    print(f"\n[Step 2/3] Sending email to {recipient} with attached invoice PDF...")
    try:
        await send_order_email(
            to_email=recipient,
            customer_name="Premium Customer",
            order_details=test_order,
            pdf_bytes=pdf_bytes
        )
        print("\n====================================================")
        print("🎉 Script finished executing!")
        print("Please check the console logs above to see if it succeeded.")
        print(f"Check the Inbox/Spam folder of {recipient} for the confirmation email with 'Invoice_CrochetCreation_64a09b32fa0d140c176c5a86.pdf' attached.")
        print("====================================================")
    except Exception as err:
        print(f"\n❌ ERROR: Unexpected exception caught while running test: {str(err)}")

if __name__ == "__main__":
    # Run the async test suite
    asyncio.run(test_invoice_delivery())
