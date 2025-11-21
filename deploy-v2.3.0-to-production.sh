#!/bin/bash

# Deploy v2.3.0 to Production (Docker Environment)
# This script deploys the new version with smart notifications and user management enhancements

set -e  # Exit on error

echo "🚀 Starting deployment of v2.3.0 to production (Docker)..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/EmrahCan/budget.git"
TAG="v2.3.0"
PROJECT_DIR="/home/azureuser/budget"

echo "📋 Deployment Configuration:"
echo "   Repository: $REPO_URL"
echo "   Tag: $TAG"
echo "   Project Directory: $PROJECT_DIR"
echo "   Environment: Docker Compose"
echo ""

# Step 1: Backup current version
echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"
cd /home/azureuser
BACKUP_DIR="budget_backup_$(date +%Y%m%d_%H%M%S)"
cp -r budget "$BACKUP_DIR"
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}📥 Step 2: Pulling latest code...${NC}"
cd "$PROJECT_DIR"
git fetch --all --tags
git checkout tags/$TAG
echo -e "${GREEN}✅ Code updated to $TAG${NC}"
echo ""

# Step 3: Database migrations
echo -e "${YELLOW}🗄️  Step 3: Running database migrations...${NC}"
echo "   Adding new columns to smart_notifications table..."

# Run migration file inside the database container
docker-compose exec -T db psql -U postgres -d budget_app < backend/database/migrations/add_notification_tracking_columns.sql

echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Step 4: Rebuild and restart containers
echo -e "${YELLOW}🔨 Step 4: Rebuilding Docker containers...${NC}"

echo "   Stopping containers..."
docker-compose down
echo -e "${GREEN}   ✅ Containers stopped${NC}"

echo "   Building new images..."
docker-compose build --no-cache
echo -e "${GREEN}   ✅ Images built${NC}"

echo "   Starting containers..."
docker-compose up -d
echo -e "${GREEN}   ✅ Containers started${NC}"
echo ""

# Step 5: Wait for services to be ready
echo -e "${YELLOW}⏳ Step 5: Waiting for services to be ready...${NC}"
sleep 10

# Check if backend is ready
for i in {1..30}; do
    if docker-compose exec -T backend curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready${NC}"
        break
    fi
    echo "   Waiting for backend... ($i/30)"
    sleep 2
done
echo ""

# Step 6: Generate initial notifications
echo -e "${YELLOW}🔔 Step 6: Generating initial notifications...${NC}"
docker-compose exec -T backend node scripts/generate-notifications.js
echo -e "${GREEN}✅ Initial notifications generated${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}✅ Step 7: Verifying deployment...${NC}"

echo "   Checking container status..."
docker-compose ps
echo ""

echo "   Checking backend health..."
BACKEND_HEALTH=$(docker-compose exec -T backend curl -s http://localhost:5001/api/health | grep -o '"status":"ok"' || echo "error")
if [ "$BACKEND_HEALTH" != "error" ]; then
    echo -e "${GREEN}   ✅ Backend is healthy${NC}"
else
    echo -e "${RED}   ❌ Backend health check failed${NC}"
fi
echo ""

# Step 8: Show logs
echo -e "${YELLOW}📋 Step 8: Recent logs...${NC}"
echo "   Backend logs (last 20 lines):"
docker-compose logs --tail=20 backend
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Post-deployment checklist:"
echo "   [ ] Test notification bell in header"
echo "   [ ] Verify dashboard widgets show data"
echo "   [ ] Test user delete in admin panel"
echo "   [ ] Check payment calendar loads correctly"
echo "   [ ] Monitor logs for any errors"
echo ""
echo "🔗 Application URLs:"
echo "   Frontend: http://your-domain.com"
echo "   Backend API: http://your-domain.com/api"
echo ""
echo "📊 Backup location: /home/azureuser/$BACKUP_DIR"
echo ""
echo "💡 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Check status: docker-compose ps"
echo "   Restart: docker-compose restart"
echo "   Stop: docker-compose down"
echo ""
echo -e "${YELLOW}⚠️  Remember to test all features before announcing the update!${NC}"
