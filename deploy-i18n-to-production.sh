#!/bin/bash

# Multi-language support (i18n) manuel deployment scripti
# Production sunucuya SSH ile bağlanıp değişiklikleri deploy eder

set -e  # Hata durumunda dur

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Production sunucu bilgileri
PROD_USER="azureuser"
PROD_HOST="budgetapp.site"
PROD_PATH="/home/azureuser/budget-app"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Multi-Language Support (i18n) - Manuel Deployment        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# 1. Production sunucuya bağlan ve git pull
echo -e "\n${YELLOW}📥 Step 1: Production'da git pull yapılıyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
cd /home/azureuser/budget-app
echo "Current directory: $(pwd)"
echo "Git status before pull:"
git status --short
echo ""
echo "Pulling latest changes..."
git pull origin main
echo ""
echo "Git status after pull:"
git status --short
ENDSSH

echo -e "${GREEN}✅ Git pull tamamlandı${NC}"

# 2. Backend dependencies yükle
echo -e "\n${YELLOW}📦 Step 2: Backend dependencies yükleniyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
cd /home/azureuser/budget-app/backend
echo "Installing backend dependencies..."
npm install --production
echo "Backend dependencies installed"
ENDSSH

echo -e "${GREEN}✅ Backend dependencies yüklendi${NC}"

# 3. Frontend dependencies yükle
echo -e "\n${YELLOW}📦 Step 3: Frontend dependencies yükleniyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
cd /home/azureuser/budget-app/frontend
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps
echo "Frontend dependencies installed"
ENDSSH

echo -e "${GREEN}✅ Frontend dependencies yüklendi${NC}"

# 4. Frontend build
echo -e "\n${YELLOW}🔨 Step 4: Frontend build yapılıyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
cd /home/azureuser/budget-app/frontend
echo "Building frontend..."
REACT_APP_API_URL=https://budgetapp.site/api npm run build
echo "Frontend build completed"
ENDSSH

echo -e "${GREEN}✅ Frontend build tamamlandı${NC}"

# 5. Docker containers'ı yeniden başlat
echo -e "\n${YELLOW}🔄 Step 5: Docker containers yeniden başlatılıyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} << 'ENDSSH'
cd /home/azureuser/budget-app
echo "Stopping containers..."
sudo docker-compose down
echo ""
echo "Starting containers..."
sudo docker-compose up -d
echo ""
echo "Waiting for services to start..."
sleep 10
echo ""
echo "Container status:"
sudo docker-compose ps
ENDSSH

echo -e "${GREEN}✅ Docker containers yeniden başlatıldı${NC}"

# 6. Health check
echo -e "\n${YELLOW}🏥 Step 6: Health check yapılıyor...${NC}"
sleep 5

echo "Backend health check..."
BACKEND_HEALTH=$(curl -s https://budgetapp.site/health | grep -o '"status":"OK"' || echo "")
if [ -n "$BACKEND_HEALTH" ]; then
    echo -e "${GREEN}✅ Backend çalışıyor${NC}"
else
    echo -e "${RED}❌ Backend health check başarısız${NC}"
fi

echo ""
echo "Frontend health check..."
FRONTEND_HEALTH=$(curl -s https://budgetapp.site | grep -o '<title>' || echo "")
if [ -n "$FRONTEND_HEALTH" ]; then
    echo -e "${GREEN}✅ Frontend çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend health check başarısız${NC}"
fi

# 7. Özet
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Deployment Tamamlandı!                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}🎉 Multi-language support başarıyla deploy edildi!${NC}"
echo -e "\n${YELLOW}📋 Deployment Özeti:${NC}"
echo -e "  ✅ Git pull yapıldı"
echo -e "  ✅ Backend dependencies yüklendi (i18n paketi dahil)"
echo -e "  ✅ Frontend dependencies yüklendi (react-i18next dahil)"
echo -e "  ✅ Frontend build yapıldı"
echo -e "  ✅ Docker containers yeniden başlatıldı"
echo -e "  ✅ Health check tamamlandı"

echo -e "\n${YELLOW}🌐 Test Etmek İçin:${NC}"
echo -e "  1. Tarayıcıda aç: ${BLUE}https://budgetapp.site${NC}"
echo -e "  2. Login ol"
echo -e "  3. Sağ üstteki 🌐 ikonuna tıkla"
echo -e "  4. Dil değiştir (Türkçe ↔ English)"

echo -e "\n${YELLOW}📊 Logları Kontrol Etmek İçin:${NC}"
echo -e "  ssh ${PROD_USER}@${PROD_HOST}"
echo -e "  cd ${PROD_PATH}"
echo -e "  sudo docker-compose logs -f backend"
echo -e "  sudo docker-compose logs -f frontend"

echo -e "\n${GREEN}✨ Deployment başarıyla tamamlandı!${NC}\n"
