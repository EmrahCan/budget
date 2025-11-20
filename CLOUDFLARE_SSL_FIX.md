# Cloudflare SSL Sorunu Çözümü

## Sorun
- `https://budgetapp.site` → ERR_CONNECTION_REFUSED
- `http://98.71.149.168` → Çalışıyor ama login olmuyor

## Neden
Cloudflare HTTPS ile VM'ye bağlanmaya çalışıyor ama VM'de SSL sertifikası yok.

## Çözüm Seçenekleri

### Seçenek 1: Cloudflare Flexible SSL (En Hızlı) ⚡

1. Cloudflare Dashboard'a gidin: https://dash.cloudflare.com
2. `budgetapp.site` domain'ini seçin
3. Sol menüden **SSL/TLS** → **Overview**
4. **SSL/TLS encryption mode**'u **"Flexible"** yapın
5. 5 dakika bekleyin (propagation için)

**Avantajları:**
- Anında çalışır
- Konfigürasyon gerektirmez

**Dezavantajları:**
- Cloudflare ile VM arasında HTTP (şifrelenmemiş)

---

### Seçenek 2: Cloudflare Origin CA Sertifikası (Önerilen) 🔐

1. Cloudflare Dashboard → **SSL/TLS** → **Origin Server**
2. **Create Certificate** butonuna tıklayın
3. Ayarlar:
   - **Hostnames:** `budgetapp.site, *.budgetapp.site`
   - **Certificate Validity:** 15 years
4. **Create** butonuna tıklayın
5. **Origin Certificate** ve **Private Key**'i kopyalayın

#### VM'de Kurulum:

```bash
# SSH ile VM'ye bağlan
ssh obiwan@98.71.149.168

# Sertifika dizini oluştur
sudo mkdir -p /etc/ssl/cloudflare

# Origin Certificate'i kaydet
sudo nano /etc/ssl/cloudflare/budgetapp.site.pem
# (Cloudflare'den kopyaladığınız Origin Certificate'i yapıştırın)

# Private Key'i kaydet
sudo nano /etc/ssl/cloudflare/budgetapp.site.key
# (Cloudflare'den kopyaladığınız Private Key'i yapıştırın)

# İzinleri ayarla
sudo chmod 600 /etc/ssl/cloudflare/budgetapp.site.key
sudo chmod 644 /etc/ssl/cloudflare/budgetapp.site.pem

# Nginx konfigürasyonunu güncelle
sudo nano /etc/nginx/sites-available/budgetapp.site
```

#### Nginx Konfigürasyonu:

```nginx
# HTTP - HTTPS'e yönlendir
server {
    listen 80;
    listen [::]:80;
    server_name budgetapp.site www.budgetapp.site;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name budgetapp.site www.budgetapp.site;

    # Cloudflare Origin CA Sertifikaları
    ssl_certificate /etc/ssl/cloudflare/budgetapp.site.pem;
    ssl_certificate_key /etc/ssl/cloudflare/budgetapp.site.key;

    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
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
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:5001/health;
    }
}
```

#### Nginx'i Test ve Reload:

```bash
# Konfigürasyonu test et
sudo nginx -t

# Nginx'i reload et
sudo systemctl reload nginx
```

#### Cloudflare'de SSL/TLS Modunu Ayarla:

1. Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. **SSL/TLS encryption mode**'u **"Full (strict)"** yapın

---

### Seçenek 3: Let's Encrypt (Ücretsiz SSL) 🆓

**Not:** Cloudflare proxy'si aktifken Let's Encrypt çalışmaz. Önce DNS'i "DNS Only" (gri bulut) yapmanız gerekir.

```bash
# SSH ile VM'ye bağlan
ssh obiwan@98.71.149.168

# Certbot ile sertifika al
sudo certbot --nginx -d budgetapp.site -d www.budgetapp.site

# Otomatik yenileme için timer'ı kontrol et
sudo systemctl status certbot.timer
```

---

## Hızlı Test

Hangi seçeneği seçerseniz seçin, sonrasında test edin:

```bash
# HTTPS test
curl -I https://budgetapp.site

# API test
curl -X POST https://budgetapp.site/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## Önerilen Çözüm

**Seçenek 2 (Cloudflare Origin CA)** en güvenli ve pratik çözümdür:
- ✅ Cloudflare ile VM arasında şifreli bağlantı
- ✅ Ücretsiz
- ✅ 15 yıl geçerli
- ✅ Otomatik yenileme gerektirmez
- ✅ Cloudflare proxy ile uyumlu

---

## Sorun Devam Ederse

1. Cloudflare cache'ini temizleyin: **Caching** → **Purge Everything**
2. Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)
3. Gizli pencerede test edin
4. DNS propagation'ı kontrol edin: https://dnschecker.org

---

**Yardım için:** Bu dosyayı okuyun ve adımları takip edin.
