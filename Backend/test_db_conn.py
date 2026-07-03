import os
import sys
import socket
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables
load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DATABASE_NAME", "crochetcreation")

print("--- MongoDB Atlas Diagnostics ---")
print(f"MONGO_URI: {mongo_uri.split('@')[-1] if mongo_uri else 'Not found'}")
print(f"DB Name: {db_name}")

if not mongo_uri:
    print("ERROR: MONGO_URI is not set in the .env file.")
    sys.exit(1)

# Step 1: Check DNS Resolution
print("\n[Step 1] Checking DNS Resolution...")
domain = "cluster0.qlrswh4.mongodb.net"
try:
    ip = socket.gethostbyname(domain)
    print(f"SUCCESS: DNS resolved '{domain}' to {ip}")
except socket.gaierror as e:
    print(f"ERROR: DNS resolution failed for '{domain}'.")
    print(f"Details: {e}")
    print("Tip: Your ISP or router's DNS resolver might be having issues resolving Atlas domains. Try changing your DNS server to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).")

# Step 2: Check outbound port 27017
print("\n[Step 2] Checking if port 27017 is open/accessible...")
test_hosts = [
    "ac-8a5wv11-shard-00-00.qlrswh4.mongodb.net",
    "ac-8a5wv11-shard-00-01.qlrswh4.mongodb.net",
    "ac-8a5wv11-shard-00-02.qlrswh4.mongodb.net"
]

port = 27017
port_blocked = False

for host in test_hosts:
    try:
        s = socket.create_connection((host, port), timeout=3)
        s.close()
        print(f"SUCCESS: Connected to {host} on port {port}")
    except Exception as e:
        print(f"FAILED: Could not reach {host} on port {port}.")
        print(f"Details: {e}")
        port_blocked = True

if port_blocked:
    print("\nWARNING: One or more MongoDB shards could not be reached on port 27017.")
    print("Tip: This strongly indicates your ISP, router, or local firewall is blocking outbound TCP traffic on port 27017 (standard MongoDB port). Public Wi-Fi networks frequently block this port.")

# Step 3: Run full MongoClient Ping Test
print("\n[Step 3] Trying to establish MongoClient connection...")
try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    # Trigger connection
    client.admin.command('ping')
    print("SUCCESS: Connected and successfully pinged MongoDB Atlas cluster!")
    
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"SUCCESS: Connected to database '{db_name}'. Found collections: {collections}")
except Exception as e:
    print("\nERROR: Pymongo client failed to connect.")
    print(f"Details: {e}")
