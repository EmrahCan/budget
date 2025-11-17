#!/bin/bash

# HTTPS Mixed Content Fix - Quick Deploy
# This script fixes the mixed content issue by setting up Nginx reverse proxy

set -e

echo "🔧 Fixing HTTPS Mixed Content Issue..."
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Azure VM
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo -e "${RED}❌ Nginx not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Backup existing nginx config
echo -e "${YELLOW}📦 Backing up existing Nginx config...${NC}"
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Create new Nginx configuration
echo -e "${YELLOW}⚙️  Creating new Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/budgetapp > /dev/null <<'EOF'
server {
    listen 80;
    server_name budgetapp.site www.budgetapp.site 98.71.149.168;

    # Redirect all HTTP to HTTPS (Cloudflare will handle SSL)
    # But allow direct IP access for testing
    if ($host != "98.71.149.168") {
        return 301 https://$host$request_uri;
    }

    # Frontend - React App (Port 3002)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Port 5001)
    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
echo -e "${YELLOW}🔗 Enabling site configuration...${NC}"
sudo ln -sf /etc/nginx/sites-available/budgetapp /etc/nginx/sites-enabled/budgetapp

# Remove default if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Reload Nginx
    echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Update frontend .env.production to use relative API URL
echo -e "${YELLOW}📝 Updating frontend environment configuration...${NC}"
cd /home/azureuser/budget

# Update .env.production
cat > .env.production <<EOF
# Production Environment for Azure VM
NODE_ENV=production

# Frontend Configuration - Use relative URL (same domain)
REACT_APP_API_URL=/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.0.0

# Backend Configuration
PORT=5001
FRONTEND_URL=https://budgetapp.site

# Database Configuration (Azure MySQL)
DB_HOST=budget-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_NAME=budget_app
DB_USER=budgetadmin
DB_PASSWORD=${DB_PASSWORD:-YOUR_MYSQL_PASSWORD_HERE}

# Security
JWT_SECRET=${JWT_SECRET:-BudgetApp2024SecureJWTKey!@#$%}

# AI Configuration
GEMINI_API_KEY=${GEMINI_API_KEY:-YOUR_GEMINI_API_KEY_HERE}
AI_USE_MOCK_DATA=false

# CORS Configuration - Allow domain
CORS_ORIGIN=https://budgetapp.site

# Logging
LOG_LEVEL=info
EOF

# Rebuild frontend with new configuration
echo -e "${YELLOW}🏗️  Rebuilding frontend...${NC}"
cd frontend
npm run build

# Restart PM2 processes
echo -e "${YELLOW}🔄 Restarting PM2 processes...${NC}"
pm2 restart all

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ HTTPS Mixed Content Fix Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Your app is now accessible at:${NC}"
echo -e "  🌐 https://budgetapp.site"
echo -e "  🌐 http://98.71.149.168 (for testing)"
echo ""
echo -e "${YELLOW}Note: API calls now use relative URLs (/api)${NC}"
echo -e "${YELLOW}Both frontend and backend are served through Nginx${NC}"
echo ""
echo -e "${GREEN}Test the fix:${NC}"
echo -e "  1. Open https://budgetapp.site/login"
echo -e "  2. Check browser console - no mixed content errors"
echo -e "  3. Try logging in"
echo ""
