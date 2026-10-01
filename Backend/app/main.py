import json
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import connect_to_mongo, close_mongo_connection, ensure_indexes
from app.routes.product_routes import router as product_router
from app.routes.auth_routes import router as auth_router
from app.routes.order_routes import router as order_router
from app.routes.settings_routes import router as settings_router
from app.routes.customer_routes import router as customer_router
from app.routes.admin_routes import router as admin_router
from app.routes.user_routes import router as user_router
from app.routes.review_routes import router as review_router
from app.routes.video_routes import router as video_router
from app.routes.thankyou_routes import router as thankyou_router
from app.routes.design_routes import router as design_router
from app.routes.design_routes import shared_router as design_shared_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas
    await connect_to_mongo()
    await ensure_indexes()
    yield
    # Shutdown: Close database connection
    close_mongo_connection()

app = FastAPI(
    title="CrochetCreation Backend API",
    description="Production-ready asynchronous FastAPI backend supporting MongoDB Atlas & Cloudinary",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://crochetcreation.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(product_router)
app.include_router(auth_router)
app.include_router(order_router)
app.include_router(settings_router)
app.include_router(customer_router)
app.include_router(admin_router)
app.include_router(user_router)
app.include_router(review_router)
app.include_router(video_router)
app.include_router(thankyou_router)
app.include_router(design_router)
app.include_router(design_shared_router)

# Configure Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routes.auth_routes import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": "CrochetCreation Backend API",
        "docs_url": "/docs"
    }

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    sanitized_errors = []
    for error in exc.errors():
        error_copy = error.copy()
        if "input" in error_copy and isinstance(error_copy["input"], bytes):
            error_copy["input"] = "<bytes>"
        sanitized_errors.append(error_copy)
    print("Validation Error:", sanitized_errors)
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(sanitized_errors)},
    )

@app.get("/ping")
async def keep_alive_ping():
    """Endpoint for cron jobs to keep the Render server awake."""
    return {"status": "Alive", "message": "Server is awake and running!"}

from fastapi import WebSocket, WebSocketDisconnect, Query
from app.api.deps import decode_access_token
from app.core.db import get_database
from app.utils.websocket import manager

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    # Same rules as the HTTP API: access tokens only, and the identity has to
    # exist. The connection is tagged with that identity so order events can be
    # addressed to admins and the order's owner instead of every listener.
    email = decode_access_token(token)
    if email is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    db = get_database()
    if db is None:
        await websocket.close(code=1013, reason="Service unavailable")
        return

    user = await db["users"].find_one({"email": email})
    if user is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(
        websocket,
        user_id=str(user.get("_id")),
        is_admin=bool(user.get("is_admin", False)),
    )
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)




# --------------------------------------------------- design collaboration

from app.utils.collab import collab

# A single scene resync is the largest thing a client ever sends; ordinary
# operations are a few hundred bytes. The ceiling is here so one participant
# cannot exhaust the room's memory by streaming garbage.
MAX_COLLAB_MESSAGE_BYTES = 512 * 1024

# Messages the server relays. Anything else is dropped rather than echoed,
# so a client cannot invent a message type that other clients will act on.
WRITE_MESSAGE_TYPES = {"op", "scene"}
PRESENCE_MESSAGE_TYPES = {"cursor", "selection"}


@app.websocket("/api/ws/design/{design_id}")
async def design_collab_endpoint(
    websocket: WebSocket,
    design_id: str,
    token: str = Query(None, description="Admin access token"),
    share: str = Query(None, description="Share-link token"),
    name: str = Query(None),
):
    """
    One room per design, for everyone editing it at once.

    Two ways in: an admin's own session, or a share link. The link carries
    its own permission, so a view-only collaborator is connected, sees
    everyone's changes and cursors, and has every attempt to write dropped
    here rather than trusted to the client to prevent.
    """
    from bson import ObjectId
    from bson.errors import InvalidId

    db = get_database()
    if db is None:
        await websocket.close(code=1013, reason="Service unavailable")
        return

    try:
        oid = ObjectId(design_id)
    except (InvalidId, TypeError):
        await websocket.close(code=4004, reason="Unknown design")
        return

    design = await db["designs"].find_one({"_id": oid})
    if design is None:
        await websocket.close(code=4004, reason="Unknown design")
        return

    can_edit = False
    via_share = False
    display_name = (name or "").strip()[:40]
    member_id = None

    if share:
        # `secrets.compare_digest` is not needed: the lookup is by indexed
        # token, so there is no per-character timing signal to leak.
        if not design.get("share_enabled") or design.get("share_token") != share:
            await websocket.close(code=4003, reason="This link is no longer active")
            return
        can_edit = design.get("share_role") == "editor"
        via_share = True
        member_id = f"guest:{uuid4().hex[:8]}"
        display_name = display_name or "Guest"
    elif token:
        email = decode_access_token(token)
        if email is None:
            await websocket.close(code=4001, reason="Invalid token")
            return
        user = await db["users"].find_one({"email": email})
        if user is None or not user.get("is_admin", False):
            await websocket.close(code=4003, reason="Not allowed")
            return
        can_edit = True
        member_id = f"user:{user.get('_id')}"
        display_name = display_name or user.get("first_name") or "Admin"
    else:
        await websocket.close(code=4001, reason="Missing credentials")
        return

    await websocket.accept()
    member = await collab.join(
        design_id, websocket, member_id, display_name, can_edit, via_share
    )

    await websocket.send_json({
        "type": "welcome",
        "you": {
            "id": member.member_id,
            "name": member.name,
            "colour": member.colour,
            "canEdit": member.can_edit,
        },
        "members": collab.roster(design_id),
    })
    await collab.announce_presence(design_id)

    try:
        while True:
            raw = await websocket.receive_text()
            if len(raw) > MAX_COLLAB_MESSAGE_BYTES:
                continue

            try:
                message = json.loads(raw)
            except ValueError:
                continue
            if not isinstance(message, dict):
                continue

            kind = message.get("type")
            if kind in WRITE_MESSAGE_TYPES and not member.can_edit:
                # A view-only participant tried to change the design.
                continue
            if kind not in WRITE_MESSAGE_TYPES and kind not in PRESENCE_MESSAGE_TYPES:
                continue

            # Stamped server-side so a client cannot pose as someone else.
            message["from"] = member.member_id
            message["colour"] = member.colour
            message["name"] = member.name
            await collab.broadcast(design_id, message, exclude=websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await collab.leave(design_id, websocket)
        await collab.announce_presence(design_id)
