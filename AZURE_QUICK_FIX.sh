#!/bin/bash

# Quick Fix for Production API URL
# Run this on Azure VM: obiwan@butce:~/budget$

set -e

echo "🔧 Fixing Production API URL Configuration..."
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git pull origin main

echo ""
echo -e "${YELLOW}🛑 Stopping frontend container...${NC}"
docker-compose -f docker-compose.prod.yml stop frontend

echo ""
echo -e "${YELLOW}🗑️  Removing old frontend container and image...${NC}"
docker-compose -f docker-compose.prod.yml rm -f frontend
docker rmi budget-frontend_prod 2>/dev/null || echo "Image already removed"

echo ""
echo -e "${YELLOW}🔨 Rebuilding frontend with correct API URL (/api)...${NC}"
echo "This will take 2-3 minutes..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

echo ""
echo -e "${YELLOW}🚀 Starting frontend container...${NC}"
docker-compose -f docker-compose.prod.yml up -d frontend

echo ""
echo -e "${YELLOW}⏳ Waiting for frontend to be healthy (30 seconds)...${NC}"
sleep 30

# Check container status
if docker ps | grep -q budget_frontend_prod; then
    echo -e "${GREEN}✅ Frontend container is running${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 Recent frontend logs:${NC}"
    docker logs --tail 30 budget_frontend_prod
    
    echo ""
    echo -e "${GREEN}✅ Fix Applied Successfully!${NC}"
    echo ""
    echo "🌐 Test the application now:"
    echo "   https://budgetapp.site"
    echo ""
    echo "✅ Login should work without CORS errors"
    echo "✅ API URL is now: /api (relative path)"
else
    echo -e "${RED}❌ Frontend container failed to start${NC}"
    echo "Check logs: docker logs budget_frontend_prod"
    exit 1
fi
