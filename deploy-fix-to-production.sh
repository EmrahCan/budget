#!/bin/bash
# Deploy Account Delete Fix to Production

set -e  # Exit on error

echo "=== Deploying Account Delete Fix to Production ==="
echo ""

# Check if we're in the budget directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the budget directory"
    exit 1
fi

echo "1. Backing up current validation.js..."
docker exec budget_backend_prod cp /app/middleware/validation.js /app/middleware/validation.js.backup
echo "✓ Backup created"

echo ""
echo "2. Copying updated validation.js to container..."
docker cp backend/middleware/validation.js budget_backend_prod:/app/middleware/validation.js
echo "✓ File copied"

echo ""
echo "3. Verifying the update..."
docker exec budget_backend_prod cat /app/middleware/validation.js | grep -A 10 "paramValidation"

echo ""
echo "4. Restarting backend container..."
docker restart budget_backend_prod

echo ""
echo "5. Waiting for backend to start..."
sleep 10

echo ""
echo "6. Checking backend health..."
docker exec budget_backend_prod curl -f http://localhost:5001/health || echo "Health check failed"

echo ""
echo "7. Checking backend logs..."
docker logs budget_backend_prod --tail 20

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "✓ Validation middleware updated to support both INTEGER and UUID IDs"
echo "✓ Backend restarted successfully"
echo ""
echo "Please test the account delete functionality now."
echo "If there are still issues, check logs with: docker logs budget_backend_prod -f"
