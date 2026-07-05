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
    allow_origins=["*"],
    allow_credentials=False,
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

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": "CrochetCreation Backend API",
        "docs_url": "/docs"
    }

@app.get("/ping")
async def keep_alive_ping():
    """Endpoint for cron jobs to keep the Render server awake."""
    return {"status": "Alive", "message": "Server is awake and running!"}

from fastapi import WebSocket, WebSocketDisconnect
from app.utils.websocket import manager

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


