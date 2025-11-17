# Azure VM Debug Komutları - Esnek Hesap Silme Sorunu

## 1️⃣ Backend Loglarını Kontrol Et

```bash
# Backend container loglarını görüntüle
docker logs budget_backend_prod --tail=100 -f

# Veya docker-compose ile
cd ~/budget
docker-compose -f docker-compose.prod.yml logs backend --tail=100 -f
```

## 2️⃣ Veritabanı Bağlantısını Test Et

```bash
# PostgreSQL'e bağlan
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod

# Veritabanında çalıştır:
\dt                                    # Tabloları listele
SELECT * FROM accounts WHERE type = 'overdraft';  # Esnek hesapları göster
\q                                     # Çık
```

## 3️⃣ Backend API'yi Test Et

```bash
# Health check
curl http://localhost:5001/health

# Accounts endpoint'ini test et (token gerekli)
# Önce login olup token al
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@budget.com","password":"demo123"}'

# Token'ı kullanarak hesapları listele
curl -X GET http://localhost:5001/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4️⃣ Frontend Loglarını Kontrol Et

```bash
# Frontend container loglarını görüntüle
docker logs budget_frontend_prod --tail=100 -f
```

## 5️⃣ Network ve CORS Kontrolü

```bash
# Backend'in dinlediği portları kontrol et
docker exec budget_backend_prod netstat -tlnp

# Environment variables'ı kontrol et
docker exec budget_backend_prod env | grep -E 'NODE_ENV|PORT|DB_|FRONTEND_URL|CORS'
```

## 6️⃣ Hesap Silme İşlemini Manuel Test Et

```bash
# Backend container'a gir
docker exec -it budget_backend_prod sh

# Node.js console'da test et
node
> const pool = require('./config/database');
> pool.query('SELECT * FROM accounts WHERE type = \'overdraft\'').then(r => console.log(r.rows));
> .exit
```

## 7️⃣ Hata Loglarını Ara

```bash
# Backend'de hata loglarını ara
docker logs budget_backend_prod 2>&1 | grep -i "error\|delete\|account"

# Tüm container'ların durumunu kontrol et
docker-compose -f docker-compose.prod.yml ps
```

## 8️⃣ Browser Console Hatalarını Kontrol Et

Frontend'de (tarayıcıda):
1. F12 ile Developer Tools'u aç
2. Console tab'ına git
3. Network tab'ına git
4. Esnek hesap silmeyi dene
5. Hata mesajlarını ve network request'leri kontrol et

## 9️⃣ Veritabanı Transaction Loglarını Kontrol Et

```bash
# PostgreSQL loglarını kontrol et
docker logs budget_database_prod --tail=100 | grep -i "delete\|error"
```

## 🔟 Backend Kodunu Kontrol Et

```bash
# Backend dizinine git
cd ~/budget/backend

# Account model dosyasını kontrol et
cat models/Account.js | grep -A 30 "async delete"

# Account controller'ı kontrol et
cat controllers/accountController.js | grep -A 20 "deleteAccount"
```

---

## 🎯 Muhtemel Sorunlar ve Çözümler

### Sorun 1: CORS Hatası
**Belirti**: Frontend'de "CORS policy" hatası
**Çözüm**:
```bash
# Backend .env dosyasını kontrol et
docker exec budget_backend_prod cat .env | grep FRONTEND_URL

# Doğru IP'yi ayarla
nano ~/budget/backend/.env
# FRONTEND_URL=http://YOUR_VM_IP:3000

# Container'ı yeniden başlat
docker-compose -f docker-compose.prod.yml restart backend
```

### Sorun 2: Database Connection Error
**Belirti**: "Cannot connect to database" hatası
**Çözüm**:
```bash
# Database container'ın çalıştığını kontrol et
docker ps | grep database

# Database health check
docker exec budget_database_prod pg_isready -U postgres

# Yeniden başlat
docker-compose -f docker-compose.prod.yml restart database backend
```

### Sorun 3: Transaction Constraint Error
**Belirti**: "Cannot delete account with transactions"
**Çözüm**:
```bash
# Hesabın transaction'larını kontrol et
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod -c \
  "SELECT COUNT(*) FROM transactions WHERE account_id = ACCOUNT_ID_HERE;"

# Soft delete yapılıyor mu kontrol et
docker logs budget_backend_prod | grep "deactivated"
```

### Sorun 4: Authentication/Authorization Error
**Belirti**: 401 veya 403 hatası
**Çözüm**:
```bash
# JWT secret'ı kontrol et
docker exec budget_backend_prod env | grep JWT_SECRET

# Token'ın geçerli olduğunu doğrula (browser'da)
# localStorage.getItem('token')
```

---

## 📝 Debug Bilgilerini Topla

Tüm bilgileri bir dosyaya kaydet:

```bash
# Debug bilgilerini topla
cd ~/budget
cat > debug_info.txt << 'EOF'
=== CONTAINER STATUS ===
EOF
docker-compose -f docker-compose.prod.yml ps >> debug_info.txt

echo -e "\n=== BACKEND LOGS ===" >> debug_info.txt
docker logs budget_backend_prod --tail=50 >> debug_info.txt 2>&1

echo -e "\n=== DATABASE STATUS ===" >> debug_info.txt
docker exec budget_database_prod pg_isready -U postgres >> debug_info.txt 2>&1

echo -e "\n=== ENVIRONMENT VARIABLES ===" >> debug_info.txt
docker exec budget_backend_prod env | grep -E 'NODE_ENV|PORT|DB_|FRONTEND' >> debug_info.txt

echo -e "\n=== OVERDRAFT ACCOUNTS ===" >> debug_info.txt
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod -c \
  "SELE