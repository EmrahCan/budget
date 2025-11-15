#!/bin/bash
# Master Script to Fix Account Delete Issue in Production

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Budget App - Production Account Delete Fix              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the budget directory
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: Please run this script from the budget directory${NC}"
    exit 1
fi

# Make scripts executable
chmod +x check-production-db.sh
chmod +x deploy-fix-to-production.sh
chmod +x debug-production.sh

echo -e "${YELLOW}Step 1: Checking Production Database Schema${NC}"
echo "─────────────────────────────────────────────────────────────"
./check-production-db.sh

echo ""
echo -e "${YELLOW}Step 2: Checking Current Backend Status${NC}"
echo "─────────────────────────────────────────────────────────────"
docker ps | grep budget

echo ""
echo -e "${YELLOW}Step 3: Reviewing the Fix${NC}"
echo "─────────────────────────────────────────────────────────────"
echo "The fix updates validation.js to accept both:"
echo "  • INTEGER IDs (e.g., 1, 2, 3)"
echo "  • UUID IDs (e.g., c740b41a-a946-4772-bd3a-541e8145b76b)"
echo ""

read -p "Do you want to proceed with the deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 4: Deploying Fix to Production${NC}"
echo "─────────────────────────────────────────────────────────────"
./deploy-fix-to-production.sh

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Fix Deployed Successfully!                               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Test account deletion in the UI"
echo "2. Monitor logs: docker logs budget_backend_prod -f"
echo "3. If issues persist, check: ./debug-production.sh"
echo ""
echo "Common test commands:"
echo "  • Check backend health: curl http://localhost:5001/health"
echo "  • View backend logs: docker logs budget_backend_prod --tail 50"
echo "  • View all containers: docker ps -a"
echo ""
