#!/bin/bash

# Local Development Startup Script
# Bu script local geliştirme ortamını başlatır

set -e

echo "🚀 Budget App - Local Development Başlatılıyor..."
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. PostgreSQL Kontrolü
echo "1️⃣ PostgreSQL Kontrolü..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PostgreSQL çalışıyor${NC}"
else
  echo -e "${RED}❌ PostgreSQL çalışmıyor!${NC}"
  echo "PostgreSQL'i başlatın:"
  echo "  brew services start postgresql@15"
  exit 1
fi
echo ""

# 2. Database Kontrolü
echo "2️⃣ Database Kontrolü..."
if psql -lqt | cut -d \| -f 1 | grep -qw budget_app; then
  echo -e "${GREEN}✅ budget_app database mevcut${NC}"
else
  echo -e "${YELLOW}⚠️  budget_app database bulunamadı, oluşturuluyor...${NC}"
  createdb budget_app
  echo -e "${GREEN}✅ Database oluşturuldu${NC}"
fi
echo ""

# 3. Backend Dependencies
echo "3️⃣ Backend Dependencies Kontrolü..."
cd backend
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Backend dependencies yükleniyor...${NC}"
  npm install
  echo -e "${GREEN}✅ Backend dependencies yüklendi${NC}"
else
  echo -e "${GREEN}✅ Backend dependencies mevcut${NC}"
fi
cd ..
echo ""

# 4. Frontend Dependencies
echo "4️⃣ Frontend Dependencies Kontrolü..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Frontend dependencies yükleniyor...${NC}"
  npm install
  echo -e "${GREEN}✅ Frontend dependencies yüklendi${NC}"
else
  echo -e "${GREEN}✅ Frontend dependencies mevcut${NC}"
fi
cd ..
echo ""

# 5. Environment Files Kontrolü
echo "5️⃣ Environment Files Kontrolü..."

# Backend .env
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  backend/.env bulunamadı, oluşturuluyor...${NC}"
  cat > backend/.env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=budget_app_secret_key_2024_development
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# AI Configuration
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-flash
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true
AI_RATE_LIMIT=60
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_ENABLE_LOGGING=true

# Production AI Settings
AI_USE_MOCK_DATA=false
AI_CATEGORIZATION_MIN_CONFIDENCE=70
AI_INSIGHT_MIN_CONFIDENCE=60
AI_RECOMMENDATION_MIN_CONFIDENCE=75
EOF
  echo -e "${GREEN}✅ backend/.env oluşturuldu${NC}"
else
  echo -e "${GREEN}✅ backend/.env mevcut${NC}"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
  echo -e "${YELLOW}⚠️  frontend/.env bulunamadı, oluşturuluyor...${NC}"
  cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5001/api
PORT=3002
EOF
  echo -e "${GREEN}✅ frontend/.env oluşturuldu${NC}"
else
  echo -e "${GREEN}✅ frontend/.env mevcut${NC}"
fi
echo ""

# 6. Port Kontrolü
echo "6️⃣ Port Kontrolü..."

# Backend port (5001)
if lsof -ti:5001 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Port 5001 kullanımda, process durduruluyor...${NC}"
  kill -9 $(lsof -ti:5001) 2>/dev/null || true
  sleep 1
fi
echo -e "${GREEN}✅ Port 5001 hazır${NC}"

# Frontend port (3002)
if lsof -ti:3002 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Port 3002 kullanımda, process durduruluyor...${NC}"
  kill -9 $(lsof -ti:3002) 2>/dev/null || true
  sleep 1
fi
echo -e "${GREEN}✅ Port 3002 hazır${NC}"
echo ""

# 7. Test Kullanıcısı Kontrolü
echo "7️⃣ Test Kullanıcısı Kontrolü..."
USER_EXISTS=$(psql -d budget_app -tAc "SELECT COUNT(*) FROM users WHERE email='test@local.com';" 2>/dev/null || echo "0")

if [ "$USER_EXISTS" = "0" ]; then
  echo -e "${YELLOW}⚠️  Test kullanıcısı bulunamadı${NC}"
  echo "Backend başladıktan sonra test kullanıcısı oluşturulacak"
else
  echo -e "${GREEN}✅ Test kullanıcısı mevcut (test@local.com)${NC}"
fi
echo ""

# 8. Backend Başlat
echo "8️⃣ Backend Başlatılıyor..."
echo "   URL: http://localhost:5001"
echo "   Logs: backend/logs/"
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend başlatıldı (PID: $BACKEND_PID)${NC}"
echo ""

# Backend'in hazır olmasını bekle
echo "⏳ Backend'in hazır olması bekleniyor..."
for i in {1..30}; do
  if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend hazır!${NC}"
    break
  fi
  sleep 1
  echo -n "."
done
echo ""
echo ""

# 9. Frontend Başlat
echo "9️⃣ Frontend Başlatılıyor..."
echo "   URL: http://localhost:3002"
cd frontend
BROWSER=none npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend başlatıldı (PID: $FRONTEND_PID)${NC}"
echo ""

# Frontend'in hazır olmasını bekle
echo "⏳ Frontend'in hazır olması bekleniyor..."
for i in {1..60}; do
  if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend hazır!${NC}"
    break
  fi
  sleep 1
  echo -n "."
done
echo ""
echo ""

# 10. Test Kullanıcısı Oluştur (eğer yoksa)
if [ "$USER_EXISTS" = "0" ]; then
  echo "🔐 Test Kullanıcısı Oluşturuluyor..."
  sleep 2
  REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@local.com","password":"Test123!","firstName":"Test","lastName":"User"}')
  
  if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Test kullanıcısı oluşturuldu${NC}"
  else
    echo -e "${YELLOW}⚠️  Test kullanıcısı oluşturulamadı (zaten var olabilir)${NC}"
  fi
  echo ""
fi

# 11. Özet
echo "=================================================="
echo -e "${GREEN}✅ Local Development Ortamı Hazır!${NC}"
echo "=================================================="
echo ""
echo "📊 Servis Bilgileri:"
echo "  • Backend:  http://localhost:5001"
echo "  • Frontend: http://localhost:3002"
echo "  • Database: localhost:5432/budget_app"
echo ""
echo "🔐 Test Kullanıcısı:"
echo "  • Email:    test@local.com"
echo "  • Password: Test123!"
echo ""
echo "📝 Loglar:"
echo "  • Backend:  tail -f backend.log"
echo "  • Frontend: tail -f frontend.log"
echo ""
echo "🛑 Durdurmak için:"
echo "  • kill $BACKEND_PID $FRONTEND_PID"
echo "  • veya: ./stop-local.sh"
echo ""
echo "🌐 Tarayıcıda aç: http://localhost:3002"
echo ""

# PID'leri kaydet
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "Process ID'ler kaydedildi (.backend.pid, .frontend.pid)"
echo ""
