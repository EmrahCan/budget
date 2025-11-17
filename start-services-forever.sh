#!/bin/bash

# Budget App servislerini sürekli çalışır halde başlatır
# pm2 kullanarak process management yapar

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Budget App - Sürekli Çalışan Servisler${NC}\n"

# pm2 kurulu mu kontrol et
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}pm2 bulunamadı, yükleniyor...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ pm2 yüklendi${NC}"
fi

# PostgreSQL kontrol
echo -e "\n${YELLOW}1. PostgreSQL kontrol ediliyor...${NC}"
if pg_isready > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL çalışıyor${NC}"
else
    echo -e "${YELLOW}PostgreSQL başlatılıyor...${NC}"
    brew services start postgresql@14
    sleep 3
    echo -e "${GREEN}✅ PostgreSQL başlatıldı${NC}"
fi

# Mevcut pm2 process'lerini durdur
echo -e "\n${YELLOW}2. Mevcut servisler durduruluyor...${NC}"
pm2 delete budget-backend 2>/dev/null || true
pm2 delete budget-frontend 2>/dev/null || true
pm2 save --force

# Backend başlat
echo -e "\n${YELLOW}3. Backend başlatılıyor...${NC}"
cd backend
pm2 start server.js --name budget-backend \
    --time \
    --log ../logs/backend-pm2.log \
    --error ../logs/backend-pm2-error.log \
    --env development

# Frontend başlat
echo -e "\n${YELLOW}4. Frontend başlatılıyor...${NC}"
cd ../frontend
pm2 start npm --name budget-frontend \
    --time \
    --log ../logs/frontend-pm2.log \
    --error ../logs/frontend-pm2-error.log \
    -- start

cd ..

# pm2'yi sistem başlangıcına ekle
echo -e "\n${YELLOW}5. Otomatik başlatma ayarlanıyor...${NC}"
pm2 save
pm2 startup

echo -e "\n${GREEN}✅ Servisler başlatıldı!${NC}"

# Durum göster
echo -e "\n${YELLOW}📊 Servis Durumu:${NC}"
pm2 list

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Servisler Sürekli Çalışacak! 🎉                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📋 Kullanım:${NC}"
echo -e "  • Backend: http://localhost:5001"
echo -e "  • Frontend: http://localhost:3002 (build sürüyor, 2-3 dk bekle)"
echo ""
echo -e "${YELLOW}🔧 Yönetim Komutları:${NC}"
echo -e "  • Durumu gör:        pm2 list"
echo -e "  • Logları gör:       pm2 logs"
echo -e "  • Backend log:       pm2 logs budget-backend"
echo -e "  • Frontend log:      pm2 logs budget-frontend"
echo -e "  • Yeniden başlat:    pm2 restart all"
echo -e "  • Durdur:            pm2 stop all"
echo -e "  • Başlat:            pm2 start all"
echo -e "  • Kaldır:            pm2 delete all"
echo -e "  • Monitoring:        pm2 monit"
echo ""
echo -e "${GREEN}✨ Bilgisayar kapanıp açılsa bile otomatik başlayacak!${NC}\n"
