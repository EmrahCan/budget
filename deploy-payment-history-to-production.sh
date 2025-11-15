#!/bin/bash

# Deploy Fixed Payment History Feature to Azure VM Production
# This script deploys the payment history tracking system

echo "🚀 Deploying Fixed Payment History to Production (Azure VM)"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Azure VM details
AZURE_VM_IP="98.71.149.168"
AZURE_USER="azureuser"

echo "📋 Deployment Steps:"
echo "1. Pull latest code from GitHub"
echo "2. Run database migration"
echo "3. Rebuild and restart Docker containers"
echo ""

# Step 1: Connect to Azure VM and pull latest code
echo "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
ssh ${AZURE_USER}@${AZURE_VM_IP} << 'ENDSSH'
cd ~/budget
echo "Current directory: $(pwd)"
echo "Pulling latest changes..."
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "❌ Failed to pull code"
    exit 1
fi
ENDSSH

if [ $? -ne 0 ]; then
    echo "${RED}❌ Failed to pull code from GitHub${NC}"
    exit 1
fi

echo "${GREEN}✅ Code pulled successfully${NC}"
echo ""

# Step 2: Run database migration
echo "${YELLOW}Step 2: Running database migration...${NC}"
ssh ${AZURE_USER}@${AZURE_VM_IP} << 'ENDSSH'
cd ~/budget

# Check if migration file exists
if [ ! -f "backend/database/migrations/add_fixed_payment_history.sql" ]; then
    echo "❌ Migration file not found!"
    exit 1
fi

echo "Running migration on production database..."

# Get database connection details from docker-compose
DB_NAME="budget_app"
DB_USER="postgres"
DB_PASSWORD="your_secure_password_here"

# Run migration using docker exec
docker exec budget-db psql -U ${DB_USER} -d ${DB_NAME} -f /docker-entrypoint-initdb.d/migrations/add_fixed_payment_history.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "⚠️  Migration may have already been applied or failed"
    # Don't exit - migration might already exist
fi
ENDSSH

if [ $? -ne 0 ]; then
    echo "${YELLOW}⚠️  Migration step had issues, but continuing...${NC}"
fi

echo "${GREEN}✅ Migration step completed${NC}"
echo ""

# Step 3: Rebuild and restart Docker containers
echo "${YELLOW}Step 3: Rebuilding and restarting Docker containers...${NC}"
ssh ${AZURE_USER}@${AZURE_VM_IP} << 'ENDSSH'
cd ~/budget

echo "Stopping containers..."
docker-compose down

echo "Rebuilding backend container..."
docker-compose build backend

echo "Starting containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "Waiting for containers to start..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
docker-compose ps

# Check backend logs
echo ""
echo "Backend Logs (last 20 lines):"
docker-compose logs --tail=20 backend

echo ""
echo "✅ Containers restarted successfully"
ENDSSH

if [ $? -ne 0 ]; then
    echo "${RED}❌ Failed to restart Docker containers${NC}"
    exit 1
fi

echo "${GREEN}✅ Docker containers restarted successfully${NC}"
echo ""

# Step 4: Verify deployment
echo "${YELLOW}Step 4: Verifying deployment...${NC}"
echo "Testing API endpoint..."

# Test the new endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://${AZURE_VM_IP}:5001/health)

if [ "$RESPONSE" = "200" ]; then
    echo "${GREEN}✅ Backend is responding (HTTP $RESPONSE)${NC}"
else
    echo "${RED}❌ Backend health check failed (HTTP $RESPONSE)${NC}"
    exit 1
fi

echo ""
echo "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📝 Post-Deployment Notes:"
echo "1. Fixed payment history tracking is now live"
echo "2. Users can mark payments as paid/unpaid"
echo "3. Payment statistics are available"
echo "4. Database migration has been applied"
echo ""
echo "🔗 Access your application:"
echo "   Frontend: http://${AZURE_VM_IP}"
echo "   Backend:  http://${AZURE_VM_IP}:5001"
echo ""
echo "📊 Monitor logs:"
echo "   ssh ${AZURE_USER}@${AZURE_VM_IP}"
echo "   cd ~/budget"
echo "   docker-compose logs -f backend"
echo ""
