"""
Article models - matches existing Drizzle schema.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, JSON
from sqlalchemy.sql import func
from app.config.database import Base


class Article(Base):
    """Article model matching the existing articles table."""

    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    youtube_url = Column("youtube_url", String, nullable=False)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    transcript = Column(Text, nullable=False, default="")
    meta_description = Column("meta_description", String, nullable=False)
    seo_titles = Column("seo_titles", JSON, nullable=False)  # List of strings
    tags = Column(JSON, nullable=False)  # List of strings
    seo_score = Column("seo_score", Integer, nullable=False, default=0)
    key_topics = Column("key_topics", JSON, nullable=False, default=list)  # List of strings
    missing_topics = Column("missing_topics", JSON, default=list)  # List of strings
    generation_chunks = Column("generation_chunks", JSON, default=list)  # List of objects
    is_published = Column("is_published", Boolean, nullable=False, default=False, index=True)
    published_at = Column("published_at", TIMESTAMP(timezone=True), nullable=True)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title[:50]}...')>"


class Settings(Base):
    """Settings model matching the existing settings table."""

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    editorial_guidelines = Column("editorial_guidelines", Text, nullable=True)
    writing_samples = Column("writing_samples", JSON, nullable=True)  # List of strings
    openai_api_key = Column("openai_api_key", String, nullable=True)
    perplexity_api_key = Column("perplexity_api_key", String, nullable=True)
    updated_at = Column("updated_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Settings(id={self.id})>"
