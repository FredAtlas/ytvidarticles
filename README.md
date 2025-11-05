# TAG AI Platform

**Two Average Gamers AI Content Automation System**

AI-powered gaming content creation platform designed to produce 500+ articles, 200+ images, and 50+ audio pieces monthly while maintaining brand voice and quality.

---

## 🚀 Project Status

**Current Phase**: Phase 1.1 - Foundation & Architecture (In Progress)

We are in the process of migrating from a monolithic Express.js application to a modern microservices architecture with FastAPI backend for enhanced performance, scalability, and AI capabilities.

### ✅ Completed
- YouTube transcript → article generation
- SEO analysis and scoring
- Article editing and improvement
- WordPress export integration
- Basic content management

### 🏗️ In Progress (Phase 1.1)
- FastAPI backend with SQLAlchemy ORM
- Redis caching and task queue
- Docker containerization
- Database migrations with Alembic
- Enhanced API with OpenAPI docs

### 📋 Planned (Phases 2-4)
- Gaming intelligence (Steam, IGDB, Twitch integration)
- Image generation (Stable Diffusion XL)
- Audio generation (XTTS-v2, ElevenLabs)
- Multi-platform publishing automation
- Advanced analytics and A/B testing

See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the complete roadmap.

---

## 📖 Documentation

- **[Development Plan](DEVELOPMENT_PLAN.md)** - 10-week transformation roadmap
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[Backend README](backend/README.md)** - FastAPI backend documentation

---

## 🎯 Goals

- **Content Volume**: 500+ articles, 200+ images, 50+ audio/month
- **Quality**: ≥85% human approval rate
- **Revenue**: ≥$15k monthly within 6 months
- **Engagement**: 3× traffic and social engagement
- **Efficiency**: 90% reduction in manual work

---

## 🛠️ Tech Stack

### Current Stack
- **Frontend**: React 18 + TypeScript, Vite, Wouter, TanStack Query, Radix UI
- **Backend**: Express.js (legacy) + **FastAPI (new)**
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **AI**: OpenAI GPT-4, Perplexity

### Planned Additions
- **Local AI**: Ollama (Llama 3.1, Mistral)
- **Image**: Stable Diffusion XL + ComfyUI
- **Audio**: XTTS-v2 (local), ElevenLabs (cloud)
- **Gaming APIs**: Steam, IGDB, Twitch, Reddit
- **Monitoring**: Prometheus + Grafana
- **Infrastructure**: Docker, Nginx

---

## 🚦 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Setup

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd ytvidarticles
   ./scripts/setup.sh
   ```

2. **Configure environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your API keys
   ```

3. **Start development environment**:
   ```bash
   ./scripts/dev.sh
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - FastAPI Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Express (legacy): http://localhost:5000

### Manual Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.new.yml up

# Start specific services
docker-compose -f docker-compose.new.yml up postgres redis backend

# View logs
docker-compose -f docker-compose.new.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.new.yml down
```

---

## 📁 Project Structure

```
ytvidarticles/
├── backend/                 # FastAPI backend (new)
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── config/         # Configuration
│   │   ├── core/           # Core utilities
│   │   ├── database/       # Models & CRUD
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
├── server/                  # Express backend (legacy)
│   ├── routes.ts
│   ├── services/
│   └── lib/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
├── db/                      # Database schema (Drizzle)
├── docs/                    # Documentation
├── scripts/                 # Helper scripts
├── docker/                  # Docker configs
├── ai_models/              # Local AI models
├── data/                   # Generated content
├── docker-compose.new.yml  # New stack configuration
├── DEVELOPMENT_PLAN.md     # 10-week roadmap
└── README.md               # This file
```

---

## 🔧 Development

### Backend Development (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black . && isort .
```

See [backend/README.md](backend/README.md) for detailed backend documentation.

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Database Migrations

```bash
# Create new migration
cd backend
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🎨 Features

### Current Features

✅ **Article Generation**
- YouTube transcript extraction
- AI-powered article generation (OpenAI GPT-4)
- Content humanization (Perplexity)
- SEO optimization and scoring

