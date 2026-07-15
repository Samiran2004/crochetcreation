from motor.motor_asyncio import AsyncIOMotorClient # Async driver for mongoDB for async work
from app.core.config import settings
from bson import ObjectId
from datetime import datetime, timezone

class MockCursor:
    def __init__(self, data):
        self.data = data
    
    async def to_list(self, length=None):
        if length is not None:
            return self.data[:length]
        return self.data
    
    def skip(self, n):
        return self
        
    def limit(self, n):
        return self
        
    def sort(self, *args, **kwargs):
        return self

class MockInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class MockUpdateResult:
    def __init__(self, modified_count=0, upserted_id=None):
        self.modified_count = modified_count
        self.upserted_id = upserted_id

class MockDeleteResult:
    def __init__(self, deleted_count=0):
        self.deleted_count = deleted_count

class MockCollection:
    def __init__(self, name, db):
        self.name = name
        self.db = db
        if name not in self.db._store:
            self.db._store[name] = []
            
    def _matches_filter(self, doc, filter):
        if not filter:
            return True
        if "$or" in filter:
            or_clauses = filter["$or"]
            or_match = False
            for clause in or_clauses:
                if self._matches_filter(doc, clause):
                    or_match = True
                    break
            if not or_match:
                return False
            other_filter = {k: v for k, v in filter.items() if k != "$or"}
            return self._matches_filter(doc, other_filter)
            
        for k, v in filter.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    async def find_one(self, filter, *args, **kwargs):
        for doc in self.db._store[self.name]:
            if self._matches_filter(doc, filter):
                return doc
        return None
        
    def find(self, filter=None, *args, **kwargs):
        filter = filter or {}
        results = []
        for doc in self.db._store[self.name]:
            if self._matches_filter(doc, filter):
                results.append(doc)
        return MockCursor(results)
        
    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.db._store[self.name].append(document)
        return MockInsertResult(document["_id"])
        
    async def update_one(self, filter, update, upsert=False):
        doc = await self.find_one(filter)
        if not doc:
            if upsert:
                new_doc = filter.copy()
                if "$set" in update:
                    new_doc.update(update["$set"])
                await self.insert_one(new_doc)
                return MockUpdateResult(modified_count=1, upserted_id=new_doc.get("_id"))
            return MockUpdateResult(modified_count=0)
        if "$set" in update:
            doc.update(update["$set"])
        return MockUpdateResult(modified_count=1)
        
    async def delete_one(self, filter):
        doc = await self.find_one(filter)
        if doc:
            self.db._store[self.name].remove(doc)
            return MockDeleteResult(deleted_count=1)
        return MockDeleteResult(deleted_count=0)
        
    async def find_one_and_update(self, filter, update, upsert=False, return_document=False):
        doc = await self.find_one(filter)
        if not doc:
            if upsert:
                new_doc = filter.copy()
                if "$set" in update:
                    new_doc.update(update["$set"])
                await self.insert_one(new_doc)
                return new_doc
            return None
        if "$set" in update:
            doc.update(update["$set"])
        if return_document:
            return doc
        return None

    async def count_documents(self, filter=None):
        filter = filter or {}
        count = 0
        for doc in self.db._store[self.name]:
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

