# Azure VM'de Çalıştırılacak Komutlar

Bu komutları Azure VM'de sırasıyla çalıştırın:

## 1. VM'ye Bağlanın ve Dizine Geçin
```bash
# SSH ile VM'ye bağlanın
ssh emrahcan@108.143.146.143

# Budget dizinine geçin
cd ~/budget
```

## 2. Mevcut Durumu Kontrol Edin
```bash
# Mevcut servisleri kontrol edin
docker-compose -f docker-compose.prod.yml ps

# Backend loglarını kontrol edin
docker logs budget_backend_prod --tail 20
```

## 3. Değişiklikleri Uygulayın (Manuel)

### A. Database Konfigürasyonunu Düzeltin
```bash
# Backend container'ına girin
docker exec -it budget_backend_prod sh

# Database config dosyasını düzenleyin
sed -i 's/password: process.env.DB_PASSWORD || '\''password123'\''/password: process.env.DB_PASSWORD || '\''postgres'\''/' /app/config/database.js
sed -i 's/ssl: process.env.NODE_ENV === '\''production'\'' ? { rejectUnauthorized: false } : false/ssl: false/' /app/config/database.js

# Container'dan çıkın
exit
```

### B. Admin Password'unu Düzeltin
```bash
# Admin password fix script'ini çalıştırın
docker exec budget_backend_prod node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function fixPassword() {
  const pool = new Pool({
    host: 'database',
    port: 5432,
    database: 'budget_app_prod',
    user: 'postgres',
    password: 'postgres',
    ssl: false
  });
  
  try {
    const hash = await bcrypt.hash('admin123', 12);
    console.log('Generated hash:', hash);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = \$1 WHERE email = \$2 RETURNING id, email',
      [hash, 'admin@budgetapp.com']
    );
    
    if (result.rows.length === 0) {
      const createResult = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES (\$1, \$2, \$3, \$4, \$5, \$6) RETURNING id, email',
        ['admin@budgetapp.com', hash, 'Admin', 'User', 'admin', true]
      );
      console.log('Admin user created:', createResult.rows[0]);
    } else {
      console.log('Admin user updated:', result.rows[0]);
    }
    
    // Test password
    const testResult = await pool.query('SELECT password_hash FROM users WHERE email = \$1', ['admin@budgetapp.com']);
    const isValid = await bcrypt.compare('admin123', testResult.rows[0].password_hash);
    console.log('Password test:', isValid ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

fixPassword();
"
```

## 4. Servisleri Yeniden Başlatın
```bash
# Servisleri durdurun
docker-compose -f docker-compose.prod.yml down

# Backend'i yeniden build edin
docker-compose -f docker-compose.prod.yml build backend --no-cache

# Servisleri başlatın
docker-compose -f docker-compose.prod.yml up -d

# Başlamasını bekleyin
sleep 20
```

## 5. Test Edin
```bash
# Database bağlantısını test edin
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

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.log('❌ DB Error:', err.message);
  else console.log('✅ DB Connected successfully');
  pool.end();
});
"

# Login'i test edin
curl -X POST http://108.143.146.143:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://108.143.146.143" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}'
```

## 6. CORS Test Edin
```bash
# CORS preflight test
curl -X OPTIONS http://108.143.146.143:5001/api/auth/login \
  -H "Origin: http://108.143.146.143" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -I
```

## 7. Logları Kontrol Edin
```bash
# Backend logları
docker logs budget_backend_prod --tail 30

# Frontend logları
docker logs budget_frontend_prod --tail 20

# Servis durumu
docker-compose -f docker-compose.prod.yml ps
```

## Otomatik Script (Alternatif)
Yukarıdaki adımları otomatik yapmak için:
```bash
# Script'i çalıştırılabilir yapın
chmod +x scripts/fix-production-deployment.sh

# Script'i çalıştırın
bash scripts/fix-production-deployment.sh
```

## Sorun Giderme
Eğer sorunlar devam ederse:
```bash
# Tüm container'ları temizleyin
docker-compose -f docker-compose.prod.yml down -v
docker system prune -f

# Yeniden başlatın
docker-compose -f docker-compose.prod.yml up -d --build
```