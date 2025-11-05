"""
Content pipeline and quality control models.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base


class ContentQueue(Base):
    """Queue for content generation tasks."""

    __tablename__ = "content_queue"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content_type = Column("content_type", String(50), nullable=False, index=True)  # 'article', 'image', 'audio'
    status = Column(String(50), nullable=False, index=True, default="pending")  # pending, processing, completed, failed
    priority = Column(Integer, nullable=False, default=5, index=True)  # 1-10, higher = more important
    params = Column(JSON, nullable=False)  # Generation parameters
    result = Column(JSON, nullable=True)  # Generation result
    error_message = Column("error_message", Text, nullable=True)
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), index=True)
    started_at = Column("started_at", TIMESTAMP(timezone=True), nullable=True)
    completed_at = Column("completed_at", TIMESTAMP(timezone=True), nullable=True)

    def __repr__(self):
        return f"<ContentQueue(id={self.id}, type='{self.content_type}', status='{self.status}')>"


class QualityCheck(Base):
    """Quality check results for articles."""

    __tablename__ = "quality_checks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    check_type = Column("check_type", String(100), nullable=False, index=True)  # brand_voice, seo, grammar, facts
    score = Column(Float, nullable=False)  # 0.0 to 1.0
    passed = Column(Boolean, nullable=False)
    details = Column(JSON, nullable=True)  # Detailed results
    checked_at = Column("checked_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<QualityCheck(article_id={self.article_id}, type='{self.check_type}', passed={self.passed})>"


class ABTest(Base):
    """A/B testing for content optimization."""

    __tablename__ = "ab_tests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_type = Column("variant_type", String(50), nullable=False)  # title, thumbnail, publish_time
    variants = Column(JSON, nullable=False)  # List of variant options
    results = Column(JSON, nullable=True)  # Performance metrics per variant
    winner_variant = Column("winner_variant", String(255), nullable=True)
    started_at = Column("started_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    ended_at = Column("ended_at", TIMESTAMP(timezone=True), nullable=True)

    def __repr__(self):
        return f"<ABTest(article_id={self.article_id}, type='{self.variant_type}')>"


class SocialPost(Base):
    """Social media posts linked to articles."""

    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column("article_id", Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=True, index=True)
    platform = Column(String(50), nullable=False, index=True)  # twitter, facebook, reddit, discord
    post_id = Column("post_id", String(255), nullable=True)  # Platform's post ID
    content = Column(Text, nullable=False)
    media_urls = Column("media_urls", JSON, nullable=True)  # List of media URLs
    status = Column(String(50), nullable=False, default="draft", index=True)  # draft, scheduled, published, failed
    scheduled_for = Column("scheduled_for", TIMESTAMP(timezone=True), nullable=True, index=True)
    published_at = Column("published_at", TIMESTAMP(timezone=True), nullable=True)
    analytics = Column(JSON, nullable=True)  # Engagement metrics
    created_at = Column("created_at", TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<SocialPost(id={self.id}, platform='{self.platform}', status='{self.status}')>"
