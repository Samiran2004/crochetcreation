import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

# Compatibility patch for bcrypt 4.1.0+ and passlib
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        class About:
            __version__ = getattr(bcrypt, "__version__", "4.0.0")
        bcrypt.__about__ = About()
except ImportError:
    pass

from passlib.context import CryptContext

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "crochetcreation")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def main():
    print("====================================================")
    print("     CrochetCreation Admin Account Creator Script   ")
    print("====================================================")
    
    # 1. Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        users_col = db["users"]
        # Test connection
        client.admin.command('ping')
        print(f"Connected to MongoDB database: '{DATABASE_NAME}'")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("\nPlease make sure MONGO_URI is correctly configured in your .env file.")
        sys.exit(1)

    # 2. Get inputs
    print("\nPlease enter details for the Admin account (press Enter to use default values):")
    
    first_name = input("First Name [Samiran]: ").strip() or "Samiran"
    last_name = input("Last Name [Samanta]: ").strip() or "Samanta"
    email = input("Email [samiran.samanta.dev@gmail.com]: ").strip().lower() or "samiran.samanta.dev@gmail.com"
    mobile = input("Mobile Number [8637510045]: ").strip() or "8637510045"
    password = input("Password [admin123]: ").strip() or "admin123"

    # 3. Check if user already exists
    existing = users_col.find_one({
        "$or": [
            {"email": email},
            {"mobile": mobile}
        ]
    })
    
    hashed_password = pwd_context.hash(password)
    
    user_doc = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "mobile": mobile,
        "hashed_password": hashed_password,
        "is_admin": True
    }

    if existing:
        print(f"\nUser with Email: '{email}' or Mobile: '{mobile}' already exists.")
        update_choice = input("Would you like to upgrade this user to Admin & update password? (y/n): ").strip().lower()
        if update_choice == 'y':
            users_col.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "mobile": mobile,
                    "hashed_password": hashed_password,
                    "is_admin": True
                }}
            )
            print("\nSuccessfully updated existing user to Admin with new password!")
        else:
            print("\nOperation cancelled.")
            sys.exit(0)
    else:
        # Create new
        users_col.insert_one(user_doc)
        print("\nSuccessfully created new Admin user in the database!")

    print("\n----------------------------------------------------")
    print("Admin Account Details:")
    print(f"Name:     {first_name} {last_name}")
    print(f"Email:    {email}")
    print(f"Mobile:   {mobile}")
    print(f"Password: {password}")
    print("----------------------------------------------------")

if __name__ == "__main__":
    main()
