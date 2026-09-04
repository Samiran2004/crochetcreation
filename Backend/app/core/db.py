import os
from motor.motor_asyncio import AsyncIOMotorClient # Async driver for mongoDB for async work
from app.core.config import settings
from bson import ObjectId
from datetime import datetime, timezone

class MockCursor:
    """
    Mirrors the parts of a Motor cursor the app actually uses. skip/limit/sort
    are applied for real so that pagination behaves the same in fallback mode
    as it does against Atlas.
    """

    def __init__(self, data):
        self.data = list(data)
        self._skip = 0
        self._limit = None

    async def to_list(self, length=None):
        result = self.data[self._skip:]
        if self._limit is not None:
            result = result[:self._limit]
        if length is not None:
            result = result[:length]
        return result

    def skip(self, n):
        self._skip = n or 0
        return self

    def limit(self, n):
        self._limit = n if n else None
        return self

    def sort(self, key_or_list, direction=1):
        # Accepts both sort("field", -1) and sort([("field", -1)]).
        if isinstance(key_or_list, str):
            keys = [(key_or_list, direction)]
        else:
            keys = list(key_or_list)

        for field, dir_ in reversed(keys):
            self.data.sort(
                key=lambda d: (d.get(field) is None, d.get(field)),
                reverse=(dir_ == -1),
            )
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

    async def distinct(self, key, filter=None):
        seen = []
        for doc in self.db._store[self.name]:
            if not self._matches_filter(doc, filter or {}):
                continue
            value = doc.get(key)
            if value is not None and value not in seen:
                seen.append(value)
        return seen

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
        # Optional local-only admin, seeded from the environment. Nothing is
        # hardcoded here: a committed password hash is a credential in git
        # history even when the fallback is disabled in production.
        self._store["users"] = []
        seed_email = os.getenv("MOCK_ADMIN_EMAIL", "")
        seed_password = os.getenv("MOCK_ADMIN_PASSWORD", "")
        if seed_email and seed_password:
            from app.core.security import get_password_hash
            self._store["users"].append({
                "_id": ObjectId(),
                "first_name": os.getenv("MOCK_ADMIN_FIRST_NAME", "Local"),
                "last_name": os.getenv("MOCK_ADMIN_LAST_NAME", "Admin"),
                "email": seed_email,
                "mobile": os.getenv("MOCK_ADMIN_MOBILE", ""),
                "hashed_password": get_password_hash(seed_password),
                "is_admin": True
            })
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
            "in_stock": True,
            "stock_quantity": 15,
            "stock_count": 15
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

async def ensure_indexes():
    """
    Create the indexes the hot paths depend on. `users.email` is read on every
    authenticated request, so without it each one is a collection scan.
    Safe to call on every boot — createIndex is idempotent.
    """
    db = db_instance.db
    if db is None or isinstance(db, MockDatabase):
        return
    try:
        await db["users"].create_index("email", unique=True)
        await db["users"].create_index("mobile", sparse=True)
        await db["products"].create_index("category")
        await db["orders"].create_index("user_id")
        await db["orders"].create_index("customer_email")
        await db["orders"].create_index([("created_at", -1)])
        await db["reviews"].create_index([("product_id", 1), ("user_id", 1)], unique=True)
        # OTPs clean themselves up once they expire.
        await db["otps"].create_index("email", unique=True)
        await db["otps"].create_index("expires_at", expireAfterSeconds=0)
        print("Database indexes ensured.")
    except Exception as e:
        # A failed index build must never stop the app from serving.
        print(f"Warning: could not ensure indexes: {e}")


# Close database connection...
def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed.")

def get_database():
    return db_instance.db
