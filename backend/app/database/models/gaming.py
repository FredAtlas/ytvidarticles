"""
Gaming-related models for trend detection and news aggregation.
"""
from sqlalchemy import Column, Integer, String, Text, Float, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy import ARRAY
from app.config.database import Base


class GamingTrend(Base):
    """Gaming trend tracking."""

    __tablename__ = "gaming_trends"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topic = Column(String(255), nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)
    score = Column(Float, nullable=False)  # Trend score/popularity
    sentiment = Column(Float, nullable=True)  # -1 to 1
    first_detected = Column("first_detected", TIMESTAMP(timezone=True), nullable=False, index=True)
    last_updated = Column("last_updated", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    metadata = Column(JSON, nullable=True)  # Additional data (game_id, tags, etc.)

    def __repr__(self):
        return f"<GamingTrend(topic='{self.topic}', score={self.score})>"


class GamingNews(Base):
    """Gaming news articles from various sources."""

    __tablename__ = "gaming_news"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False, index=True)
    url = Column(Text, nullable=False, unique=True)
    source = Column(String(100), nullable=False, index=True)
    published_at = Column("published_at", TIMESTAMP(timezone=True), nullable=False, index=True)
    relevance_score = Column("relevance_score", Float, nullable=True)
    topics = Column(ARRAY(Text), nullable=True)  # Array of topic tags
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<GamingNews(title='{self.title[:50]}...', source='{self.source}')>"
