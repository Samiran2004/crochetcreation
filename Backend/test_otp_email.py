import os
import sys
from dotenv import load_dotenv

# Add Backend to python path to load app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.core.config import settings
from fastapi import BackgroundTasks
from app.services.email_service import queue_otp_email

print("====================================================")
print("   CrochetCreation Resend OTP Email Test Script     ")
print("====================================================")

api_key = settings.RESEND_API_KEY
from_email = settings.EMAIL_FROM

if not api_key:
    print("❌ ERROR: RESEND_API_KEY is not set in your .env file!")
    sys.exit(1)

recipient = input("\nEnter recipient email address for testing: ").strip()
if not recipient:
    print("❌ Recipient email cannot be empty!")
    sys.exit(1)

print(f"\nSending premium OTP verification email with animations to {recipient}...")

background_tasks = BackgroundTasks()
try:
    queue_otp_email(background_tasks, recipient, "857294")
    
    # Execute background tasks synchronously for testing
    success = False
    for task in background_tasks.tasks:
        success = task.func(*task.args, **task.kwargs)
        
    if success:
        print("✅ SUCCESS! Animated OTP email has been successfully sent via Resend.")
        print("Please check your inbox.")
    else:
        print("❌ FAILED! Failed to send email. Check the error log output above.")
except Exception as e:
    print(f"❌ ERROR: An unexpected error occurred: {str(e)}")
