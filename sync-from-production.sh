#!/bin/bash

# Production'dan local'e senkronizasyon scripti

echo "🔄 Production'dan local'e senkronizasyon başlıyor..."

# Production sunucu bilgileri
PROD_USER="azureuser"
PROD_HOST="budgetapp.site"
PROD_PATH="/home/azureuser/budget-app"

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Production'daki dosyaları kontrol ediliyor...${NC}"

# Backend dosyalarını karşılaştır
echo -e "\n${YELLOW}🔍 Backend dosyaları kontrol ediliyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} "cd ${PROD_PATH}/backend && find . -name '*.js' -type f | grep -v node_modules | sort" > /tmp/prod_backend_files.txt
find backend -name '*.js' -type f | grep -v node_modules | sort > /tmp/local_backend_files.txt

echo -e "${GREEN}Production'da olan ama local'de olmayan backend dosyaları:${NC}"
comm -23 /tmp/prod_backend_files.txt /tmp/local_backend_files.txt

echo -e "\n${RED}Local'de olan ama production'da olmayan backend dosyaları:${NC}"
comm -13 /tmp/prod_backend_files.txt /tmp/local_backend_files.txt

# Frontend dosyalarını karşılaştır
echo -e "\n${YELLOW}🔍 Frontend dosyaları kontrol ediliyor...${NC}"
ssh ${PROD_USER}@${PROD_HOST} "cd ${PROD_PATH}/frontend/src && find . -name '*.js' -o -name '*.jsx' | grep -v node_modules | sort" > /tmp/prod_frontend_files.txt
find frontend/src -name '*.js' -o -name '*.jsx' | grep -v node_modules | sort > /tmp/local_frontend_files.txt

echo -e "${GREEN}Production'da olan ama local'de olmayan frontend dosyaları:${NC}"
comm -23 /tmp/prod_frontend_files.txt /tmp/local_frontend_files.txt

echo -e "\n${RED}Local'de olan ama production'da olmayan frontend dosyaları:${NC}"
comm -13 /tmp/prod_frontend_files.txt /tmp/local_frontend_files.txt

# Package.json karşılaştırması
echo -e "\n${YELLOW}📦 Package.json karşılaştırması...${NC}"
echo -e "${GREEN}Backend dependencies:${NC}"
ssh ${PROD_USER}@${PROD_HOST} "cd ${PROD_PATH}/backend && cat package.json" > /tmp/prod_backend_package.json
diff -u backend/package.json /tmp/prod_backend_package.json | grep "^[+-]" | grep -v "^[+-][+-][+-]" || echo "Aynı"

echo -e "\n${GREEN}Frontend dependencies:${NC}"
ssh ${PROD_USER}@${PROD_HOST} "cd ${PROD_PATH}/frontend && cat package.json" > /tmp/prod_frontend_package.json
diff -u frontend/package.json /tmp/prod_frontend_package.json | grep "^[+-]" | grep -v "^[+-][+-][+-]" || echo "Aynı"

# Temizlik
rm -f /tmp/prod_*.txt /tmp/prod_*.json

echo -e "\n${GREEN}✅ Karşılaştırma tamamlandı!${NC}"
echo -e "${YELLOW}💡 Eksik dosyaları production'dan çekmek için:${NC}"
echo -e "   scp ${PROD_USER}@${PROD_HOST}:${PROD_PATH}/path/to/file ./path/to/file"
