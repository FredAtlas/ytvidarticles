"""Pydantic schemas for articles."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ArticleBase(BaseModel):
    """Base article schema."""
    youtube_url: str = Field(..., description="YouTube video URL")
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    transcript: str = Field(default="")
    meta_description: str = Field(..., max_length=500)
    seo_titles: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    seo_score: int = Field(default=0, ge=0, le=100)
    key_topics: List[str] = Field(default_factory=list)
    missing_topics: Optional[List[str]] = Field(default_factory=list)
    generation_chunks: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class ArticleCreate(ArticleBase):
    """Schema for creating an article."""
    pass


class ArticleUpdate(BaseModel):
    """Schema for updating an article."""
    title: Optional[str] = None
    content: Optional[str] = None
    transcript: Optional[str] = None
    meta_description: Optional[str] = None
    seo_titles: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    seo_score: Optional[int] = None
    key_topics: Optional[List[str]] = None
    missing_topics: Optional[List[str]] = None
    is_published: Optional[bool] = None


class ArticleResponse(ArticleBase):
    """Schema for article response."""
    id: int
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    """Schema for paginated article list."""
    articles: List[ArticleResponse]
    total: int
    page: int
    page_size: int


class ArticleGenerateRequest(BaseModel):
    """Request schema for generating an article from YouTube URL."""
    url: str = Field(..., description="YouTube video URL")


class ArticleImproveRequest(BaseModel):
    """Request schema for improving article content."""
    content: str = Field(..., min_length=1)
