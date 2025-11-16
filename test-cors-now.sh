#!/bin/bash

echo "🔍 CORS ve Login Sorununu Test Ediyoruz..."
echo ""

# 1. Backend container loglarını kontrol et
echo "📋 Backend logları:"
docker logs budget_backend_prod --tail 50

echo ""
echo "---"
echo ""

# 2. CORS preflight test
echo "🧪 CORS Preflight Test (OPTIONS):"
curl -X OPTIONS http://localhost:5001/api/auth/login \
  -H "Origin: http://98.71.149.168" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -i

echo ""
echo "---"
echo ""

# 3. Gerçek login denemesi
echo "🔐 Login Test (POST):"
curl -X POST http://localhost:5001/api/auth/login \
  -H "Origin: http://98.71.149.168" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -i

echo ""
echo "---"
echo ""

# 4. Backend container içindeki server.js'i kontrol et
echo "📄 Backend container'daki server.js CORS konfigürasyonu:"
docker exec budget_backend_prod grep -A 30 "app.use(cors" /app/server.js | head -40

echo ""
echo "✅ Test tamamlandı!"
