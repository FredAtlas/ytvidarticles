"""Articles API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.config.database import get_db
from app.database.crud import articles as crud
from app.schemas.article import (
    ArticleResponse,
    ArticleCreate,
    ArticleUpdate,
    ArticleListResponse,
    ArticleGenerateRequest,
    ArticleImproveRequest,
)
from app.core.exceptions import ArticleNotFoundException
from loguru import logger

router = APIRouter()


@router.get("/", response_model=ArticleListResponse)
async def list_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    published_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get list of articles with pagination."""
    articles = crud.get_articles(db, skip=skip, limit=limit, published_only=published_only)
    total = crud.get_articles_count(db, published_only=published_only)

    return ArticleListResponse(
        articles=articles,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Get article by ID."""
    article = crud.get_article(db, article_id)
    if not article:
        raise ArticleNotFoundException(article_id)

    return article


@router.post("/", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    article: ArticleCreate,
    db: Session = Depends(get_db),
):
    """Create new article."""
    logger.info(f"Creating article: {article.title}")
    db_article = crud.create_article(db, article)
    return db_article


@router.post("/generate", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def generate_article(
    request: ArticleGenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generate article from YouTube URL.
    TODO: Implement AI generation pipeline
    """
    logger.info(f"Generating article from URL: {request.url}")

    # TODO: Implement generation pipeline
    # 1. Get transcript
    # 2. Generate article with OpenAI/Ollama
    # 3. Humanize content
    # 4. Quality checks
    # 5. Save to database

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Article generation not yet implemented in FastAPI backend. Use Express endpoint for now."
    )


@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    db: Session = Depends(get_db),
):
    """Update article."""
    logger.info(f"Updating article {article_id}")
    db_article = crud.update_article(db, article_id, article_update)

    if not db_article:
        raise ArticleNotFoundException(article_id)

    return db_article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Delete article."""
    logger.info(f"Deleting article {article_id}")
    success = crud.delete_article(db, article_id)

    if not success:
        raise ArticleNotFoundException(article_id)

    return None


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_articles(
    article_ids: List[int],
    db: Session = Depends(get_db),
):
    """Delete multiple articles."""
    logger.info(f"Deleting {len(article_ids)} articles")
    count = crud.delete_articles(db, article_ids)
    logger.info(f"Deleted {count} articles")
    return None


@router.post("/{article_id}/improve", response_model=dict)
async def improve_article(
    article_id: int,
    request: ArticleImproveRequest,
    db: Session = Depends(get_db),
):
    """
    Improve article content using AI.
    TODO: Implement content improvement
    """
    logger.info(f"Improving article {article_id}")

    # Verify article exists
    article = crud.get_article(db, article_id)
    if not article:
        raise ArticleNotFoundException(article_id)

    # TODO: Implement improvement logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Article improvement not yet implemented in FastAPI backend. Use Express endpoint for now."
    )


@router.post("/{article_id}/publish", response_model=ArticleResponse)
async def publish_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Mark article as published."""
    logger.info(f"Publishing article {article_id}")

    from datetime import datetime

    article_update = ArticleUpdate(is_published=True)
    db_article = crud.update_article(db, article_id, article_update)

    if not db_article:
        raise ArticleNotFoundException(article_id)

    # Set published_at if not already set
    if not db_article.published_at:
        db_article.published_at = datetime.utcnow()
        db = next(get_db())
        db.commit()
        db.refresh(db_article)

    return db_article


@router.post("/{article_id}/unpublish", response_model=ArticleResponse)
async def unpublish_article(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Mark article as unpublished."""
    logger.info(f"Unpublishing article {article_id}")

    article_update = ArticleUpdate(is_published=False)
    db_article = crud.update_article(db, article_id, article_update)

    if not db_article:
        raise ArticleNotFoundException(article_id)

    # Clear published_at
    db_article.published_at = None
    db = next(get_db())
    db.commit()
    db.refresh(db_article)

    return db_article
