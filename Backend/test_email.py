import os
import sys
from dotenv import load_dotenv

# Add Backend to python path to load app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Verify settings
from app.core.config import settings
from app.services.email_service import send_email_raw, BASE_HTML_TEMPLATE

print("====================================================")
print("     CrochetCreation Resend Email Test Script       ")
print("====================================================")

api_key = settings.RESEND_API_KEY
from_email = settings.EMAIL_FROM

if not api_key:
    print("❌ ERROR: RESEND_API_KEY is not set in your .env file!")
    sys.exit(1)

from fastapi import BackgroundTasks
from app.services.email_service import queue_welcome_email

print(f"API Key: {api_key[:10]}...{api_key[-5:] if len(api_key) > 15 else ''}")
print(f"Sender Email: {from_email}")

recipient = input("\nEnter recipient email address for testing: ").strip()
if not recipient:
    print("❌ Recipient email cannot be empty!")
    sys.exit(1)

print(f"\nSending premium welcome email with SVG animations to {recipient}...")

user_data = {
    "first_name": "Samiran",
    "last_name": "Samanta",
    "email": recipient,
    "mobile": "8637510045"
}

background_tasks = BackgroundTasks()
try:
    queue_welcome_email(background_tasks, user_data)
    
    # Execute background tasks synchronously for testing
    success = False
    for task in background_tasks.tasks:
        success = task.func(*task.args, **task.kwargs)
        
    if success:
        print("✅ SUCCESS! Animated welcome email has been successfully sent via Resend.")
        print("Please check your inbox (and spam folder if not found).")
    else:
        print("❌ FAILED! Failed to send email. Check the error log output above.")
except Exception as e:
    print(f"❌ ERROR: An unexpected error occurred: {str(e)}")

