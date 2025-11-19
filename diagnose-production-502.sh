#!/bin/bash
# Production 502 Error Diagnostic Script

echo "=========================================="
echo "🔍 Production 502 Error Diagnosis"
echo "=========================================="
echo ""

echo "1️⃣ Checking Docker containers status..."
echo "----------------------------------------"
docker ps -a | grep budget
echo ""

echo "2️⃣ Checking backend container health..."
echo "----------------------------------------"
docker inspect budget_backend_prod --format='{{.State.Status}} - Health: {{.State.Health.Status}}' 2>/dev/null || echo "Backend container not found or no health check"
echo ""

echo "3️⃣ Testing backend health endpoint (localhost:5001)..."
echo "----------------------------------------"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5001/health || echo "❌ Backend not accessible on localhost:5001"
echo ""

echo "4️⃣ Testing backend API endpoint (localhost:5001/api)..."
echo "----------------------------------------"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5001/api/health 2>/dev/null || echo "❌ Backend API not accessible"
echo ""

echo "5️⃣ Checking nginx status..."
echo "----------------------------------------"
if command -v nginx &> /dev/null; then
    echo "✅ Nginx is installed"
    sudo systemctl status nginx --no-pager | head -5
    echo ""
    echo "Nginx configuration test:"
    sudo nginx -t 2>&1
else
    echo "❌ Nginx is NOT installed"
fi
echo ""

echo "6️⃣ Checking nginx site configuration..."
echo "----------------------------------------"
if [ -f /etc/nginx/sites-enabled/budgetapp.site ]; then
    echo "✅ budgetapp.site configuration exists"
    echo "Configuration preview:"
    sudo head -20 /etc/nginx/sites-enabled/budgetapp.site
elif [ -f /etc/nginx/sites-available/budgetapp.site ]; then
    echo "⚠️  Configuration exists but not enabled"
else
    echo "❌ No budgetapp.site nginx configuration found"
fi
echo ""

echo "7️⃣ Testing nginx proxy (if nginx is running)..."
echo "----------------------------------------"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "Testing http://localhost/health"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/health 2>/dev/null || echo "❌ Nginx proxy not working"
    
    echo "Testing http://localhost/api/health"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/api/health 2>/dev/null || echo "❌ Nginx API proxy not working"
else
    echo "⚠️  Nginx is not running"
fi
echo ""

echo "8️⃣ Checking backend logs (last 30 lines)..."
echo "----------------------------------------"
docker logs budget_backend_prod --tail 30 2>/dev/null || echo "❌ Cannot read backend logs"
echo ""

echo "9️⃣ Checking frontend environment..."
echo "----------------------------------------"
docker exec budget_frontend_prod env 2>/dev/null | grep REACT_APP_API_URL || echo "❌ Cannot read frontend environment"
echo ""

echo "🔟 Checking domain resolution..."
echo "----------------------------------------"
echo "budgetapp.site resolves to:"
nslookup budgetapp.site 2>/dev/null | grep Address | tail -1 || echo "❌ Cannot resolve domain"
echo ""

echo "=========================================="
echo "📊 Diagnosis Summary"
echo "=========================================="
echo ""
echo "Next steps based on findings:"
echo "1. If backend is not running → restart backend container"
echo "2. If nginx is not installed → install and configure nginx"
echo "3. If nginx config missing → create reverse proxy configuration"
echo "4. If frontend API URL wrong → rebuild frontend with correct URL"
echo ""
