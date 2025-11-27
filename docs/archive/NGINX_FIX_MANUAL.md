# Nginx Konfigürasyon Düzeltmesi - Manuel Adımlar

## SORUN

Nginx `/api` isteklerini yanlış yönlendiriyor:
- **Şu an:** `/api/health` → `http://localhost:5001/health` (YANLIŞ!)
- **Olmalı:** `/api/health` → `http://localhost:5001/api/health` (DOĞRU!)

Bu yüzden frontend API'ye erişemiyor ve beyaz ekran gösteriyor.

## ÇÖZÜM - MANUEL ADIMLAR

### 1. Azure VM'e Bağlan

```bash
ssh obiwan@98.71.149.168
```

### 2. Mevcut Konfigürasyonu Yedekle

```bash
sudo cp /etc/nginx/sites-enabled/budget-app /etc/nginx/sites-enabled/budget-app.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. Nginx Konfigürasyonunu Düzenle

```bash
sudo nano /etc/nginx/sites-enabled/budget-app
```

### 4. Aşağıdaki İçeriği Yapıştır

**ÖNEMLİ:** Tüm içeriği sil ve aşağıdakini yapıştır:

```nginx
# Budget App Nginx Configuration
server {
    listen 80;
    listen [::]:80;
    server_name 98.71.149.168 budgetapp.site;

    # Logging
    access_log /var/log/nginx/budget-app-access.log;
    error_log /var/log/nginx/budget-app-error.log;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API - DÜZELTME: /api prefix'i korunuyor
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }

    # Frontend - React App (MUST BE LAST)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. Kaydet ve Çık

- `Ctrl+O` (kaydet)
- `Enter` (onayla)
- `Ctrl+X` (çık)

### 6. Konfigürasyonu Test Et

```bash
sudo nginx -t
```

**Beklenen çıktı:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 7. Nginx'i Yeniden Yükle

```bash
sudo systemctl reload nginx
```

### 8. Test Et

```bash
# API health check
curl http://localhost/api/health

# Beklenen çıktı:
# {"status":"OK","message":"Budget App Backend is running",...}
```

### 9. Tarayıcıda Test Et

1. Tarayıcıyı aç: `http://98.71.149.168`
2. Hard Refresh: `Ctrl+Shift+R` (Windows) veya `Cmd+Shift+R` (Mac)
3. Login sayfası görünmeli!

## DEĞİŞİKLİK ÖZETİ

### Eski (Yanlış):
```nginx
location /api {
    proxy_pass http://localhost:5001;
    ...
}
```

Bu şu anlama gelir:
- `/api/health` → `http://localhost:5001/health` ❌
- `/api/auth/login` → `http://localhost:5001/auth/login` ❌

### Yeni (Doğru):
```nginx
location /api/ {
    proxy_pass http://localhost:5001/api/;
    ...
}
```

Bu şu anlama gelir:
- `/api/health` → `http://localhost:5001/api/health` ✅
- `/api/auth/login` → `http://localhost:5001/api/auth/login` ✅

## SORUN DEVAM EDİYORSA

### Console Hatalarını Kontrol Et

1. `F12` tuşuna bas
2. Console sekmesine git
3. Hataları kopyala ve bana gönder

### Backend Loglarını Kontrol Et

```bash
docker logs --tail 50 budget_backend_prod
```

### Frontend Loglarını Kontrol Et

```bash
docker logs --tail 50 budget_frontend_prod
```

## ROLLBACK (Geri Alma)

Eğer bir şeyler ters giderse:

```bash
# En son yedeği bul
ls -lt /etc/nginx/sites-enabled/budget-app.backup.*

# Geri yükle (en son backup dosyasını kullan)
sudo cp /etc/nginx/sites-enabled/budget-app.backup.XXXXXXXX /etc/nginx/sites-enabled/budget-app

# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

---

**Tarih:** 23 Kasım 2025  
**Sorun:** Nginx `/api` proxy_pass yanlış yapılandırılmış  
**Çözüm:** `proxy_pass http://localhost:5001/api/` olarak değiştirildi
