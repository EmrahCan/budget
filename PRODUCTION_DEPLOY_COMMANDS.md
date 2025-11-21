# Production Deployment - Çalıştırılacak Komutlar

## 🎯 Production'da Şu Komutları Çalıştır

### 1. Git Tag'lerini Fetch Et
```bash
git fetch --all --tags
```

### 2. Mevcut Tag'leri Kontrol Et
```bash
git tag -l
```

### 3. v2.3.0 Tag'ine Geç
```bash
git checkout tags/v2.3.0
```

### 4. Deployment Script'ini Güncelle
```bash
git pull origin main deploy-v2.3.0-to-production.sh
```

Ya da tüm dosyaları güncelle:
```bash
git checkout main
git pull origin main
git checkout tags/v2.3.0
```

### 5. Script'i Çalıştırılabilir Yap
```bash
chmod +x deploy-v2.3.0-to-production.sh
```

### 6. Deployment'ı Başlat
```bash
./deploy-v2.3.0-to-production.sh
```

## 🔧 Alternatif: Manuel Deployment

Eğer script çalışmazsa, manuel olarak:

```bash
# 1. Yedek al
cd ~
cp -r budget budget_backup_$(date +%Y%m%d_%H%M%S)

# 2. Kodu güncelle
cd ~/budget
git fetch --all --tags
git checkout tags/v2.3.0

# 3. Database migration
docker-compose exec -T db psql -U postgres -d budget_app < backend/database/migrations/add_notification_tracking_columns.sql

# 4. Container'ları yeniden başlat
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 5. Servislerin hazır olmasını bekle
sleep 15

# 6. Notification'ları generate et
docker-compose exec backend node scripts/generate-notifications.js

# 7. Kontrol et
docker-compose ps
docker-compose logs --tail=50 backend
```

## ✅ Başarı Kontrolü

```bash
# Container'lar çalışıyor mu?
docker-compose ps

# Backend sağlıklı mı?
docker-compose exec backend curl http://localhost:5001/api/health

# Notification'lar oluştu mu?
docker-compose exec db psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM smart_notifications;"

# Log'larda hata var mı?
docker-compose logs --tail=100 backend | grep -i error
```

## 🐛 Sorun Giderme

### Tag bulunamıyor hatası
```bash
git fetch --all --tags
git tag -l | grep v2.3.0
```

### Path hatası
```bash
pwd  # Şu an neredesin?
cd ~/budget  # Budget dizinine git
```

### Docker container başlamıyor
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Migration hatası
```bash
# Database'e bağlan ve manuel çalıştır
docker-compose exec db psql -U postgres -d budget_app

# İçinde:
\d smart_notifications  -- Tablo var mı kontrol et
```

---

**Hazır mısın?** Yukarıdaki komutları production'da çalıştır!
