# TAG AI Platform - FastAPI Backend

Modern, high-performance backend for the Two Average Gamers AI Content Creation Platform.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development without Docker)
- PostgreSQL 15
- Redis 7

### Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   # Required
   OPENAI_API_KEY=sk-your-key
   DATABASE_URL=postgresql://postgres:password@postgres:5432/tag_ai
   SECRET_KEY=your-secret-key

   # Optional (for full functionality)
   PERPLEXITY_API_KEY=...
   STEAM_API_KEY=...
   IGDB_CLIENT_ID=...
   # ... etc
   ```

### Running with Docker (Recommended)

```bash
# From project root
docker-compose -f docker-compose.new.yml up

# Or just the backend services
docker-compose -f docker-compose.new.yml up postgres redis backend
```

The backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Running Locally (Without Docker)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://localhost:5432/tag_ai"
export REDIS_URL="redis://localhost:6379/0"
export OPENAI_API_KEY="sk-your-key"
# ... etc

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health & Status

- `GET /` - Root endpoint (service info)
- `GET /health` - Health check

### Articles (v1)

- `GET /api/v1/articles` - List articles (paginated)
- `GET /api/v1/articles/{id}` - Get article by ID
- `POST /api/v1/articles` - Create article manually
- `POST /api/v1/articles/generate` - Generate article from YouTube URL (coming soon)
- `PUT /api/v1/articles/{id}` - Update article
- `DELETE /api/v1/articles/{id}` - Delete article
- `DELETE /api/v1/articles` - Delete multiple articles (body: `article_ids`)
- `POST /api/v1/articles/{id}/improve` - Improve article content (coming soon)
- `POST /api/v1/articles/{id}/publish` - Mark as published
- `POST /api/v1/articles/{id}/unpublish` - Mark as unpublished

### Coming Soon (Phase 1-4)

- Gaming Intelligence: `/api/v1/gaming/*`
- Content Pipeline: `/api/v1/content/*`
- Analytics: `/api/v1/analytics/*`
- Publishing: `/api/v1/publishing/*`
- Media (Images/Audio): `/api/v1/media/*`

## Database Migrations

### Create Migration

```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "Description of changes"

# Or create empty migration
alembic revision -m "Description"
```

### Apply Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific number of migrations
alembic upgrade +1

# See migration history
alembic history

# Current version
alembic current
```

### Rollback

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>

# Rollback all
alembic downgrade base
```

## Development

### Code Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── config/          # Configuration
│   ├── core/            # Core utilities (logging, cache, exceptions)
│   ├── database/        # Models and CRUD operations
│   ├── schemas/         # Pydantic schemas (request/response)
│   ├── ai/              # AI integration (coming soon)
│   ├── gaming/          # Gaming intelligence (coming soon)
│   ├── content/         # Content pipeline (coming soon)
│   └── main.py          # FastAPI application
├── alembic/             # Database migrations
├── tests/               # Test suites
├── requirements.txt     # Python dependencies
└── Dockerfile           # Docker configuration
```

### Adding New Endpoints

1. **Create Schema** (`app/schemas/`):
   ```python
   # app/schemas/example.py
   from pydantic import BaseModel

   class ExampleCreate(BaseModel):
       name: str
       value: int
   ```

2. **Create Model** (`app/database/models/`):
   ```python
   # app/database/models/example.py
   from sqlalchemy import Column, Integer, String
   from app.config.database import Base

   class Example(Base):
       __tablename__ = "examples"
       id = Column(Integer, primary_key=True)
       name = Column(String, nullable=False)
       value = Column(Integer)
   ```

3. **Create CRUD** (`app/database/crud/`):
   ```python
   # app/database/crud/example.py
   from sqlalchemy.orm import Session
   from app.database.models import Example

   def create_example(db: Session, name: str, value: int):
       example = Example(name=name, value=value)
       db.add(example)
       db.commit()
       return example
   ```

4. **Create Endpoint** (`app/api/v1/`):
   ```python
   # app/api/v1/example.py
   from fastapi import APIRouter, Depends
   from app.config.database import get_db
   from app.schemas.example import ExampleCreate

   router = APIRouter()

   @router.post("/")
   async def create(example: ExampleCreate, db: Session = Depends(get_db)):
       return create_example(db, example.name, example.value)
   ```

5. **Register Router** (`app/api/v1/router.py`):
   ```python
   from app.api.v1 import example
   api_router.include_router(example.router, prefix="/examples", tags=["examples"])
   ```

6. **Create Migration**:
   ```bash
   alembic revision --autogenerate -m "Add examples table"
   alembic upgrade head
   ```

### Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_api/test_articles.py

# Run with coverage
pytest --cov=app tests/

# Run in watch mode
pytest-watch
```

### Code Quality

```bash
# Format code
black app/

# Sort imports
isort app/

# Type checking
mypy app/

# Linting
flake8 app/
```

## Redis Caching

The backend uses Redis for caching and task queuing.

### Using Cache

```python
from app.core.cache import cache

# Set value
await cache.set("key", {"data": "value"}, ttl=300)  # 5 minutes

# Get value
data = await cache.get("key")

# Delete key
await cache.delete("key")

# Clear pattern
await cache.clear_pattern("articles:*")
```

### Cache Keys Convention

- Articles: `article:{id}`
- Article list: `articles:page:{page}:limit:{limit}`
- Gaming trends: `gaming:trends:{date}`
- Gaming news: `gaming:news:source:{source}`

## Logging

Structured logging with Loguru:

```python
from loguru import logger

logger.info("User action", user_id=123, action="create_article")
logger.error("Failed to generate", error=str(e), url=url)
logger.debug("Processing chunk", chunk_number=i, total=len(chunks))
```

Log levels:
- DEBUG: Detailed diagnostic information
- INFO: General informational messages
- WARNING: Warning messages
- ERROR: Error messages
- CRITICAL: Critical errors

## Error Handling

Custom exceptions in `app/core/exceptions.py`:

```python
from app.core.exceptions import ArticleNotFoundException, GenerationException

# Raise exception
raise ArticleNotFoundException(article_id=123)

# It will return:
# Status: 404
# Body: {"error": "Article with ID 123 not found", "type": "ArticleNotFoundException"}
```

## Performance

### Optimization Tips

1. **Use async/await**: All endpoints should be async
2. **Database connection pooling**: Configured in settings (20 connections, 10 overflow)
3. **Redis caching**: Cache expensive operations (API calls, database queries)
4. **Pagination**: Always paginate large result sets
5. **Background tasks**: Use task queue for long operations

### Monitoring

- Response time headers: `X-Process-Time`
- Logs include request/response timing
- Prometheus metrics (coming in Phase 3.2)

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d tag_ai
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# View keys
docker-compose exec redis redis-cli keys '*'
```

### Migration Issues

```bash
# Check current migration status
alembic current

# View migration history
alembic history

# Force migration to specific version
alembic stamp head
```

### Import Errors

Make sure you're in the backend directory and Python path is set:

```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

## Production Deployment

### Build Docker Image

```bash
docker build -t tag-backend:latest .
```

### Run with Production Settings

```bash
# Set production environment
export DEBUG=false
export ENVIRONMENT=production
export LOG_LEVEL=INFO

# Run with gunicorn (production ASGI server)
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Health Checks

Monitor these endpoints:
- `GET /health` - Basic health check
- `GET /` - Service info and version

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Run tests: `pytest`
4. Format code: `black . && isort .`
5. Create migration if needed: `alembic revision --autogenerate`
6. Commit with clear message
7. Create pull request

## Resources

- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Alembic Docs: https://alembic.sqlalchemy.org/
- Pydantic Docs: https://docs.pydantic.dev/

---

**Version**: 1.0.0
**Status**: Phase 1.1 - Foundation
**Last Updated**: November 5, 2025
