#!/bin/bash
# Quick fix for production 502 error - Run this on Azure VM

echo "🚨 Quick Fix for 502 Bad Gateway Error"
echo "========================================"
echo ""

# Step 1: Resolve git conflict
echo "1️⃣ Resolving git conflicts..."
cd ~/budget
git stash
git pull origin main
echo "✅ Git conflicts resolved"
echo ""

# Step 2: Check Docker containers
echo "2️⃣ Checking Docker containers..."
docker ps -a | grep budget
echo ""

# Step 3: Check backend health
echo "3️⃣ Testing backend health..."
if curl -f http://localhost:5001/health 2>/dev/null; then
    echo "✅ Backend is running and healthy"
else
    echo "❌ Backend is NOT accessible - restarting..."
    cd ~/budget
    docker-compose -f docker-compose.prod.yml restart backend
    sleep 10
    curl http://localhost:5001/health
fi
echo ""

# Step 4: Check if nginx is installed
echo "4️⃣ Checking nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx is installed"
    sudo systemctl status nginx --no-pager | head -3
else
    echo "❌ Nginx is NOT installed - installing now..."
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo "✅ Nginx installed and started"
fi
echo ""

# Step 5: Create nginx configuration
echo "5️⃣ Creating nginx reverse proxy configuration..."
sudo tee /etc/nginx/sites-available/budgetapp.site > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name budgetapp.site www.budgetapp.site 98.71.149.168;

    # Proxy to frontend container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/budgetapp.site /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi
echo ""

# Step 6: Test the fix
echo "6️⃣ Testing the fix..."
echo ""
echo "Testing backend directly:"
curl -s -o /dev/null -w "  http://localhost:5001/health → HTTP %{http_code}\n" http://localhost:5001/health

echo ""
echo "Testing through nginx:"
curl -s -o /dev/null -w "  http://localhost/health → HTTP %{http_code}\n" http://localhost/health
curl -s -o /dev/null -w "  http://localhost/api/health → HTTP %{http_code}\n" http://localhost/api/health 2>/dev/null

echo ""
echo "Testing domain:"
curl -s -o /dev/null -w "  http://budgetapp.site/health → HTTP %{http_code}\n" http://budgetapp.site/health 2>/dev/null

echo ""
echo "========================================"
echo "✅ Fix Applied!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Test in browser: http://budgetapp.site"
echo "2. Try to login"
echo "3. Check browser console for errors"
echo ""
echo "If still getting 502 errors, check:"
echo "  - Backend logs: docker logs budget_backend_prod --tail 50"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
