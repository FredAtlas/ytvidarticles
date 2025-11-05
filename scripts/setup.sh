#!/bin/bash
# Initial setup script for TAG AI Platform

set -e

echo "🔧 TAG AI Platform - Initial Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p data/uploads data/images data/audio data/backups
mkdir -p ai_models/sdxl ai_models/xtts ai_models/ollama
mkdir -p backend/logs
echo -e "${GREEN}✅ Directories created${NC}"

# Setup backend environment
echo -e "${BLUE}Setting up backend environment...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Created backend/.env from template${NC}"
    echo -e "${YELLOW}   Please edit backend/.env and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY (required)"
    echo "   - SECRET_KEY (generate a random string)"
    echo "   - Other API keys as needed"
    echo ""
    read -p "Press enter to continue after editing .env..."
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Pull Docker images
echo -e "${BLUE}Pulling Docker images...${NC}"
docker-compose -f docker-compose.new.yml pull

# Build images
echo -e "${BLUE}Building Docker images...${NC}"
docker-compose -f docker-compose.new.yml build

# Start database
echo -e "${BLUE}Starting PostgreSQL and Redis...${NC}"
docker-compose -f docker-compose.new.yml up -d postgres redis

# Wait for PostgreSQL
echo -e "${BLUE}Waiting for PostgreSQL to be ready...${NC}"
sleep 5
until docker-compose -f docker-compose.new.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
cd backend
if command -v alembic &> /dev/null; then
    alembic upgrade head
else
    docker-compose -f ../docker-compose.new.yml exec -T backend alembic upgrade head
fi
cd ..
echo -e "${GREEN}✅ Migrations complete${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "To start the development environment, run:"
echo "  ./scripts/dev.sh"
echo ""
echo "Or manually:"
echo "  docker-compose -f docker-compose.new.yml up"
echo ""
