from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import connect_to_mongo, close_mongo_connection
from app.routes.product_routes import router as product_router
from app.routes.auth_routes import router as auth_router
from app.routes.order_routes import router as order_router
from app.routes.settings_routes import router as settings_router
from app.routes.customer_routes import router as customer_router
from app.routes.admin_routes import router as admin_router
from app.routes.user_routes import router as user_router
from app.routes.review_routes import router as review_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas
    await connect_to_mongo()
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
import jwt
from app.core.config import settings
from app.utils.websocket import manager

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if not payload.get("sub"):
            raise ValueError("Missing subject")
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


