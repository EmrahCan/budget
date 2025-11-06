#!/bin/bash

echo "🚀 Budget App - Complete VM Deployment"
echo "======================================="
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hata kontrolü
set -e
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
trap 'echo -e "${RED}❌ Hata: \"${last_command}\" komutu başarısız oldu${NC}"' ERR

echo -e "${YELLOW}📋 Adım 1: Mevcut container'ları temizleme${NC}"
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
docker rm -f budget_backend_prod budget_frontend_prod budget_database_prod 2>/dev/null || true
echo -e "${GREEN}✅ Temizlik tamamlandı${NC}"
echo ""

echo -e "${YELLOW}📋 Adım 2: Docker network kontrolü${NC}"
docker network create budget_network 2>/dev/null || echo "Network zaten mevcut"
echo -e "${GREEN}✅ Network hazır${NC}"
echo ""

echo -e "${YELLOW}📋 Adım 3: Backend image build${NC}"
cd budget/backend
docker build -t budget-backend . --no-cache
cd ../..
echo -e "${GREEN}✅ Backend image hazır${NC}"
echo ""

echo -e "${YELLOW}📋 Adım 4: Frontend image build${NC}"
cd budget/frontend
docker build -t budget-frontend \
  --build-arg REACT_APP_API_URL=http://108.143.146.143:5001/api \
  --build-arg NODE_ENV=production \
  --build-arg GENERATE_SOURCEMAP=false \
  . --no-cache
cd ../..
echo -e "${GREEN}✅ Frontend image hazır${NC}"
echo ""

echo -e "${YELLOW}📋 Adım 5: Database başlatma${NC}"
docker run -d \
  --name budget_database_prod \
  --network budget_network \
  -e POSTGRES_DB=budget_app_prod \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=BudgetApp2024!SecurePassword \
  -e POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C" \
  -v postgres_data:/var/lib/postgresql/data \
  -v $(pwd)/budget/backend/database/init:/docker-entrypoint-initdb.d \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:15-alpine

echo "⏳ Database'in başlaması bekleniyor (30 saniye)..."
sleep 30

# Database health check
echo "🔍 Database health check..."
for i in {1..10}; do
  if docker exec budget_database_prod pg_isready -U postgres -d budget_app_prod > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database hazır${NC}"
    break
  fi
  echo "⏳ Deneme $i/10..."
  sleep 3
done
echo ""

echo -e "${YELLOW}📋 Adım 6: Backend başlatma${NC}"
docker run -d \
  --name budget_backend_prod \
  --network budget_network \
  -e NODE_ENV=production \
  -e PORT=5001 \
  -e DB_HOST=database \
  -e DB_PORT=5432 \
  -e DB_NAME=budget_app_prod \
  -e DB_USER=postgres \
  -e DB_PASSWORD=BudgetApp2024!SecurePassword \
  -e JWT_SECRET=budget_app_super_secret_jwt_key_2024 \
  -e JWT_EXPIRES_IN=7d \
  -e GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g \
  -e GEMINI_MODEL=gemini-1.5-pro \
  -e AI_USE_MOCK_DATA=true \
  -e FRONTEND_URL=http://108.143.146.143 \
  -v $(pwd)/budget/logs:/app/logs \
  -v $(pwd)/budget/uploads:/app/uploads \
  -p 5001:5001 \
  --restart unless-stopped \
  budget-backend

echo "⏳ Backend'in başlaması bekleniyor (20 saniye)..."
sleep 20

# Backend health check
echo "🔍 Backend health check..."
for i in {1..10}; do
  if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend hazır${NC}"
    break
  fi
  echo "⏳ Deneme $i/10..."
  sleep 3
done
echo ""

echo -e "${YELLOW}📋 Adım 7: Frontend başlatma${NC}"
docker run -d \
  --name budget_frontend_prod \
  --network budget_network \
  -e REACT_APP_API_URL=http://108.143.146.143:5001/api \
  -p 80:3000 \
  --restart unless-stopped \
  budget-frontend

echo "⏳ Frontend'in başlaması bekleniyor (15 saniye)..."
sleep 15
echo -e "${GREEN}✅ Frontend hazır${NC}"
echo ""

echo -e "${YELLOW}📋 Adım 8: Sistem testleri${NC}"
echo ""

# Database connection test
echo "🔍 Test 1: Database bağlantısı"
docker exec budget_backend_prod node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_prod',
  user: 'postgres',
  password: 'BudgetApp2024!SecurePassword'
});

pool.query('SELECT NOW() as time, version() as version', (err, res) => {
  if (err) {
    console.log('❌ BAŞARISIZ:', err.message);
    process.exit(1);
  } else {
    console.log('✅ BAŞARILI');
    console.log('   Zaman:', res.rows[0].time);
    console.log('   Versiyon:', res.rows[0].version.split(' ')[0] + ' ' + res.rows[0].version.split(' ')[1]);
  }
  pool.end();
});
" || echo -e "${RED}❌ Database bağlantı testi başarısız${NC}"
echo ""

# User check
echo "🔍 Test 2: Admin kullanıcısı kontrolü"
docker exec budget_backend_prod node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_prod',
  user: 'postgres',
  password: 'BudgetApp2024!SecurePassword'
});

pool.query('SELECT id, email, created_at FROM users WHERE email = \$1', ['admin@budgetapp.com'], (err, res) => {
  if (err) {
    console.log('❌ BAŞARISIZ:', err.message);
    process.exit(1);
  } else if (res.rows.length === 0) {
    console.log('❌ Admin kullanıcısı bulunamadı');
    process.exit(1);
  } else {
    console.log('✅ BAŞARILI');
    console.log('   Email:', res.rows[0].email);
    console.log('   ID:', res.rows[0].id);
    console.log('   Oluşturulma:', res.rows[0].created_at);
  }
  pool.end();
});
" || echo -e "${RED}❌ Kullanıcı kontrolü başarısız${NC}"
echo ""

# Login test
echo "🔍 Test 3: Login API testi"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://108.143.146.143" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✅ BAŞARILI - Login çalışıyor${NC}"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
else
  echo -e "${RED}❌ BAŞARISIZ - Login çalışmıyor${NC}"
  echo "$LOGIN_RESPONSE"
fi
echo ""

# Frontend test
echo "🔍 Test 4: Frontend erişim testi"
if curl -f http://localhost:80 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ BAŞARILI - Frontend erişilebilir${NC}"
else
  echo -e "${RED}❌ BAŞARISIZ - Frontend erişilemiyor${NC}"
fi
echo ""

echo "======================================="
echo -e "${GREEN}🎉 Deployment tamamlandı!${NC}"
echo "======================================="
echo ""
echo "📊 Container Durumları:"
docker ps --filter "name=budget_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 Erişim Bilgileri:"
echo "   Frontend: http://108.143.146.143"
echo "   Backend:  http://108.143.146.143:5001"
echo "   Health:   http://108.143.146.143:5001/health"
echo ""
echo "🔐 Login Bilgileri:"
echo "   Email:    admin@budgetapp.com"
echo "   Password: admin123"
echo ""
echo "📋 Yararlı Komutlar:"
echo "   Logları görüntüle:  docker logs budget_backend_prod -f"
echo "   Container'ı durdur: docker stop budget_backend_prod"
echo "   Yeniden başlat:     docker restart budget_backend_prod"
echo ""
