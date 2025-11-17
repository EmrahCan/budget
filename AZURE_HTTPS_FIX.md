# Azure VM'de HTTPS Mixed Content Hatası Düzeltme

## Sorun
- `https://budgetapp.site` HTTPS üzerinden yükleniyor
- Frontend `http://98.71.149.168:5001` HTTP backend'e istek atıyor
- Tarayıcı "Mixed Content" hatası veriyor ve istekleri engelliyor

## Çözüm
Frontend'i relative URL (`/api`) kullanacak şekilde yeniden build et. Nginx zaten `/api` isteklerini backend'e proxy ediyor.

## Azure VM'de Çalıştırılacak Komutlar

```bash
# 1. Frontend dizinine git
cd ~/budget/frontend

# 2. API URL'yi relative path olarak ayarla
export REACT_APP_API_URL="/api"

# 3. Mevcut build'i temizle
rm -rf build

# 4. Yeni build oluştur
npm run build

# 5. Eski production dosyalarını temizle
sudo rm -rf /var/www/budget-app/*

# 6. Yeni build'i production'a kopyala
sudo cp -r build/* /var/www/budget-app/

# 7. Nginx'i restart et
sudo systemctl restart nginx

# 8. Test et
echo "✅ Build tamamlandı!"
echo "🧪 Test: https://budgetapp.site/login"
```

## Alternatif: Tek Komutla

```bash
cd ~/budget/frontend && \
export REACT_APP_API_URL="/api" && \
npm run build && \
sudo rm -rf /var/www/budget-app/* && \
sudo cp -r build/* /var/www/budget-app/ && \
sudo systemctl restart nginx && \
echo "✅ HTTPS fix tamamlandı! Test: https://budgetapp.site"
```

## Doğrulama

1. Tarayıcıda `https://budgetapp.site/login` aç
2. Console'da "Mixed Content" hatası olmamalı
3. Login işlemi çalışmalı
4. Network tab'de API istekleri `https://budgetapp.site/api/...` olmalı

## Nginx Konfigürasyonu (Zaten Mevcut)

Nginx zaten `/api` isteklerini `localhost:5001` backend'e proxy ediyor:

```nginx
location /api {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Cloudflare Ayarları

Cloudflare'de şu ayarların aktif olduğundan emin ol:
- SSL/TLS mode: **Full** (not Full Strict)
- Always Use HTTPS: **ON**
- Proxy status: **Proxied** (orange cloud)
