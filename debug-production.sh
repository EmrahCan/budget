#!/bin/bash
# Production Debug Script for Azure VM

echo "=== Budget App Production Debug ==="
echo ""

echo "1. Checking Docker containers..."
docker ps -a

echo ""
echo "2. Checking backend logs (last 50 lines)..."
docker logs budget_backend_prod --tail 50

echo ""
echo "3. Checking database connection..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "\dt"

echo ""
echo "4. Checking accounts table structure..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "\d accounts"

echo ""
echo "5. Checking sample account IDs..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT id, name, type, is_active FROM accounts LIMIT 5;"

echo ""
echo "6. Checking backend environment..."
docker exec budget_backend_prod env | grep -E "DB_|NODE_ENV|PORT"

echo ""
echo "=== Debug Complete ==="
