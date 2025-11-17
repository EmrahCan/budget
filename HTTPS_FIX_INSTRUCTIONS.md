# HTTPS Mixed Content Fix - Azure VM'de Çalıştırma Talimatları

## Sorun
- https://budgetapp.site HTTPS ile yükleniyor
- Ama API http://98.71.149.168:5001 HTTP ile çağrılıyor
- Tarayıcı Mixed Content hatası veriyor ve istekleri engelliyor

## Çözüm
Nginx reverse proxy ile hem frontend hem backend'i aynı domain altında serve edeceğiz.

## Adımlar

### 1. Script'i Azure VM'e Kopyala
Azure SSH bağlantısında şu komutları çalıştır:

```bash
cd /home/azureuser/budget
```

### 2. Fix Script'ini Oluştur
```bash
cat > fix-https-mixed-content.sh << 'SCRIPT_END'
#!/bin/bash

# HTTPS Mixed Content Fix - Quick Deploy
set -e

echo "🔧 Fixing HTTPS Mixed Content Issue..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Install Nginx if not exists
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo -e "${RED}❌ Nginx not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Backup existing nginx config
echo -e "${YELLOW}📦 Backing up existing Nginx config...${NC}"
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Create new Nginx configuration
echo -e "${YELLOW}⚙️  Creating new Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/budgetapp > /dev/null <<'EOF'
server {
    listen 80;
    server_name budgetapp.site www.budgetapp.site 98.71.149.168;

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
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Update .env.production
echo -e "${YELLOW}📝 Updating .env.production...${NC}"
cat > .env.production <<'ENVEOF'
NODE_ENV=production
REACT_APP_API_URL=/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.0.0
PORT=5001
FRONTEND_URL=https://budgetapp.site
DB_HOST=budget-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_NAME=budget_app
DB_USER=budgetadmin
DB_PASSWORD=Budget2024!Secure
JWT_SECRET=BudgetApp2024SecureJWTKey!@#$%
GEMINI_API_KEY=AIzaSyBxLhKvPxGvmxHxvxHxvxHxvxHxvxHxvxH
AI_USE_MOCK_DATA=false
CORS_ORIGIN=https://budgetapp.site
LOG_LEVEL=info
ENVEOF

# Rebuild frontend
echo -e "${YELLOW}🏗️  Rebuilding frontend...${NC}"
cd frontend
npm run build

# Restart PM2
echo -e "${YELLOW}🔄 Restarting PM2...${NC}"
cd ..
pm2 restart all

echo -e "${GREEN}✅ Fix Complete! Test at https://budgetapp.site${NC}"
SCRIPT_END
```

### 3. Script'i Çalıştırılabilir Yap
```bash
chmod +x fix-https-mixed-content.sh
```

### 4. Script'i Çalıştır
```bash
./fix-https-mixed-content.sh
```

### 5. Test Et
1. Tarayıcıda https://budgetapp.site/login aç
2. Console'da mixed content hatası olmamalı
3. Login işlemini dene

## Ne Değişti?

1. **Nginx Reverse Proxy**: Hem frontend hem backend aynı domain'den serve ediliyor
2. **API URL**: `http://98.71.149.168:5001/api` → `/api` (relative URL)
3. **CORS**: Cloudflare HTTPS üzerinden geliyor, Nginx local'e proxy'liyor

## Sorun Çözülmezse

```bash
# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log

# PM2 loglarını kontrol et
pm2 logs

# Nginx durumunu kontrol et
sudo systemctl status nginx
```
