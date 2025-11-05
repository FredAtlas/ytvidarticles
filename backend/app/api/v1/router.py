"""Main API router for v1."""
from fastapi import APIRouter
from app.api.v1 import articles

api_router = APIRouter()

# Include sub-routers
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])

# TODO: Add more routers as we build them
# api_router.include_router(gaming.router, prefix="/gaming", tags=["gaming"])
# api_router.include_router(content.router, prefix="/content", tags=["content"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
# api_router.include_router(publishing.router, prefix="/publishing", tags=["publishing"])
# api_router.include_router(media.router, prefix="/media", tags=["media"])
