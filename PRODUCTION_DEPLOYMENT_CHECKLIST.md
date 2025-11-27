# Production Deployment Checklist

## ✅ Hazırlık Tamamlandı

### 1. Kod Temizliği
- [x] 136 MD dosyası docs/archive/ klasörüne taşındı
- [x] 118 script dosyası scripts/archive/ klasörüne taşındı
- [x] Yeni organize script yapısı oluşturuldu
- [x] README.md ve SETUP.md güncellendi
- [x] GitHub'a push edildi

### 2. Database Backup
- [x] Schema backup alındı: `backups/schema_20251127_231639.sql`
- [x] Full backup alındı: `backups/full_backup_20251127_231639.sql`

### 3. Mevcut Yapı
- [x] Frontend: npm (localhost:3003)
- [x] Backend: Docker (localhost:5002)
- [x] Database: Docker (localhost:5434)

## 🚀 Production Deployment Adımları

### Adım 1: Production Server Hazırlığı

#### 1.1 Server Gereksinimleri
- [ ] Ubuntu 20.04+ veya CentOS 8+
- [ ] Docker ve Docker Compose kurulu
- [ ] Node.js 18+ kurulu
- [ ] Nginx kurulu (opsiyonel, reverse proxy için)
- [ ] SSL sertifikası hazır (Let's Encrypt önerilir)

#### 1.2 Repository'yi Clone Et
```bash
git clone https://github.com/EmrahCan/budget.git
cd budget
```

### Adım 2: Database Setup

#### 2.1 Production Database Oluştur
```bash
# PostgreSQL container başlat
docker run -d \
  --name budget-db-prod \
  -e POSTGRES_DB=budget_app \
  -e POSTGRES_USER=budget_user \
  -e POSTGRES_PASSWORD=<GÜÇLÜ_ŞİFRE> \
  -v budget_db_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2.2 Schema'yı Yükle
```bash
# Local'den schema'yı kopyala
scp backups/schema_20251127_231639.sql user@production-server:/tmp/

# Production server'da
docker exec -i budget-db-prod psql -U budget_user -d budget_app < /tmp/schema_20251127_231639.sql
```

#### 2.3 İlk Admin Kullanıcısını Oluştur
```bash
docker exec -it budget-db-prod psql -U budget_user -d budget_app

-- SQL içinde
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@yourdomain.com',
  '$2a$10$...',  -- bcrypt hash (backend script ile oluştur)
  'Admin',
  'User',
  'admin',
  true
);
```

### Adım 3: Backend Deployment

#### 3.1 Environment Variables
```bash
cd backend
nano .env.production
```

`.env.production` içeriği:
```env
# Database
DB_HOST=budget-db-prod
DB_PORT=5432
DB_NAME=budget_app
DB_USER=budget_user
DB_PASSWORD=<GÜÇLÜ_ŞİFRE>

# JWT
JWT_SECRET=<GÜÇLÜ_SECRET_KEY_EN_AZ_32_KARAKTER>
JWT_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=production

# Frontend
FRONTEND_URL=https://yourdomain.com

# AI (Opsiyonel)
GEMINI_API_KEY=<YOUR_API_KEY>
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true

# CORS
CORS_ORIGIN=https://yourdomain.com
```

#### 3.2 Backend Container'ı Başlat
```bash
docker build -t budget-backend:prod .

docker run -d \
  --name budget-backend-prod \
  --env-file .env.production \
  --link budget-db-prod:database \
  -p 5001:5001 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  budget-backend:prod
```

#### 3.3 Backend Health Check
```bash
curl http://localhost:5001/api/auth/login
# Beklenen: {"success":false,"message":"Geçersiz email veya şifre"}
```

### Adım 4: Frontend Deployment

#### 4.1 Environment Variables
```bash
cd ../frontend
nano .env.production
```

`.env.production` içeriği:
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

#### 4.2 Production Build
```bash
npm install
npm run build
```

#### 4.3 Build Dosyalarını Deploy Et

**Seçenek A: Nginx ile**
```bash
# Build dosyalarını nginx dizinine kopyala
sudo cp -r build/* /var/www/budget-app/

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/budget-app
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/budget-app;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Nginx'i aktifleştir
sudo ln -s /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Seçenek B: Docker ile**
```bash
# Frontend için Dockerfile
docker build -t budget-frontend:prod -f Dockerfile .

docker run -d \
  --name budget-frontend-prod \
  -p 3000:80 \
  --restart unless-stopped \
  budget-frontend:prod
```

### Adım 5: SSL Sertifikası (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Adım 6: Monitoring ve Logging

#### 6.1 Log Rotation
```bash
sudo nano /etc/logrotate.d/budget-app
```

```
/var/www/budget-app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

#### 6.2 Docker Container Monitoring
```bash
# Container durumunu kontrol et
docker ps

# Log'ları izle
docker logs -f budget-backend-prod
docker logs -f budget-db-prod
```

### Adım 7: Backup Stratejisi

#### 7.1 Otomatik Database Backup
```bash
sudo nano /etc/cron.daily/budget-db-backup
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/budget-app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec budget-db-prod pg_dump -U budget_user budget_app > "$BACKUP_DIR/backup_$DATE.sql"

# 30 günden eski backup'ları sil
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

```bash
sudo chmod +x /etc/cron.daily/budget-db-backup
```

### Adım 8: Güvenlik

#### 8.1 Firewall Kuralları
```bash
# UFW ile
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

#### 8.2 Docker Security
```bash
# Container'ları non-root user ile çalıştır
# .env dosyalarını güvenli tut (chmod 600)
chmod 600 backend/.env.production
```

### Adım 9: Final Checks

- [ ] Frontend erişilebilir: https://yourdomain.com
- [ ] Backend API çalışıyor: https://yourdomain.com/api
- [ ] Login çalışıyor
- [ ] Database bağlantısı OK
- [ ] SSL sertifikası geçerli
- [ ] Log'lar yazılıyor
- [ ] Backup çalışıyor
- [ ] Monitoring aktif

## 🔄 Rollback Planı

### Hızlı Rollback
```bash
# Backend'i önceki versiyona dön
docker stop budget-backend-prod
docker rm budget-backend-prod
docker run -d --name budget-backend-prod budget-backend:v2.3.0

# Database'i restore et
docker exec -i budget-db-prod psql -U budget_user -d budget_app < /backups/backup_YYYYMMDD.sql
```

## 📞 Destek

Deployment sırasında sorun yaşarsanız:

1. Log dosyalarını kontrol edin
2. Docker container durumlarını kontrol edin
3. Database bağlantısını test edin
4. GitHub'da issue açın

## 📝 Notlar

- **Güvenlik**: Production'da mutlaka güçlü şifreler kullanın
- **Backup**: Günlük otomatik backup alın
- **Monitoring**: Log'ları düzenli kontrol edin
- **SSL**: HTTPS kullanımı zorunlu
- **Updates**: Düzenli güvenlik güncellemeleri yapın

---

**Version**: 2.4.0  
**Deployment Date**: 27 Kasım 2024  
**Status**: Ready for Production
