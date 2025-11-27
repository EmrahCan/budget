# 🚀 Production Migration - Hızlı Başlangıç

## Tek Komutla Migration

### Azure VM'e Bağlan
```bash
ssh obiwan@98.71.149.168
```

### Otomatik Migration Script'ini Çalıştır
```bash
# Script'i indir (eğer yoksa)
cd ~/budget-app
git pull origin main

# Script'i çalıştırılabilir yap
chmod +x apply-production-migrations.sh

# Migration'ı başlat
./apply-production-migrations.sh
```

Script otomatik olarak:
1. ✅ Backup alır
2. ✅ GitHub'dan son kodu çeker
3. ✅ Migration'ları uygular
4. ✅ Veri kaybı kontrolü yapar
5. ✅ Container'ları yeniden başlatır
6. ✅ Health check yapar

---

## Manuel Adımlar (Script Kullanmadan)

### 1. Backup Al
```bash
mkdir -p ~/db-backups
cd ~/db-backups
docker exec budget_database_prod pg_dump -U postgres budget_app > backup_$(date +%Y%m%d_%H%M%S).sql
gzip backup_*.sql
```

### 2. Kodu Güncelle
```bash
cd ~/budget-app
git pull origin main
```

### 3. Migration'ları Uygula
```bash
# Fixed Payment History
docker cp ~/budget-app/backend/database/migrations/add_fixed_payment_history.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_fixed_payment_history.sql

# AI Tables
docker cp ~/budget-app/backend/database/migrations/add_ai_tables.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_ai_tables.sql

# Notification Tracking
docker cp ~/budget-app/backend/database/migrations/add_notification_tracking_columns.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_notification_tracking_columns.sql
```

### 4. Container'ları Yeniden Başlat
```bash
cd ~/budget-app
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### 5. Test Et
```bash
# Container durumu
docker ps

# Backend health
curl http://localhost:5001/health

# Frontend
curl -I http://localhost:3000

# Web tarayıcıdan
# https://butce.obiwan.com.tr
```

---

## Rollback (Sorun Çıkarsa)

```bash
cd ~/db-backups
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i budget_database_prod psql -U postgres -d budget_app < backup_YYYYMMDD_HHMMSS.sql
cd ~/budget-app
docker-compose -f docker-compose.prod.yml restart
```

---

## Kontrol Komutları

### Database Kontrol
```bash
# Tabloları listele
docker exec budget_database_prod psql -U postgres -d budget_app -c "\dt"

# Yeni tabloları kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'fixed_payment_history',
  'ai_interactions',
  'smart_notifications'
);"

# Veri sayılarını kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app -c "
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'fixed_payments', COUNT(*) FROM fixed_payments;"
```

### Log Kontrol
```bash
# Backend logs
docker logs budget_backend_prod --tail 50

# Frontend logs
docker logs budget_frontend_prod --tail 50

# Database logs
docker logs budget_database_prod --tail 50
```

---

## Tahmini Süre
- **Otomatik Script:** 5-10 dakika
- **Manuel Adımlar:** 10-15 dakika

---

## ⚠️ Önemli Notlar

1. **Backup mutlaka alın!** Script otomatik alır ama manuel yapıyorsanız atlama
2. **Veri kaybı olmaz** - Sadece yeni tablolar ekleniyor
3. **Downtime minimal** - Sadece container restart sırasında (~30 saniye)
4. **Rollback hazır** - Backup her zaman elinizin altında

---

## Sorun Giderme

### Backend başlamıyor
```bash
docker logs budget_backend_prod --tail 100
docker restart budget_backend_prod
```

### Database bağlantı hatası
```bash
docker exec budget_database_prod psql -U postgres -d budget_app -c "SELECT 1;"
```

### Migration hatası
```bash
# Migration'ı tekrar dene
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_ai_tables.sql
```

---

## İletişim

Sorun çıkarsa:
1. Logları kontrol edin
2. Rollback yapın
3. Backup'tan geri yükleyin

**Hazır mısınız? Başlayalım! 🚀**
