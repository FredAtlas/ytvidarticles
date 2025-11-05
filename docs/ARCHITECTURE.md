# TAG AI Platform - Architecture Documentation

## Overview

TAG AI Platform is transitioning from a monolithic Express.js application to a modern microservices architecture with FastAPI backend and React frontend, designed for scalable AI-powered gaming content generation.

## Current Architecture State

### Phase 1.1 - Foundation (In Progress)

We are implementing the foundational architecture with parallel systems:

- **Express Backend** (Existing): Handles current production traffic
- **FastAPI Backend** (New): Provides enhanced performance and scalability
- **React Frontend** (Existing): Continues to work with both backends
- **PostgreSQL**: Shared database for both backends
- **Redis**: New caching and queue layer

## System Components

### Backend (FastAPI)

**Location**: `/backend/`

**Technology Stack**:
- FastAPI 0.104.1 (async Python web framework)
- SQLAlchemy 2.0 (ORM)
- Alembic (database migrations)
- Redis (caching + task queue)
- Uvicorn (ASGI server)

**Key Modules**:

1. **Configuration** (`app/config/`)
   - `settings.py`: Environment-based configuration using Pydantic
   - `database.py`: Database connection and session management

2. **Core** (`app/core/`)
   - `logging.py`: Loguru-based structured logging
   - `middleware.py`: Request logging and rate limiting
   - `exceptions.py`: Custom exceptions and error handlers
   - `cache.py`: Redis caching layer

3. **API** (`app/api/v1/`)
   - RESTful endpoints organized by resource
   - OpenAPI/Swagger documentation
   - Versioned API (v1)

4. **Database** (`app/database/`)
   - `models/`: SQLAlchemy ORM models
   - `crud/`: Database operations (Create, Read, Update, Delete)

5. **AI** (`app/ai/`) - Coming in Phase 1.3
   - `models/`: AI model clients (OpenAI, Ollama, SDXL, XTTS)
   - `prompts/`: Gaming-specific prompt templates
   - `quality/`: Quality control and brand voice checking

6. **Gaming** (`app/gaming/`) - Coming in Phase 1.2
   - `apis/`: Gaming platform clients (Steam, IGDB, Twitch, Reddit)
   - `trend_detector.py`: Real-time trend analysis
   - `news_aggregator.py`: Multi-source news aggregation

7. **Content** (`app/content/`) - Coming in Phase 2.3
   - `pipeline.py`: Content workflow management
   - `scheduler.py`: Editorial calendar
   - `quality_control.py`: Automated QC gates
   - `analytics.py`: Performance tracking

8. **Publishing** (`app/publishing/`) - Coming in Phase 3.1
   - Platform-specific publishers (WordPress, Twitter, Facebook, Reddit, Discord)

### Frontend (React)

**Location**: `/client/`

**Technology Stack**:
- React 18 + TypeScript
- Vite (build tool)
- Wouter (routing)
- TanStack Query (data fetching)
- Radix UI + Tailwind CSS (UI components)

**Current Pages**:
- Home: Article generation
- History: Article library
- Settings: Configuration
- Analysis: Content analysis

**Planned Additions** (Phase 2-4):
- Dashboard: Main overview
- Pipeline: Visual workflow
- Calendar: Editorial scheduling
- Gaming: Trends and insights
- Media: Image/audio library
- Analytics: Performance metrics
- Publishing: Multi-platform management

### Database

**Technology**: PostgreSQL 15

**Current Tables**:
- `articles`: Article content and metadata
- `settings`: Application configuration

**New Tables** (Phase 1.1):
- `gaming_trends`: Trending gaming topics
- `gaming_news`: Aggregated news articles
- `content_queue`: Generation task queue
- `quality_checks`: QC results
- `ab_tests`: A/B test tracking
- `social_posts`: Multi-platform posts
- `images`: Image library
- `audio_files`: Audio library
- `analytics_events`: Performance events

### Caching & Queue (Redis)

**Purpose**:
- API response caching (5min TTL default)
- Gaming data caching (1hr TTL)
- Task queue for long-running jobs (article, image, audio generation)
- Session management
- Rate limiting

### Infrastructure

**Development**:
- Docker Compose for local development
- Hot reload for both backend and frontend
- Shared PostgreSQL and Redis containers

**Production** (Future):
- Self-hosted on Wowtower (Ryzen 7 9800X3D, RTX 4080 Super)
- Docker Swarm or Kubernetes
- Nginx reverse proxy
- Prometheus + Grafana monitoring
- Automated backups to S3/Google Drive

## Data Flow

### Article Generation Flow (Current)

```
User Request → Express Backend
  ↓
Get YouTube Transcript
  ↓
Generate with OpenAI
  ↓
Humanize with Perplexity
  ↓
Save to PostgreSQL
  ↓
Return to Frontend
```

### Article Generation Flow (Target - Phase 2)

