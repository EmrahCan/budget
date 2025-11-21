#!/bin/bash

# Deploy v2.3.0 to Production
# This script deploys the new version with smart notifications and user management enhancements

set -e  # Exit on error

echo "🚀 Starting deployment of v2.3.0 to production..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/EmrahCan/budget.git"
TAG="v2.3.0"
BACKEND_DIR="/home/azureuser/budget/backend"
FRONTEND_DIR="/home/azureuser/budget/frontend"

echo "📋 Deployment Configuration:"
echo "   Repository: $REPO_URL"
echo "   Tag: $TAG"
echo "   Backend: $BACKEND_DIR"
echo "   Frontend: $FRONTEND_DIR"
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
cd /home/azureuser/budget
git fetch --all --tags
git checkout tags/$TAG
echo -e "${GREEN}✅ Code updated to $TAG${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Step 3: Installing dependencies...${NC}"

echo "   Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --production
echo -e "${GREEN}   ✅ Backend dependencies installed${NC}"

echo "   Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --production
echo -e "${GREEN}   ✅ Frontend dependencies installed${NC}"
echo ""

# Step 4: Database migrations
echo -e "${YELLOW}🗄️  Step 4: Running database migrations...${NC}"
echo "   Adding new columns to smart_notifications table..."

psql -d budget_app << EOF
-- Add new columns for notification tracking
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Verify columns were added
\d smart_notifications
EOF

echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Step 5: Build frontend
echo -e "${YELLOW}🔨 Step 5: Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 6: Restart services
echo -e "${YELLOW}🔄 Step 6: Restarting services...${NC}"

echo "   Restarting backend..."
pm2 restart budget-backend
sleep 3
echo -e "${GREEN}   ✅ Backend restarted${NC}"

echo "   Restarting frontend..."
pm2 restart budget-frontend
sleep 3
echo -e "${GREEN}   ✅ Frontend restarted${NC}"
echo ""

# Step 7: Generate initial notifications
echo -e "${YELLOW}🔔 Step 7: Generating initial notifications...${NC}"
cd "$BACKEND_DIR"
node scripts/generate-notifications.js
echo -e "${GREEN}✅ Initial notifications generated${NC}"
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}✅ Step 8: Verifying deployment...${NC}"

echo "   Checking backend health..."
BACKEND_HEALTH=$(curl -s http://localhost:5001/api/health | jq -r '.status' 2>/dev/null || echo "error")
if [ "$BACKEND_HEALTH" = "ok" ]; then
    echo -e "${GREEN}   ✅ Backend is healthy${NC}"
else
    echo -e "${RED}   ❌ Backend health check failed${NC}"
fi

echo "   Checking PM2 status..."
pm2 list | grep budget
echo ""

# Step 9: Show logs
echo -e "${YELLOW}📋 Step 9: Recent logs...${NC}"
echo "   Backend logs (last 20 lines):"
pm2 logs budget-backend --lines 20 --nostream
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
echo -e "${YELLOW}⚠️  Remember to test all features before announcing the update!${NC}"
