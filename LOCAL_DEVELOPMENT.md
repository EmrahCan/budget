# 🚀 Local Development - Hızlı Başlangıç

## ⚡ Tek Komutla Başlat

```bash
./start-local.sh
```

Bu komut:
- ✅ PostgreSQL'i kontrol eder
- ✅ Database'i kontrol eder (yoksa oluşturur)
- ✅ Dependencies'leri kontrol eder
- ✅ Environment dosyalarını kontrol eder
- ✅ Portları temizler
- ✅ Backend'i başlatır (http://localhost:5001)
- ✅ Frontend'i başlatır (http://localhost:3002)
- ✅ Test kullanıcısı oluşturur (yoksa)

---

## 🛑 Durdur

```bash
./stop-local.sh
```

---

## 📋 Manuel Başlatma

### 1. PostgreSQL Başlat

```bash
brew services start postgresql@15
```

### 2. Backend Başlat

```bash
cd backend
npm start
```

### 3. Frontend Başlat

```bash
cd frontend
npm start
```

---

## 🔐 Test Kullanıcıları

### Normal User
- **Email:** test@local.com
- **Password:** Test123!

### Admin User
- **Email:** admin@budgetapp.com
- **Password:** Admin123!

---

## 🌐 URL'ler

| Servis | URL | Açıklama |
|--------|-----|----------|
| **Frontend** | http://localhost:3002 | React uygulaması |
| **Backend** | http://localhost:5001 | API server |
| **Health Check** | http://localhost:5001/health | Backend sağlık kontrolü |
| **AI Health** | http://localhost:5001/api/ai/health | AI servisleri kontrolü |

---

## 📝 Loglar

### Backend Logları

```bash
tail -f backend.log
```

veya

```bash
cd backend
tail -f logs/combined.log
```

### Frontend Logları

```bash
tail -f frontend.log
```

---

## 🐛 Sorun Giderme

### Port Zaten Kullanımda

```bash
# Port 5001 (Backend)
lsof -ti:5001 | xargs kill -9

# Port 3002 (Frontend)
lsof -ti:3002 | xargs kill -9
```

### PostgreSQL Çalışmıyor

```bash
# Başlat
brew services start postgresql@15

# Durum kontrol
brew services list | grep postgresql

# Manuel başlat
pg_ctl -D /opt/homebrew/var/postgresql@15 start
```

### Database Bulunamadı

```bash
# Database oluştur
createdb budget_app

# Veya psql ile
psql postgres
CREATE DATABASE budget_app;
\q
```

### Dependencies Eksik

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Login Çalışmıyor

```bash
# Backend health check
curl http://localhost:5001/health

# Login test
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@local.com","password":"Test123!"}'

# Frontend .env kontrol
cat frontend/.env
# REACT_APP_API_URL=http://localhost:5001/api olmalı
```

### Test Kullanıcısı Yok

```bash
# Manuel oluştur
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@local.com",
    "password":"Test123!",
    "firstName":"Test",
    "lastName":"User"
  }'
```

---

## 🔄 Yeniden Başlat

```bash
./stop-local.sh
./start-local.sh
```

veya

```bash
# Hızlı restart
kill $(cat .backend.pid .frontend.pid) && ./start-local.sh
```

---

## 📊 Database İşlemleri

### Database'e Bağlan

```bash
psql -d budget_app
```

### Kullanıcıları Listele

```sql
SELECT id, email, first_name, last_name, role FROM users;
```

### Hesapları Listele

```sql
SELECT id, name, type, balance FROM accounts;
```

### Database Sıfırla

```bash
cd backend
npm run db:reset
```

---

## 🧪 API Test

### Health Check

```bash
curl http://localhost:5001/health | jq '.'
```

### Login

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@local.com","password":"Test123!"}' | jq -r '.data.token')

echo $TOKEN
```

### Accounts Listele

```bash
curl -s -X GET http://localhost:5001/api/accounts \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### AI Kategorilendirme

```bash
curl -s -X POST http://localhost:5001/api/ai/categorize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Migros market","amount":100}' | jq '.'
```

---

## 🎨 Geliştirme İpuçları

### Hot Reload

- **Frontend:** Otomatik reload (React)
- **Backend:** Manuel restart gerekli

Backend değişikliklerinden sonra:

```bash
kill $(cat .backend.pid)
cd backend && npm start > ../backend.log 2>&1 &
echo $! > ../.backend.pid
```

### Environment Variables

Backend değişiklikleri için `.env` dosyasını düzenle:

```bash
vim backend/.env
```

Frontend değişiklikleri için:

```bash
vim frontend/.env
```

**Not:** Frontend .env değişikliklerinden sonra frontend'i restart et.

### Database Migrations

```bash
cd backend
npm run migrate
```

---

## 📚 Dokümantasyon

- **API Dokümantasyonu:** Backend çalışırken `/api` endpoint'lerini incele
- **AI Özellikleri:** [AI_FEATURES_LOCAL.md](AI_FEATURES_LOCAL.md)
- **CI/CD:** [CI_CD_BASLANGIC_REHBERI.md](CI_CD_BASLANGIC_REHBERI.md)
- **Production:** [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## ✅ Checklist

Başlamadan önce kontrol et:

- [ ] PostgreSQL kurulu ve çalışıyor
- [ ] Node.js kurulu (v18+)
- [ ] npm kurulu
- [ ] Git kurulu
- [ ] Port 5001 ve 3002 boş

---

## 🎯 Özet

**Başlat:**
```bash
./start-local.sh
```

**Durdur:**
```bash
./stop-local.sh
```

**Test Et:**
- Frontend: http://localhost:3002
- Login: test@local.com / Test123!

**Sorun mu var?**
- Backend log: `tail -f backend.log`
- Frontend log: `tail -f frontend.log`
- Health check: `curl http://localhost:5001/health`

---

**Artık local'de sorunsuz çalışacak! 🎉**

