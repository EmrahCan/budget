#!/bin/bash

echo "=== Production Diagnostics Script ==="
echo "Running at: $(date)"
echo ""

echo "=== 1. Checking Docker Containers ==="
docker ps -a | grep budget

echo ""
echo "=== 2. Backend Container Status ==="
docker inspect budget_backend_prod --format='{{.State.Status}}' 2>/dev/null || echo "Backend container not found"

echo ""
echo "=== 3. Database Container Status ==="
docker inspect budget_database_prod --format='{{.State.Status}}' 2>/dev/null || echo "Database container not found"

echo ""
echo "=== 4. Backend Logs (Last 50 lines) ==="
docker logs budget_backend_prod --tail 50 2>&1

echo ""
echo "=== 5. Database Logs (Last 30 lines) ==="
docker logs budget_database_prod --tail 30 2>&1

echo ""
echo "=== 6. Testing Backend Health Endpoint ==="
curl -v http://localhost:5001/health 2>&1 || echo "Health check failed"

echo ""
echo "=== 7. Testing Backend API Endpoint ==="
curl -v http://localhost:5001/api/accounts 2>&1 || echo "API endpoint failed"

echo ""
echo "=== 8. Checking Port Usage ==="
netstat -tlnp | grep -E ':(5001|5432|3000)' || ss -tlnp | grep -E ':(5001|5432|3000)'

echo ""
echo "=== 9. Checking Disk Space ==="
df -h

echo ""
echo "=== 10. Checking Memory Usage ==="
free -h

echo ""
echo "=== 11. Checking Backend Environment File ==="
if [ -f ~/budget-app/backend/.env.production ]; then
    echo "Backend .env.production exists"
    echo "Environment variables (masked):"
    grep -v "PASSWORD\|SECRET\|KEY" ~/budget-app/backend/.env.production || echo "File is empty or all vars are sensitive"
else
    echo "Backend .env.production NOT FOUND!"
fi

echo ""
echo "=== 12. Checking Nginx Status ==="
systemctl status nginx --no-pager || service nginx status

echo ""
echo "=== 13. Checking Nginx Error Logs ==="
tail -50 /var/log/nginx/error.log 2>/dev/null || echo "Cannot access nginx error log"

echo ""
echo "=== Diagnostics Complete ==="
