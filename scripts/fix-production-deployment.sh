#!/bin/bash

echo "🚀 Azure VM'de production deployment sorunlarını düzeltiyoruz..."

# Bu script Azure VM'de ~/budget dizininde çalıştırılmalıdır
# Kullanım: cd ~/budget && bash scripts/fix-production-deployment.sh

# Mevcut dizini kontrol et
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml bulunamadı!"
    echo "Bu script ~/budget dizininde çalıştırılmalıdır"
    echo "Komut: cd ~/budget && bash scripts/fix-production-deployment.sh"
    exit 1
fi

echo "✅ Azure VM'de ~/budget dizinindeyiz"

# 1. Mevcut servisleri durdur
echo "🔄 Mevcut servisleri durduruyor..."
docker-compose -f docker-compose.prod.yml down

# 2. Backend'i yeniden build et (değişiklikleri almak için)
echo "🔨 Backend'i yeniden build ediyoruz..."
docker-compose -f docker-compose.prod.yml build backend --no-cache

# 3. Servisleri başlat
echo "🚀 Servisleri başlatıyoruz..."
docker-compose -f docker-compose.prod.yml up -d

# 4. Servislerin başlamasını bekle
echo "⏳ Servislerin başlamasını bekliyoruz..."
sleep 20

# 5. Servis durumunu kontrol et
echo "📊 Servis durumu:"
docker-compose -f docker-compose.prod.yml ps

# 6. Admin password'unu düzelt
echo "🔐 Admin password'unu düzeltiyoruz..."
docker exec budget_backend_prod node /app/scripts/fix-admin-password.js

# 7. Database bağlantısını test et
echo "🔍 Database bağlantısını test ediyoruz..."
docker exec budget_backend_prod node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_prod',
  user: 'postgres',
  password: 'postgres',
  ssl: false
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT id, email FROM users WHERE email = \$1', ['admin@budgetapp.com']);
    console.log('✅ Database bağlantısı başarılı');
    console.log('✅ Admin kullanıcı bulundu:', result.rows.length > 0);
    if (result.rows.length > 0) {
      console.log('✅ Admin kullanıcı:', result.rows[0]);
    }
  } catch (err) {
    console.log('❌ Database hatası:', err.message);
  } finally {
    pool.end();
  }
}

testConnection();
"

# 8. Authentication endpoint'ini test et
echo "🔐 Authentication endpoint'ini test ediyoruz..."
sleep 5

echo "Test ediliyor: http://108.143.146.143:5001/api/auth/login"
curl -X POST http://108.143.146.143:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://108.143.146.143" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}' \
  --max-time 10 \
  --connect-timeout 5

echo ""

# 9. CORS'u test et
echo "🌐 CORS konfigürasyonunu test ediyoruz..."
curl -X OPTIONS http://108.143.146.143:5001/api/auth/login \
  -H "Origin: http://108.143.146.143" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  --max-time 10 \
  --connect-timeout 5 \
  -I

echo ""

# 10. Backend loglarını göster
echo "📋 Backend logları (son 15 satır):"
docker logs budget_backend_prod --tail 15

echo ""
echo "🎉 Azure VM'de production deployment düzeltmeleri tamamlandı!"
echo "🌐 Uygulamayı test edin: http://108.143.146.143"
echo "👤 Admin giriş bilgileri: admin@budgetapp.com / admin123"
echo ""
echo "🔍 Sorun devam ederse şu komutları çalıştırın:"
echo "   docker logs budget_backend_prod --tail 50"
echo "   docker logs budget_frontend_prod --tail 20"
echo "   docker-compose -f docker-compose.prod.yml ps"