# v2.3.0 Production Deployment - Quick Guide

## 📋 Özet

v2.3.0 sürümü şu değişiklikleri içeriyor:
- ✅ Smart notification system (bildirim zili)
- ✅ Dashboard notification widget'ları
- ✅ User delete özelliği (admin panel)
- ✅ Payment calendar düzeltmeleri
- ✅ Database migration (notification tracking kolonları)

## 🚀 Deployment Adımları

### 1. Production'a Bağlan
```bash
ssh obiwan@98.71.149.168
```

### 2. Proje Dizinine Git
```bash
cd /home/azureuser/budget
```

### 3. Son Kodu Çek
```bash
git fetch --all --tags
git checkout tags/v2.3.0
```

### 4. Database Migration'ı Çalıştır
```bash
# Migration dosyasını çalıştır
docker-compose exec -T db psql -U postgres -d budget_app < backend/database/migrations/add_notification_tracking_columns.sql

# Doğrula
docker-compose exec db psql -U postgres -d budget_app -c "\d smart_notifications"
```

### 5. Container'ları Yeniden Başlat
```bash
# Container'ları durdur
docker-compose down

# Yeniden build et
docker-compose build --no-cache

# Başlat
docker-compose up -d
```

### 6. Servislerin Hazır Olmasını Bekle
```bash
# 10-15 saniye bekle
sleep 15

# Backend health check
docker-compose exec backend curl http://localhost:5001/api/health
```

### 7. Notification'ları Generate Et
```bash
docker-compose exec backend node scripts/generate-notifications.js
```

### 8. Doğrulama
```bash
# Container durumunu kontrol et
docker-compose ps

# Log'ları kontrol et
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend

# Database'i kontrol et
docker-compose exec db psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM smart_notifications;"
```

## ✅ Test Checklist

Production'da şunları test et:
- [ ] Notification bell header'da görünüyor mu?
- [ ] Badge counter doğru sayıyı gösteriyor mu?
- [ ] Dashboard'da "Gecikmiş Ödemeler" widget'ı var mı?
- [ ] Dashboard'da "Yaklaşan Ödemeler" widget'ı var mı?
- [ ] Admin panel'de user delete butonu çalışıyor mu?
- [ ] Payment calendar sayfası açılıyor mu?
- [ ] Log'larda hata var mı?

## 🔄 Rollback (Gerekirse)

Eğer bir sorun olursa:

```bash
# Container'ları durdur
docker-compose down

# Önceki versiyona dön
git checkout tags/v2.2.0  # veya önceki stable tag

# Yeniden başlat
docker-compose up -d
```

## 📊 Yararlı Komutlar

```bash
# Tüm log'ları izle
docker-compose logs -f

# Sadece backend log'ları
docker-compose logs -f backend

# Container durumu
docker-compose ps

# Database'e bağlan
docker-compose exec db psql -U postgres -d budget_app

# Backend'e shell ile bağlan
docker-compose exec backend sh
```

## 🎯 Deployment Script (Otomatik)

Alternatif olarak, hazır script'i kullanabilirsin:

```bash
cd /home/azureuser/budget
chmod +x deploy-v2.3.0-to-production.sh
./deploy-v2.3.0-to-production.sh
```

Bu script tüm adımları otomatik yapacak.

## 📞 Sorun Giderme

### Notification'lar görünmüyor
```bash
# Notification'ları yeniden generate et
docker-compose exec backend node scripts/generate-notifications.js

# Database'i kontrol et
docker-compose exec db psql -U postgres -d budget_app -c "SELECT * FROM smart_notifications LIMIT 5;"
```

### Container başlamıyor
```bash
# Log'ları kontrol et
docker-compose logs backend

# Temiz başlat
docker-compose down
docker-compose up -d
```

### Database migration hatası
```bash
# Migration'ı manuel çalıştır
docker-compose exec -T db psql -U postgres -d budget_app << 'EOF'
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
EOF
```

---

**Version:** v2.3.0  
**Date:** November 21, 2024  
**Environment:** Docker Compose  
**Server:** obiwan@98.71.149.168
