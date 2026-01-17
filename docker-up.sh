#!/bin/bash

# ArchRampart Audit Tool - Docker Quick Start Script
# Usage: ./docker-up.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Banner
echo ""
echo -e "${CYAN}"
echo "    _             _     ____                                   _   "
echo "   / \   _ __ ___| |__ |  _ \ __ _ _ __ ___  _ __   __ _ _ __| |_ "
echo "  / _ \ | '__/ __| '_ \| |_) / _\` | '_ \` _ \| '_ \ / _\` | '__| __|"
echo " / ___ \| | | (__| | | |  _ < (_| | | | | | | |_) | (_| | |  | |_ "
echo "/_/   \_\_|  \___|_| |_|_| \_\__,_|_| |_| |_| .__/ \__,_|_|   \__|"
echo "                                            |_|                   "
echo -e "${NC}"
echo -e "${BLUE}Enterprise Security Audit Management Platform${NC}"
echo ""
echo "========================================================"
echo ""

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed!${NC}"
        echo "   Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is installed${NC}"
}

# Check if Docker Compose is available
check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}❌ Docker Compose is not installed!${NC}"
        echo "   Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
}

# Check if .env file exists, create default if not
check_env_file() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  No .env file found, creating with default values...${NC}"
        cat > .env << EOF
# ArchRampart Audit Tool Configuration
# You can customize these values as needed

# Database Configuration
POSTGRES_USER=archrampart
POSTGRES_PASSWORD=archrampart_secure_pass
POSTGRES_DB=archrampart_audit

# Security
SECRET_KEY=archrampart-super-secret-key-change-in-production

# Admin User (created on first run)
ADMIN_EMAIL=admin@archrampart.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Platform Admin
EOF
        echo -e "${GREEN}✅ Created .env file with default values${NC}"
    else
        echo -e "${GREEN}✅ .env file exists${NC}"
    fi
}

# Build and start containers
start_services() {
    echo ""
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    $COMPOSE_CMD build
    
    echo ""
    echo -e "${BLUE}🚀 Starting services...${NC}"
    $COMPOSE_CMD up -d
    
    echo ""
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for backend to be healthy
    echo -n "   Backend: "
    for i in {1..60}; do
        if curl -s http://localhost:9090/api/v1/health > /dev/null 2>&1; then
            echo -e "${GREEN}Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Check if backend is ready
    if ! curl -s http://localhost:9090/api/v1/health > /dev/null 2>&1; then
        echo -e "${RED}Not responding${NC}"
        echo -e "${YELLOW}   Backend may still be initializing. Check logs with: docker compose logs -f backend${NC}"
    fi
    
    # Wait a bit for frontend
    echo -n "   Frontend: "
    for i in {1..30}; do
        if curl -s http://localhost:4200 > /dev/null 2>&1; then
            echo -e "${GREEN}Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if ! curl -s http://localhost:4200 > /dev/null 2>&1; then
        echo -e "${YELLOW}Starting...${NC}"
    fi
}

# Display access information
show_info() {
    echo ""
    echo "========================================================"
    echo ""
    echo -e "${GREEN}🎉 ArchRampart Audit Tool is running!${NC}"
    echo ""
    echo -e "${CYAN}📌 Access Information:${NC}"
    echo ""
    echo -e "   🌐 Frontend:        ${BLUE}http://localhost:4200${NC}"
    echo -e "   🔧 Backend API:     ${BLUE}http://localhost:9090${NC}"
    echo -e "   📚 API Docs:        ${BLUE}http://localhost:9090/docs${NC}"
    echo ""
    echo -e "${CYAN}🔐 Default Admin Credentials:${NC}"
    echo ""
    echo -e "   📧 Email:    ${YELLOW}admin@archrampart.com${NC}"
    echo -e "   🔑 Password: ${YELLOW}admin123${NC}"
    echo ""
    echo -e "${RED}⚠️  Please change the default password after first login!${NC}"
    echo ""
    echo "========================================================"
    echo ""
    echo -e "${CYAN}📋 Useful Commands:${NC}"
    echo ""
    echo "   View logs:          $COMPOSE_CMD logs -f"
    echo "   Stop services:      $COMPOSE_CMD down"
    echo "   Restart services:   $COMPOSE_CMD restart"
    echo "   Check status:       $COMPOSE_CMD ps"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking requirements...${NC}"
    echo ""
    
    check_docker
    check_docker_compose
    check_env_file
    
    start_services
    show_info
}

# Run main function
main
