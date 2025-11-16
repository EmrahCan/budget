#!/bin/bash

# Deploy Account Delete Fix to Production
# Bu script validation.js fix'ini production'a deploy eder

set -e  # Exit on error

echo "🚀 Deploying Account Delete Fix to Production"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_CONTAINER="budget_backend_prod"
VALIDATION_FILE="backend/middleware/validation.js"

echo "📋 Configuration:"
echo "  Container: $BACKEND_CONTAINER"
echo "  File: $VALIDATION_FILE"
echo ""

# Step 1: Check if container exists
echo "1️⃣ Checking if backend container exists..."
if ! docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
  echo -e "${RED}❌ Container $BACKEND_CONTAINER not found!${NC}"
  echo ""
  echo "Available containers:"
  docker ps -a --format "table {{.Names}}\t{{.Status}}"
  echo ""
  echo "Please update the BACKEND_CONTAINER variable in this script."
  exit 1
fi
echo -e "${GREEN}✅ Container found${NC}"
echo ""

# Step 2: Check if container is running
echo "2️⃣ Checking if container is running..."
if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
  echo -e "${YELLOW}⚠️  Container is not running. Starting it...${NC}"
  docker start $BACKEND_CONTAINER
  sleep 3
fi
echo -e "${GREEN}✅ Container is running${NC}"
echo ""

# Step 3: Backup current validation.js
echo "3️⃣ Creating backup of current validation.js..."
docker exec $BACKEND_CONTAINER sh -c "cp /app/middleware/validation.js /app/middleware/validation.js.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Step 4: Copy updated validation.js to container
echo "4️⃣ Copying updated validation.js to container..."
if [ ! -f "$VALIDATION_FILE" ]; then
  echo -e "${RED}❌ File $VALIDATION_FILE not found!${NC}"
  exit 1
fi

docker cp $VALIDATION_FILE $BACKEND_CONTAINER:/app/middleware/validation.js
echo -e "${GREEN}✅ File copied successfully${NC}"
echo ""

# Step 5: Verify the file was copied
echo "5️⃣ Verifying file content..."
docker exec $BACKEND_CONTAINER sh -c "grep -q 'isUUID' /app/middleware/validation.js"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ UUID validation found in file${NC}"
else
  echo -e "${RED}❌ UUID validation not found! File may not have been updated correctly.${NC}"
  exit 1
fi
echo ""

# Step 6: Restart backend container
echo "6️⃣ Restarting backend container..."
docker restart $BACKEND_CONTAINER
echo "Waiting for container to be ready..."
sleep 5
echo -e "${GREEN}✅ Container restarted${NC}"
echo ""

# Step 7: Health check
echo "7️⃣ Performing health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HEALTH_STATUS=$(curl -s http://localhost:5001/health 2>/dev/null || echo "failed")
  
  if echo "$HEALTH_STATUS" | grep -q "healthy\|ok\|success"; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
    echo "Response: $HEALTH_STATUS"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Attempt $RETRY_COUNT/$MAX_RETRIES - Waiting for backend..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "${YELLOW}⚠️  Health check timeout, but container is running${NC}"
  echo "Check logs with: docker logs $BACKEND_CONTAINER"
fi
echo ""

# Step 8: Show recent logs
echo "8️⃣ Recent backend logs:"
echo "----------------------------------------"
docker logs $BACKEND_CONTAINER --tail 20
echo "----------------------------------------"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Test the account delete functionality"
echo "  2. Monitor logs: docker logs -f $BACKEND_CONTAINER"
echo "  3. If issues occur, rollback with:"
echo "     docker exec $BACKEND_CONTAINER sh -c 'cp /app/middleware/validation.js.backup.* /app/middleware/validation.js'"
echo "     docker restart $BACKEND_CONTAINER"
echo ""
echo "🧪 To test the fix, run:"
echo "  ./test-account-delete-production.sh"
echo ""
