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
except ImportError as e:
    print(f"❌ ERROR: Failed to import backend modules: {str(e)}")
    print("Please make sure you are running this script inside the 'Backend' directory.")
    sys.exit(1)

async def test_brevo_delivery():
    print("====================================================")
    print("      Crochet Creation Brevo Email Test Tool        ")
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

    # 3. Dummy Order Details for preview
    test_order = {
        "id": "64a09b32fa0d140c176c5a86",
        "total_amount": 450.0,
        "payment_method": "COD",
        "items": [
            {
                "title": "Cozy Pink Crochet Beanie 🧶",
                "quantity": 1,
                "price": 250.0
            },
            {
                "title": "Bespoke Amigurumi Octopus 🐙",
                "quantity": 1,
                "price": 200.0
            }
        ]
    }

    print(f"\nSending order confirmation email to: {recipient}...")
    print("Please wait...")

    # 4. Trigger sending
    try:
        await send_order_email(recipient, "Valued Customer", test_order)
        print("\n====================================================")
        print("🎉 Script finished executing!")
        print("Please check the console logs above to see if it succeeded.")
        print("Check your Inbox / Spam folder of the recipient email address.")
        print("====================================================")
    except Exception as err:
        print(f"\n❌ ERROR: Unexpected exception caught while running test: {str(err)}")

if __name__ == "__main__":
    # Run the async test suite
    asyncio.run(test_brevo_delivery())
