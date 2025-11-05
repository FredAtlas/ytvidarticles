"""CRUD operations for articles."""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import Article
from app.schemas.article import ArticleCreate, ArticleUpdate


def get_article(db: Session, article_id: int) -> Optional[Article]:
    """Get article by ID."""
    return db.query(Article).filter(Article.id == article_id).first()


def get_articles(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False
) -> List[Article]:
    """Get list of articles."""
    query = db.query(Article)

    if published_only:
        query = query.filter(Article.is_published == True)

    return query.order_by(desc(Article.created_at)).offset(skip).limit(limit).all()


def get_articles_count(db: Session, published_only: bool = False) -> int:
    """Get total count of articles."""
    query = db.query(Article)

    if published_only:
        query = query.filter(Article.is_published == True)

    return query.count()


def create_article(db: Session, article: ArticleCreate) -> Article:
    """Create new article."""
    db_article = Article(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


def update_article(
    db: Session,
    article_id: int,
    article_update: ArticleUpdate
) -> Optional[Article]:
    """Update article."""
    db_article = get_article(db, article_id)
    if not db_article:
        return None

    # Update only provided fields
    update_data = article_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_article, field, value)

    db.commit()
    db.refresh(db_article)
    return db_article


def delete_article(db: Session, article_id: int) -> bool:
    """Delete article."""
    db_article = get_article(db, article_id)
    if not db_article:
        return False

    db.delete(db_article)
    db.commit()
    return True


def delete_articles(db: Session, article_ids: List[int]) -> int:
    """Delete multiple articles. Returns count of deleted articles."""
    count = db.query(Article).filter(Article.id.in_(article_ids)).delete(synchronize_session=False)
    db.commit()
    return count
