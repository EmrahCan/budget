#!/bin/bash

# VM'de çalıştırılacak deployment script
# Branch: fix/login-and-ssl-issues

echo "🚀 Deployment başlıyor..."
echo "Branch: fix/login-and-ssl-issues"
echo ""

# Git pull
echo "📥 Git'ten son değişiklikler çekiliyor..."
cd /home/emrahcan/budget
git fetch origin
git checkout fix/login-and-ssl-issues
git pull origin fix/login-and-ssl-issues

if [ $? -ne 0 ]; then
    echo "❌ Git pull başarısız!"
    exit 1
fi

echo "✅ Git pull başarılı"
echo ""

# Backend build
echo "🔨 Backend Docker image build ediliyor..."
cd /home/emrahcan/budget/backend
docker build -t budget-backend .

if [ $? -ne 0 ]; then
    echo "❌ Docker build başarısız!"
    exit 1
fi

echo "✅ Docker build başarılı"
echo ""

# Eski container'ı durdur
echo "🛑 Eski container durduruluyor..."
docker stop budget_backend_prod 2>/dev/null || true
docker rm budget_backend_prod 2>/dev/null || true

# Yeni container başlat
echo "🚀 Yeni container başlatılıyor..."
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
    echo "❌ Container başlatılamadı!"
    exit 1
fi

echo "✅ Container başlatıldı"
echo ""

# Bekle
echo "⏳ Backend'in başlaması bekleniyor (20 saniye)..."
sleep 20

# Logları göster
echo ""
echo "📋 Backend Logları:"
docker logs budget_backend_prod --tail 30

# Test
echo ""
echo "🧪 Login Testi:"
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Sonuç kontrolü
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ BAŞARILI! Login çalışıyor!"
    echo ""
    echo "🎉 Deployment tamamlandı!"
else
    echo ""
    echo "❌ HATA! Login çalışmıyor!"
    echo ""
    echo "Detaylı loglar için:"
    echo "docker logs budget_backend_prod"
fi