```
User Request → FastAPI Backend
  ↓
Add to Redis Queue
  ↓
Background Worker:
  ├─ Get Transcript (YouTube API)
  ├─ Generate Content (GPT-5/Ollama)
  ├─ Quality Checks:
  │   ├─ Brand Voice Analysis
  │   ├─ SEO Scoring
  │   ├─ Fact Checking
  │   └─ Grammar Check
  ├─ Humanize (Perplexity)
  └─ Save to PostgreSQL
  ↓
WebSocket Update → Frontend
```

### Gaming Trend Detection Flow (Phase 1.2)

```
Scheduled Task (Hourly)
  ↓
Aggregate from Sources:
  ├─ Steam API (new releases, player counts)
  ├─ IGDB (game metadata, ratings)
  ├─ Reddit (r/gaming, r/pcgaming)
  ├─ Twitch (trending streams)
  └─ News RSS (IGN, GameSpot, Kotaku)
  ↓
Sentiment Analysis
  ↓
Trend Scoring Algorithm
  ↓
Deduplication
  ↓
Save to PostgreSQL (gaming_trends table)
  ↓
Cache in Redis (1hr)
  ↓
API Endpoint: GET /api/v1/gaming/trends
```

## API Design

### Versioning

All endpoints are versioned: `/api/v1/{resource}`

### Response Format

```json
{
  "status": "success" | "error",
  "data": {...},
  "message": "Optional message",
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### Error Format

```json
{
  "error": "Error message",
  "type": "ExceptionType",
  "detail": "Detailed error info (dev only)"
}
```

### Authentication (Future)

- JWT-based authentication
- OAuth2 with password flow
- API key for service-to-service communication

## Scalability Considerations

### Current Bottlenecks
1. **Synchronous Processing**: Article generation blocks request
2. **No Caching**: Repeated API calls
3. **Single Server**: No horizontal scaling

### Solutions (Implemented/Planned)

1. **Async Task Queue** (Phase 1.1) ✅
   - Redis-backed queue
   - Background workers
   - WebSocket updates

2. **Caching Strategy** (Phase 1.1) ✅
   - Redis for API responses
   - Gaming data cached (1hr)
   - Invalidation on updates

3. **Database Optimization** (Phase 4.1)
   - Connection pooling (pgBouncer)
   - Read replicas for analytics
   - Table partitioning for large datasets

4. **Horizontal Scaling** (Future)
   - Load balancer (Nginx)
   - Multiple backend instances
   - Shared Redis/PostgreSQL

## Monitoring & Observability

### Logging
- Structured logging with Loguru
- Request/response logging
- Performance metrics (response time)
- Error tracking

### Metrics (Phase 3.2)
- Prometheus for metrics collection
- Grafana for visualization
- Key metrics:
  - Request rate, latency (p50, p95, p99)
  - Error rate
  - AI generation time
  - Cache hit rate
  - Database query performance

### Alerting (Phase 3.2)
- Slack/Discord notifications
- Alert conditions:
  - Error rate >5%
  - Response time >2s
  - Queue depth >100
  - Cost threshold exceeded

## Security

### Current
- Environment variable-based secrets
- CORS configuration
- SQL injection protection (SQLAlchemy ORM)

### Planned (Phase 4)
- JWT authentication
- API key management
- Rate limiting per user/IP
- Encrypted API keys (AES-256)
- Audit logging
- RBAC (Role-Based Access Control)

## Migration Strategy

### Phase 1: Parallel Systems (Current)
- Both Express and FastAPI running
- Frontend can call either backend
- New features → FastAPI
- Existing features → gradual migration

### Phase 2: Feature Parity (Week 2-3)
- Port all Express routes to FastAPI
- Test equivalence
- Performance comparison

### Phase 3: Cutover (Week 4)
- Default to FastAPI
- Express as fallback
- Monitor for issues

### Phase 4: Deprecation (Week 5+)
- Remove Express entirely
- Full FastAPI adoption

## Development Workflow

### Local Development

1. Start services:
   ```bash
   docker-compose -f docker-compose.new.yml up
   ```

2. Access:
   - Frontend: http://localhost:5173
   - Backend (FastAPI): http://localhost:8000
   - Backend (Express): http://localhost:5000
   - API Docs: http://localhost:8000/docs
   - Database: localhost:5432
   - Redis: localhost:6379

3. Run migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Testing

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd client && npm test
```

## Future Architecture (Phase 4+)

### Microservices Breakdown

1. **API Gateway**: Nginx or Kong
2. **Content Service**: Article, image, audio generation
3. **Gaming Service**: Trends, news, data aggregation
4. **Publishing Service**: Multi-platform distribution
5. **Analytics Service**: Performance tracking, A/B testing
6. **Auth Service**: User management, permissions

### Message Queue
- RabbitMQ or Apache Kafka for inter-service communication
- Event-driven architecture

### Storage
- S3-compatible object storage for media
- CDN for static assets (CloudFlare/Cloudinary)

---

**Last Updated**: November 5, 2025
**Status**: Phase 1.1 - Foundation (In Progress)
**Next**: Phase 1.2 - Gaming Intelligence System
