from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import connect_to_mongo, close_mongo_connection
from app.routes.product_routes import router as product_router
from app.routes.auth_routes import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas
    connect_to_mongo()
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

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": "CrochetCreation Backend API",
        "docs_url": "/docs"
    }
