#!/bin/bash
# Development startup script for TAG AI Platform

set -e

echo "🚀 Starting TAG AI Platform Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  No backend/.env file found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env and add your API keys"
    exit 1
fi

echo -e "${BLUE}📦 Starting services with Docker Compose...${NC}"
docker-compose -f docker-compose.new.yml up -d postgres redis

echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if database is ready
until docker-compose -f docker-compose.new.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
cd backend
alembic upgrade head
cd ..

echo -e "${GREEN}✅ Migrations complete${NC}"

# Start backend and frontend
echo -e "${BLUE}🚀 Starting backend and frontend...${NC}"
docker-compose -f docker-compose.new.yml up backend frontend

echo -e "${GREEN}✅ TAG AI Platform is running!${NC}"
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Express (legacy): http://localhost:5000"
echo ""
echo "🗄️  Database & Cache:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop"
