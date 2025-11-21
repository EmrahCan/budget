#!/bin/bash

# Production API URL Fix Script
# This script fixes the CORS issue by rebuilding frontend with correct API URL

set -e

echo "🔧 Fixing Production API URL Configuration..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Azure VM
if [ ! -f "/home/azureuser/budget-app/docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: This script must be run on Azure VM${NC}"
    echo "Please SSH to your Azure VM first:"
    echo "ssh azureuser@budgetapp.site"
    exit 1
fi

cd /home/azureuser/budget-app

echo -e "${YELLOW}📋 Current Configuration:${NC}"
echo "Checking docker-compose.prod.yml..."
grep -A 5 "REACT_APP_API_URL" docker-compose.prod.yml || echo "Not found"

echo ""
echo -e "${YELLOW}🛑 Stopping frontend container...${NC}"
docker-compose -f docker-compose.prod.yml stop frontend

echo ""
echo -e "${YELLOW}🗑️  Removing old frontend container and image...${NC}"
docker-compose -f docker-compose.prod.yml rm -f frontend
docker rmi budget-frontend_prod 2>/dev/null || echo "Image already removed"

echo ""
echo -e "${YELLOW}🔨 Rebuilding frontend with correct API URL (--no-cache)...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache frontend

echo ""
echo -e "${YELLOW}🚀 Starting frontend container...${NC}"
docker-compose -f docker-compose.prod.yml up -d frontend

echo ""
echo -e "${YELLOW}⏳ Waiting for frontend to be healthy...${NC}"
sleep 10

# Check container status
if docker ps | grep -q budget_frontend_prod; then
    echo -e "${GREEN}✅ Frontend container is running${NC}"
    
    # Check logs for any errors
    echo ""
    echo -e "${YELLOW}📋 Recent frontend logs:${NC}"
    docker logs --tail 20 budget_frontend_prod
    
    echo ""
    echo -e "${GREEN}✅ Fix Applied Successfully!${NC}"
    echo ""
    echo "🌐 Test the application:"
    echo "   https://budgetapp.site"
    echo ""
    echo "🔍 If still having issues, check:"
    echo "   1. Nginx configuration: sudo nginx -t"
    echo "   2. Backend logs: docker logs budget_backend_prod"
    echo "   3. Frontend logs: docker logs budget_frontend_prod"
else
    echo -e "${RED}❌ Frontend container failed to start${NC}"
    echo "Check logs: docker logs budget_frontend_prod"
    exit 1
fi
