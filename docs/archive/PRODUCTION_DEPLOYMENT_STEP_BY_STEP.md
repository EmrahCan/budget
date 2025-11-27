# Production Deployment - Adım Adım Rehber

## 🎯 Hedef
Local'deki v2.3.0 değişikliklerini production'a güvenli şekilde deploy etmek.

## 📋 Deployment Süreci

### Adım 1: Production Sunucusuna Bağlan
```bash
ssh obiwan@98.71.149.168
```

### Adım 2: Proje Dizinine Git
```bash
cd /home/azureuser/budget
```

### Adım 3: Mevcut Durumu Yedekle
```bash
# Kod yedeği (otomatik olacak ama kontrol için)
ls -la

# Database yedeği (ÖNEMLİ!)
docker-compose exec db pg_dump -U postgres budget_app > backup_before_v2.3.0_$(date +%Y%m%d_%H%M%S).sql
```

### Adım 4: Yeni Kodu Çek (GitHub'dan)
```bash
# Tüm tag'leri getir
git fetch --all --tags

# v2.3.0 tag'ine geç
git checkout tags/v2.3.0

# Hangi versiyonda olduğunu kontrol et
git describe --tags
```

**Ne olacak?**
- GitHub'dan v2.3.0 kodu indirilecek
- Tüm yeni dosyalar gelecek:
  - Backend değişiklikleri (notification routes, services)
  - Frontend değişiklikleri (notification bell, widgets)
  - Migration dosyaları
  - Deployment scriptleri

### Adım 5: Database Migration'ı Çalıştır
```bash
# Migration dosyasını çalıştır
docker-compose exec -T db psql -U postgres -d budget_app < backend/database/migrations/add_notification_tracking_columns.sql

# Kontrol et
docker-compose exec db psql -U postgres -d budget_app -c "\d smart_notifications"
```

**Ne olacak?**
- `smart_notifications` tablosu oluşturulacak
- `related_entity_id` ve `related_entity_type` kolonları eklenecek
- Index'ler oluşturulacak

### Adım 6: Docker Container'ları Yeniden Build Et
```bash
# Container'ları durdur
docker-compose down

# Yeni kod ile build et (cache kullanmadan)
docker-compose build --no-cache

# Başlat
docker-compose up -d
```

**Ne olacak?**
- Backend container yeni kod ile build edilecek
- Frontend container yeni kod ile build edilecek
- Tüm yeni özellikler aktif olacak

### Adım 7: Servislerin Hazır Olmasını Bekle
```bash
# 10-15 saniye bekle
sleep 15

# Backend health check
docker-compose exec backend curl http://localhost:5001/api/health

# Container durumunu kontrol et
docker-compose ps
```

### Adım 8: Notification'ları Generate Et
```bash
# İlk notification'ları oluştur
docker-compose exec backend node scripts/generate-notifications.js
```

**Ne olacak?**
- Mevcut ödemeler için notification'lar oluşturulacak
- Gecikmiş ödemeler tespit edilecek
- Yaklaşan ödemeler için uyarılar oluşturulacak

### Adım 9: Doğrulama ve Test
```bash
# Log'ları kontrol et
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend

# Database'i kontrol et
docker-compose exec db psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM smart_notifications;"

# Container'ların sağlıklı olduğunu kontrol et
docker-compose ps
```

### Adım 10: Web Üzerinden Test Et
1. Tarayıcıda production URL'i aç
2. Login ol
3. Kontrol et:
   - ✅ Header'da notification bell görünüyor mu?
   - ✅ Badge counter var mı?
   - ✅ Dashboard'da widget'lar görünüyor mu?
   - ✅ Admin panel'de user delete butonu var mı?
   - ✅ Payment calendar açılıyor mu?

## 🎬 Tek Komutla Otomatik Deployment

Yukarıdaki tüm adımları otomatik yapan script:

```bash
cd /home/azureuser/budget
chmod +x deploy-v2.3.0-to-production.sh
./deploy-v2.3.0-to-production.sh
```

Bu script:
1. ✅ Yedek alır
2. ✅ Kodu günceller
3. ✅ Migration'ı çalıştırır
4. ✅ Container'ları rebuild eder
5. ✅ Notification'ları generate eder
6. ✅ Health check yapar
7. ✅ Log'ları gösterir

## 🔄 Rollback (Sorun Olursa)

Eğer bir sorun çıkarsa, geri dönmek için:

```bash
# Container'ları durdur
docker-compose down

# Önceki versiyona dön
git checkout tags/v2.2.0  # veya önceki stable tag

# Database'i geri yükle (gerekirse)
docker-compose exec -T db psql -U postgres -d budget_app < backup_before_v2.3.0_YYYYMMDD_HHMMSS.sql

# Container'ları başlat
docker-compose up -d
```

## 📊 Deployment Akış Şeması

```
Local (Bilgisayarın)
    ↓
GitHub (v2.3.0 tag)
    ↓
Production Server (SSH ile bağlan)
    ↓
git checkout tags/v2.3.0 (Kodu çek)
    ↓
Database Migration (Şemayı güncelle)
    ↓
Docker Build (Container'ları güncelle)
    ↓
Docker Up (Servisleri başlat)
    ↓
Generate Notifications (İlk veriyi oluştur)
    ↓
✅ HAZIR!
```

## 🔑 Önemli Noktalar

1. **GitHub Merkezi Nokta**: Local'den production'a direkt kod gönderme yok. Her şey GitHub üzerinden.

2. **Database Migration**: Kod değişikliği + database değişikliği birlikte gidiyor.

3. **Docker Build**: Yeni kod container'lara dahil edilmek için rebuild gerekiyor.

4. **Zero Downtime Yok**: Container'lar yeniden başlarken kısa bir kesinti olacak (1-2 dakika).

5. **Yedekleme Kritik**: Her deployment öncesi database yedeği alınmalı.

## ✅ Başarı Kriterleri

Deployment başarılı sayılır:
- ✅ Tüm container'lar "Up" durumunda
- ✅ Backend health check "ok" dönüyor
- ✅ Frontend açılıyor
- ✅ Notification bell görünüyor
- ✅ Dashboard widget'ları çalışıyor
- ✅ Log'larda hata yok

---

**Hazır mısın?** Deployment'ı başlatmak için yukarıdaki adımları takip et!