✅ **Content Management**
- Article library with search
- Article editing and improvement
- Version comparison
- Publication status tracking

✅ **Publishing**
- WordPress export
- HTML/RTF export

✅ **Settings**
- Editorial guidelines management
- Writing samples
- API key configuration

### Coming Soon (Phase 2-4)

🏗️ **Gaming Intelligence**
- Real-time trend detection
- News aggregation (IGN, GameSpot, Polygon, Kotaku)
- Steam/IGDB/Twitch integration
- Content idea generation (50+ ideas/day)

🏗️ **Multi-Format Content**
- Image generation (SDXL)
  - Headers, thumbnails, social media
  - Brand consistency
- Audio generation (XTTS-v2, ElevenLabs)
  - Text-to-speech
  - Podcast episodes
  - Voice cloning

🏗️ **Advanced CMS**
- Visual content pipeline
- Editorial calendar
- Quality control gates
- A/B testing

🏗️ **Multi-Platform Publishing**
- WordPress, Twitter, Facebook, Reddit, Discord
- Automated scheduling
- Platform-specific formatting

🏗️ **Analytics & Monitoring**
- Real-time performance metrics
- Prometheus + Grafana dashboards
- Business intelligence
- Cost tracking

---

## 📊 Architecture

### Dual Backend Strategy

We're running both Express and FastAPI backends in parallel during the migration:

- **Express (Legacy)**: Handles existing production features
- **FastAPI (New)**: New features and enhanced performance
- **Shared Database**: PostgreSQL with Drizzle (Express) and SQLAlchemy (FastAPI)
- **Shared Cache**: Redis for both backends

### Data Flow

```
User → React Frontend
  ↓
  ├─→ Express API (legacy features)
  │    └─→ PostgreSQL
  │
  └─→ FastAPI (new features)
       ├─→ PostgreSQL (SQLAlchemy)
       ├─→ Redis (cache)
       └─→ AI Services (OpenAI, Ollama, SDXL, XTTS)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                     # Run all tests
pytest --cov=app          # With coverage
pytest tests/test_api/    # Specific module
```

### Frontend Tests

```bash
npm test                  # Run tests
npm run test:watch       # Watch mode
```

---

## 🚢 Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.new.yml build

# Start in production mode
docker-compose -f docker-compose.new.yml up -d

# View logs
docker-compose -f docker-compose.new.yml logs -f
```

### Environment Variables

Required environment variables in `backend/.env`:

```bash
# Core
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=...

# AI
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=... (optional)
OLLAMA_BASE_URL=... (optional)

# Gaming APIs (optional)
STEAM_API_KEY=...
IGDB_CLIENT_ID=...
TWITCH_CLIENT_ID=...

# Publishing (optional)
WORDPRESS_API_URL=...
WORDPRESS_USERNAME=...
TWITTER_API_KEY=...
```

See `backend/.env.example` for all available options.

---

## 📈 Success Metrics

### Technical Metrics
- ⏱️ Article generation: <5 minutes
- ⚡ API response time: <2 seconds (p95)
- ☁️ System uptime: ≥99.5%
- 💾 Database performance: 1000+ QPS

### Business Metrics
- 📝 500+ articles/month
- 🖼️ 200+ images/month
- 🎙️ 50+ audio pieces/month
- ⭐ ≥85% content quality approval
- 💰 $15k/month revenue (Month 6)
- 📈 3× traffic increase

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and formatting
4. Create a pull request

### Code Style

- **Python**: Black + isort + mypy
- **TypeScript**: ESLint + Prettier

---

## 📝 License

MIT

---

## 🔗 Links

- **Website**: https://twoaveragegamers.com
- **Documentation**: [docs/](docs/)
- **Development Plan**: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)

---

## 📧 Contact

**Owner**: Fred Twum-Acheampong
**Project**: Two Average Gamers AI Content Automation System

---

**Version**: 1.0.0 (Phase 1.1)
**Last Updated**: November 5, 2025
**Status**: Active Development 🚀
