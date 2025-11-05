"""
Media library models for images and audio files.
"""
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy import ARRAY
from app.config.database import Base


class Image(Base):
    """Generated or uploaded images."""

    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    url = Column(Text, nullable=False)  # Public URL
    file_path = Column("file_path", Text, nullable=False)  # Local storage path
    prompt = Column(Text, nullable=True)  # AI generation prompt
    model = Column(String(100), nullable=True)  # sdxl, dalle-3, etc.
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    tags = Column(ARRAY(Text), nullable=True, index=True)  # Searchable tags
    metadata = Column(JSON, nullable=True)  # Additional metadata
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), index=True)

    def __repr__(self):
        return f"<Image(id={self.id}, size={self.width}x{self.height})>"


class AudioFile(Base):
    """Generated or uploaded audio files."""

    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    url = Column(Text, nullable=False)  # Public URL
    file_path = Column("file_path", Text, nullable=False)  # Local storage path
    duration = Column(Integer, nullable=True)  # Duration in seconds
    transcript = Column(Text, nullable=True)  # Text transcript
    model = Column(String(100), nullable=True)  # xtts-v2, elevenlabs, etc.
    voice = Column(String(100), nullable=True)  # Voice model used
    metadata = Column(JSON, nullable=True)  # Additional metadata
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AudioFile(id={self.id}, title='{self.title[:50]}...')>"


class AnalyticsEvent(Base):
    """Analytics events for tracking content performance."""

    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_type = Column("event_type", String(100), nullable=False, index=True)  # view, click, share, etc.
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    platform = Column(String(50), nullable=True, index=True)  # wordpress, twitter, facebook, etc.
    metrics = Column(JSON, nullable=False)  # Event-specific metrics
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AnalyticsEvent(type='{self.event_type}', article_id={self.article_id})>"
