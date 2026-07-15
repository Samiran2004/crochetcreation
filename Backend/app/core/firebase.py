import os
import firebase_admin
from firebase_admin import credentials, auth
import json

def initialize_firebase():
    if not firebase_admin._apps:
        try:
            # We construct the credentials dictionary from environment variables
            # This avoids needing a physical serviceAccountKey.json file in production
            cert_dict = {
                "type": "service_account",
                "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
                "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID", ""),
                "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.environ.get("FIREBASE_CLIENT_ID", ""),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_CERT_URL", f"https://www.googleapis.com/robot/v1/metadata/x509/{os.environ.get('FIREBASE_CLIENT_EMAIL', '')}"),
                "universe_domain": "googleapis.com"
            }
            
            # Only initialize if the crucial variables exist
            if cert_dict["project_id"] and cert_dict["private_key"] and cert_dict["client_email"]:
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized successfully.")
            else:
                print("Warning: Firebase credentials missing in environment variables.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")

# Call it immediately when the module is imported
initialize_firebase()
