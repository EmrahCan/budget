#!/bin/bash

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Budget App - Quick Deploy Script${NC}"
echo "================================================"

# Git pull
echo -e "\n${YELLOW}📥 Git'ten son değişiklikler çekiliyor...${NC}"
cd /home/azureuser/budget-app
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull başarısız!${NC}"
    exit 1
fi

# Backend build
echo -e "\n${YELLOW}🔨 Backend Docker image build ediliyor...${NC}"
cd /home/azureuser/budget-app/budget/backend
docker build -t budget-backend .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build başarısız!${NC}"
    exit 1
fi

# Eski container'ı durdur
echo -e "\n${YELLOW}🛑 Eski container durduruluyor...${NC}"
docker stop budget_backend_prod 2>/dev/null || true
docker rm budget_backend_prod 2>/dev/null || true

# Yeni container başlat
echo -e "\n${YELLOW}🚀 Yeni container başlatılıyor...${NC}"
docker run -d \
  --name budget_backend_prod \
  --network budget_network \
  -e NODE_ENV=production \
  -e PORT=5001 \
  -e DB_HOST=budget_database_prod \
  -e DB_PORT=5432 \
  -e DB_NAME=budget_app_prod \
  -e DB_USER=postgres \
  -e 'DB_PASSWORD=BudgetApp2024!SecurePassword' \
  -e JWT_SECRET=budget_app_super_secret_jwt_key_2024 \
  -e GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g \
  -p 5001:5001 \
  --restart unless-stopped \
  budget-backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Container başlatılamadı!${NC}"
    exit 1
fi

# Bekle
echo -e "\n${YELLOW}⏳ Backend'in başlaması bekleniyor (20 saniye)...${NC}"
sleep 20

# Logları göster
echo -e "\n${YELLOW}📋 Backend Logları:${NC}"
docker logs budget_backend_prod --tail 30

# Test
echo -e "\n${YELLOW}🧪 Login Testi:${NC}"
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Sonuç kontrolü
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "\n${GREEN}✅ BAŞARILI! Login çalışıyor!${NC}"
else
    echo -e "\n${RED}❌ HATA! Login çalışmıyor!${NC}"
    echo -e "${YELLOW}Detaylı loglar için: docker logs budget_backend_prod${NC}"
fi

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment tamamlandı!${NC}"
