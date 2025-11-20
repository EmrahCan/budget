# 🚀 Local Development Guide

Bu guide local'de geliştirme yapmak için gerekli tüm adımları içerir.

## 📋 Gereksinimler

- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL (opsiyonel, Docker kullanılabilir)

## 🏁 İlk Kurulum

### 1. Repository'yi Clone Et

```bash
git clone https://github.com/EmrahCan/budget.git
cd budget
```

### 2. Environment Dosyalarını Oluştur

#### Backend

```bash
cd backend
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app_dev
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_local_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# AI Configuration (opsiyonel)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true
```

#### Frontend

```bash
cd ../frontend
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### 3. Dependencies Kur

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 4. Database Kur

#### Seçenek A: Docker ile (Önerilen)

```bash
# Root dizinde
docker-compose -f docker-compose.dev.yml up -d database
```

#### Seçenek B: Local PostgreSQL

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Database oluştur
CREATE DATABASE budget_app_dev;
\q
```

### 5. Database Schema Oluştur

```bash
cd backend
psql -U postgres -d budget_app_dev -f database/init/01-schema.sql
psql -U postgres -d budget_app_dev -f database/init/02-seed.sql
```

### 6. Test Kullanıcısı Oluştur

```bash
cd backend
node scripts/create-admin-user.js
```

## 🎯 Development Workflow

### Günlük Geliştirme

#### 1. Backend'i Başlat

```bash
cd backend
npm run dev
```

Backend şurada çalışacak: http://localhost:5001

#### 2. Frontend'i Başlat

```bash
cd frontend
npm start
```

Frontend şurada çalışacak: http://localhost:3000

#### 3. Değişiklik Yap

- Backend: `backend/` dizininde değişiklik yap
- Frontend: `frontend/src/` dizininde değişiklik yap
- Hot reload otomatik çalışır

#### 4. Test Et

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd frontend
npm test
```

#### 5. Commit ve Push

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

## 🐳 Docker ile Development (Alternatif)

Tüm servisleri Docker ile çalıştırmak isterseniz:

```bash
# Tüm servisleri başlat
docker-compose -f docker-compose.dev.yml up

# Sadece database
docker-compose -f docker-compose.dev.yml up database

# Arka planda çalıştır
docker-compose -f docker-compose.dev.yml up -d

# Logları izle
docker-compose -f docker-compose.dev.yml logs -f

# Durdur
docker-compose -f docker-compose.dev.yml down
```

## 🔧 Yararlı Komutlar

### Database

```bash
# Database'e bağlan
docker exec -it budget_database_dev psql -U postgres -d budget_app_dev

# Database backup
docker exec budget_database_dev pg_dump -U postgres budget_app_dev > backup.sql

# Database restore
cat backup.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev

# Database reset
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d database
```

### Backend

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm start

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Frontend

```bash
# Development mode
npm start

# Production build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Linting
npm run lint

# Format code
npm run format
```

## 🐛 Debugging

### Backend Debugging (VS Code)

`.vscode/launch.json` oluştur:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

### Frontend Debugging

Chrome DevTools kullan:
1. F12 ile DevTools'u aç
2. Sources tab'ına git
3. Breakpoint koy
4. Debug et

## 📊 Database Yönetimi

### Migration Oluştur

```bash
cd backend/database/migrations
# Yeni migration dosyası oluştur
touch $(date +%Y%m%d%H%M%S)_your_migration_name.sql
```

### Migration Çalıştır

```bash
cd backend
node scripts/run-migrations.js
```

### Seed Data Ekle

```bash
psql -U postgres -d budget_app_dev -f backend/database/seeds/your_seed.sql
```

## 🧪 Testing

### Unit Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Integration Tests

```bash
cd backend
npm run test:integration
```

### E2E Tests

```bash
cd frontend
npm run test:e2e
```

## 🔍 Troubleshooting

### Port zaten kullanımda

```bash
# Port 5001'i kullanan process'i bul
lsof -i :5001

# Process'i öldür
kill -9 <PID>
```

### Database bağlantı hatası

```bash
# Database çalışıyor mu?
docker ps | grep database

# Database loglarını kontrol et
docker logs budget_database_dev

# Database'i yeniden başlat
docker-compose -f docker-compose.dev.yml restart database
```

### Node modules hatası

```bash
# node_modules'ı sil ve yeniden kur
rm -rf node_modules package-lock.json
npm install
```

### Frontend build hatası

```bash
# Cache'i temizle
rm -rf node_modules/.cache
npm start
```

## 📚 Kod Standartları

### Commit Messages

```
feat: Yeni özellik
fix: Bug düzeltme
docs: Dokümantasyon
style: Kod formatı
refactor: Kod iyileştirme
test: Test ekleme/düzeltme
chore: Diğer değişiklikler
```

### Branch Strategy

```
main          → Production
develop       → Development
feature/*     → Yeni özellikler
bugfix/*      → Bug düzeltmeleri
hotfix/*      → Acil düzeltmeler
```

### Code Review

1. Pull request oluştur
2. Testlerin geçtiğinden emin ol
3. Code review bekle
4. Merge et

## 🚀 Production'a Geçiş

Local'de test ettikten sonra:

```bash
# 1. Commit ve push
git add .
git commit -m "feat: your feature"
git push origin main

# 2. VM'ye SSH ile bağlan
ssh obiwan@98.71.149.168

# 3. Deployment script'ini çalıştır
cd ~/budget
./deploy-to-production.sh
```

## 💡 İpuçları

1. **Hot Reload:** Backend ve frontend otomatik reload olur
2. **Environment Variables:** `.env` dosyasını değiştirince restart gerekir
3. **Database Changes:** Schema değişikliklerinde migration kullan
4. **Git:** Sık sık commit yap, küçük değişiklikler yap
5. **Testing:** Her özellik için test yaz
6. **Documentation:** Kod içi yorum ve README güncelle

## 🆘 Yardım

Sorun yaşarsan:
1. Bu guide'ı kontrol et
2. Logs'ları incele
3. GitHub Issues'a bak
4. Yeni issue aç

---

**Happy Coding! 🎉**