class MockDatabase:
    def __init__(self):
        self._store = {}
        # Prepopulate default admin user
        self._store["users"] = [{
            "_id": ObjectId("647a7b8e1f3d8a5c4e9d0e12"),
            "first_name": "Samiran",
            "last_name": "Samanta",
            "email": "samiran.samanta.dev@gmail.com",
            "mobile": "8637510045",
            "hashed_password": "$2b$12$n2mDEpwA.PPUFcSUpxNTNevDKGWayhORc6ZvjQZCQVu734srGWwXq",
            "is_admin": True
        }]
        # Prepopulate default settings
        self._store["homepage_images"] = [{
            "_id": "homepage_images",
            "images": {
                "heroYarn": {"url": "/assets/marilyn_hero_yarn.png", "public_id": "mock_hero_yarn"},
                "craftingTools": {"url": "/assets/marilyn_crafting_tools.png", "public_id": "mock_crafting_tools"},
                "stackedSweaters": {"url": "/assets/marilyn_stacked_sweaters.png", "public_id": "mock_stacked_sweaters"},
                "womanKnitting": {"url": "/assets/marilyn_woman_knitting.png", "public_id": "mock_woman_knitting"},
                "knitTexture": {"url": "/assets/marilyn_knit_texture.png", "public_id": "mock_knit_texture"},
                "customerAlice": {"url": "/assets/marilyn_customer_alice.png", "public_id": "mock_customer_alice"},
                "logo": {"url": "/assets/crochet_creation_logo.png", "public_id": "mock_logo"}
            }
        }]
        # Seed a dummy product
        self._store["products"] = [{
            "_id": ObjectId("647a7b8e1f3d8a5c4e9d0e99"),
            "title": "Beautiful Woolen Crochet Flower Pot",
            "description": "Lovingly hand-knitted mini flower pot made from premium quality organic cotton. Perfect for car dashboards, work desks, and cozy corners.",
            "price": 499.00,
            "originalPrice": 799.00,
            "sellingPrice": 499.00,
            "category": "TOYS",
            "image_url": "/assets/marilyn_crafting_tools.png",
            "image_urls": ["/assets/marilyn_crafting_tools.png", "/assets/marilyn_knit_texture.png"],
            "size": "Height: 12cm, Width: 8cm",
            "materials": "100% Organic Cotton Yarn, Fiberfill stuffing",
            "care_instructions": "Handwash with mild liquid detergent. Dry flat in shade.",
            "in_stock": True
        }]
        # Seed a dummy order
        self._store["orders"] = [{
            "_id": ObjectId("647a7b8e1f3d8a5c4e8d0e77"),
            "customer_name": "Rohan Das",
            "customer_email": "rohan.das@example.com",
            "customer_mobile": "9876543210",
            "items": [{
                "product_id": "647a7b8e1f3d8a5c4e9d0e99",
                "title": "Beautiful Woolen Crochet Flower Pot",
                "price": 499.00,
                "quantity": 1
            }],
            "total_amount": 499.00,
            "payment_method": "COD",
            "status": "Pending",
            "created_at": datetime.now(timezone.utc)
        }]
        
    def __getitem__(self, name):
        return MockCollection(name, self)

    async def command(self, cmd, *args, **kwargs):
        if cmd == "ping":
            return {"ok": 1.0}
        raise NotImplementedError(f"Command {cmd} is not implemented in MockDatabase.")

class Database:
    client = None
    db = None

db_instance = Database()

# Connect Database...
async def connect_to_mongo():
    import os
    try:
        # Compatibility patch for bcrypt 4.1.0+ and passlib
        try:
            import bcrypt
            if not hasattr(bcrypt, "__about__"):
                class About:
                    __version__ = getattr(bcrypt, "__version__", "4.0.0")
                bcrypt.__about__ = About()
        except ImportError:
            pass

        # Try standard client initialization
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=30000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Ping the admin database to verify active connection (AsyncIOMotorClient is lazy)
        await db_instance.client.admin.command('ping')
        print("Connected to MongoDB Atlas successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB Atlas: {e}")
        
        is_render = "RENDER" in os.environ
        fallback_enabled = getattr(settings, "DB_FALLBACK_ENABLED", False)
        
        if fallback_enabled and not is_render:
            print("Falling back to in-memory MockDatabase.")
            db_instance.client = None
            db_instance.db = MockDatabase()
        else:
            print("Database connection failed. Fallback is disabled. Database instance set to None.")
            db_instance.client = None
            db_instance.db = None

# Close database connection...
def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_database():
    return db_instance.db
