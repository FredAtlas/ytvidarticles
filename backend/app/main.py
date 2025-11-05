"""
TAG AI Platform - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.config.settings import settings
from app.core.logging import setup_logging
from app.core.middleware import LoggingMiddleware
from app.core.exceptions import (
    TAGException,
    tag_exception_handler,
    general_exception_handler
)
from app.core.cache import cache
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting TAG AI Platform...")

    # Setup logging
    setup_logging()

    # Connect to Redis
    await cache.connect()

    # Initialize database (if needed)
    # from app.config.database import init_db
    # init_db()

    logger.info(f"TAG AI Platform started successfully - Environment: {settings.environment}")

    yield

    # Shutdown
    logger.info("Shutting down TAG AI Platform...")
    await cache.disconnect()
    logger.info("TAG AI Platform shut down successfully")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI-Powered Gaming Content Creation Platform for Two Average Gamers",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)

# Add exception handlers
app.add_exception_handler(TAGException, tag_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include API routers
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.version,
        "environment": settings.environment,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    redis_status = "connected" if cache.redis_client else "disconnected"

    return {
        "status": "healthy",
        "environment": settings.environment,
        "redis": redis_status,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
