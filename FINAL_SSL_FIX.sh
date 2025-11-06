#!/bin/bash

echo "🔧 SSL Sorunu Kesin Çözüm - Final Fix"
echo "======================================"

# 1. Mevcut container'ları durdur ve temizle
echo "📦 Container'ları durduruluyor..."
docker-compose -f docker-compose.prod.yml down

# 2. Backend image'ını yeniden build et
echo "🏗️  Backend image'ı yeniden build ediliyor..."
docker build -t budget-backend ./backend

# 3. Container'ları başlat
echo "🚀 Container'lar başlatılıyor..."
docker-compose -f docker-compose.prod.yml up -d

# 4. Backend'in başlamasını bekle
echo "⏳ Backend'in başlaması bekleniyor (30 saniye)..."
sleep 30

# 5. Backend loglarını kontrol et
echo ""
echo "📋 Backend Logları:"
echo "==================="
docker logs budget_backend_prod --tail 20

# 6. Database bağlantısını test et
echo ""
echo "🔍 Database Bağlantı Testi:"
echo "==========================="
docker exec budget_backend_prod node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_prod',
  user: 'postgres',
  password: 'BudgetApp2024!SecurePassword'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Bağlantı BAŞARISIZ:', err.message);
  } else {
    console.log('✅ Bağlantı BAŞARILI:', res.rows[0].now);
  }
  pool.end();
});
"

# 7. Login testi
echo ""
echo "🔐 Login Testi:"
echo "==============="
sleep 5
curl -X POST http://108.143.146.143:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://108.143.146.143" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}' \
  -s | jq '.'

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
echo "📝 Sonraki Adımlar:"
echo "  1. Yukarıdaki login testinin başarılı olduğunu kontrol edin"
echo "  2. Browser'dan http://108.143.146.143 adresine gidin"
echo "  3. admin@budgetapp.com / admin123 ile giriş yapın"
