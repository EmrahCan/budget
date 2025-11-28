#!/bin/bash

echo "=== Restarting Production Services ==="
echo "Starting at: $(date)"
echo ""

# Navigate to the app directory
cd ~/budget-app || { echo "Cannot find budget-app directory"; exit 1; }

echo "=== 1. Stopping all containers ==="
docker-compose -f docker-compose.azure-prod.yml down

echo ""
echo "=== 2. Checking for orphaned containers ==="
docker ps -a | grep budget

echo ""
echo "=== 3. Starting services ==="
docker-compose -f docker-compose.azure-prod.yml up -d

echo ""
echo "=== 4. Waiting for services to start (30 seconds) ==="
sleep 30

echo ""
echo "=== 5. Checking container status ==="
docker ps | grep budget

echo ""
echo "=== 6. Checking backend logs ==="
docker logs budget_backend_prod --tail 20

echo ""
echo "=== 7. Testing health endpoint ==="
sleep 5
curl http://localhost:5001/health

echo ""
echo "=== Restart Complete ==="
echo "Check the logs above for any errors"
