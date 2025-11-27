# Deployment Guide v2.4.0

## Tarih: 27 Kasım 2024

## Değişiklikler

### 1. Frontend API URL Düzeltmesi
- Frontend artık doğru backend portuna (5002) bağlanıyor
- AuthContext.js'de debug log'ları eklendi
- Environment variable yönetimi iyileştirildi

### 2. Database Schema
- Son database schema export edildi: `database_schema_latest.sql`
- Full backup alındı: `database_full_backup_latest.sql`

### 3. Docker Konfigürasyonu
- Frontend için standalone docker-compose eklendi: `docker-compose.frontend-only.yml`
- Backend ve DB Docker'da çalışıyor
- Frontend npm ile development modunda çalışıyor

## Mevcut Yapı

### Local Development
- **Frontend**: http://localhost:3003 (npm)
- **Backend**: http://localhost:5002 (Docker)
- **Database**: localhost:5434 (Docker)

### Servisler
```bash
# Backend ve Database başlatma
docker-compose -f docker-compose.local-prod.yml up -d backend database

# Frontend başlatma
cd frontend
npm start
```

## Production Deployment Adımları

### 1. Database Migration

#### Production DB'ye Schema Uygulama
```bash
# Production DB'ye bağlan
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -f database_schema_latest.sql
```

#### Veya Docker ile
```bash
# Production container'a schema yükle
docker exec -i <prod_db_container> psql -U postgres -d budget_app < database_schema_latest.sql
```

### 2. Backend Deployment

#### Environment Variables
Production `.env` dosyasında şunları güncelle:
```env
DB_HOST=<production_db_host>
DB_PORT=5432
DB_NAME=budget_app
DB_USER=<prod_user>
DB_PASSWORD=<prod_password>

JWT_SECRET=<strong_secret_key>
JWT_EXPIRES_IN=7d

PORT=5001
NODE_ENV=production

FRONTEND_URL=<production_frontend_url>

GEMINI_API_KEY=<your_api_key>
```

#### Docker Build ve Deploy
```bash
# Backend image build
cd backend
docker build -t budget-backend:v2.4.0 .

# Container başlat
docker run -d \
  --name budget-backend \
  --env-file .env.production \
  -p 5001:5001 \
  budget-backend:v2.4.0
```

### 3. Frontend Deployment

#### Environment Variables
Production build için `.env.production`:
```env
REACT_APP_API_URL=<production_api_url>
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

#### Build ve Deploy
```bash
cd frontend
npm run build

# Build dosyalarını production server'a kopyala
# Örnek: nginx, Apache, veya static hosting
```

### 4. Nginx Konfigürasyonu (Opsiyonel)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/budget-app/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Verification

### Backend Health Check
```bash
curl http://localhost:5001/api/health
```

### Database Connection Test
```bash
docker exec <db_container> psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM users;"
```

### Frontend Test
1. Browser'da production URL'i aç
2. Login sayfasını test et
3. Network tab'da API isteklerini kontrol et

## Rollback Plan

### Database Rollback
```bash
# Backup'tan geri yükle
psql -h <host> -U <user> -d <db> < database_full_backup_latest.sql
```

### Application Rollback
```bash
# Önceki version'a dön
docker stop budget-backend
docker rm budget-backend
docker run -d --name budget-backend budget-backend:v2.3.0
```

## Notlar

1. **Database Backup**: Her deployment öncesi mutlaka backup al
2. **Environment Variables**: Production'da güvenli değerler kullan
3. **SSL/TLS**: Production'da HTTPS kullan
4. **CORS**: Frontend URL'ini backend CORS ayarlarına ekle
5. **Monitoring**: Log'ları düzenli kontrol et

## Sorun Giderme

### Login Çalışmıyor
- Backend log'larını kontrol et: `docker logs budget-backend`
- Database bağlantısını test et
- CORS ayarlarını kontrol et
- Frontend API URL'ini doğrula

### Database Bağlantı Hatası
- Database container'ın çalıştığını kontrol et
- Connection string'i doğrula
- Network ayarlarını kontrol et

### Frontend Boş Sayfa
- Browser console'u kontrol et
- Build dosyalarının doğru yüklendiğini kontrol et
- API URL'inin doğru olduğunu kontrol et

## İletişim

Sorun olursa:
1. Log dosyalarını kontrol et
2. Docker container durumlarını kontrol et
3. Database bağlantısını test et
