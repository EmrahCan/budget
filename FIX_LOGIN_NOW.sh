#!/bin/bash

echo "🔧 Login Sorunu Düzeltiliyor..."

# Backend'i yeniden build et
cd /home/azureuser/budget-app/budget/backend
echo "📦 Docker image build ediliyor..."
docker build -t budget-backend .

# Eski container'ı durdur ve sil
echo "🛑 Eski container durduruluyor..."
docker stop budget_backend_prod 2>/dev/null || true
docker rm budget_backend_prod 2>/dev/null || true

# Yeni container'ı başlat
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

echo "⏳ Backend'in başlaması bekleniyor (20 saniye)..."
sleep 20

# Logları kontrol et
echo ""
echo "📋 Backend Logları:"
docker logs budget_backend_prod --tail 30

echo ""
echo "🧪 Login Testi:"
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}' \
  | jq '.'

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
echo "Eğer hala sorun varsa:"
echo "docker logs budget_backend_prod --tail 50"
