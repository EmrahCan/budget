# 🚀 Azure Production - Doğru Komutlar

## ✅ Dizin Yapısı
Production'da dizin: `~/budget` (budget-app değil!)

---

## 📋 Adım Adım Komutlar

### 1. Mevcut Durumu Kontrol Et
```bash
# Hangi dizindesiniz?
pwd

# Budget dizinine git
cd ~/budget

# Git durumunu kontrol et
git status

# Docker container'ları kontrol et
docker ps
```

---

### 2. GitHub'dan Son Kodu Çek
```bash
cd ~/budget

# Mevcut değişiklikleri sakla (varsa)
git stash

# Son kodu çek
git fetch origin
git pull origin main

# Script'in geldiğini kontrol et
ls -la apply-production-migrations.sh
```

---

### 3. Migration Script'ini Çalıştır
```bash
cd ~/budget

# Script'i çalıştırılabilir yap
chmod +x apply-production-migrations.sh

# Script'i çalıştır
./apply-production-migrations.sh
```

---

## 🔧 Script Yoksa Manuel Migration

Eğer script çalışmazsa, manuel olarak:

### Adım 1: Backup Al
```bash
mkdir -p ~/db-backups
cd ~/db-backups
docker exec budget_database_prod pg_dump -U postgres budget_app > backup_$(date +%Y%m%d_%H%M%S).sql
gzip backup_*.sql
ls -lh
```

### Adım 2: Migration Dosyalarını Kontrol Et
```bash
cd ~/budget
ls -la backend/database/migrations/add_*.sql
```

### Adım 3: Fixed Payment History Migration
```bash
docker cp ~/budget/backend/database/migrations/add_fixed_payment_history.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_fixed_payment_history.sql
```

### Adım 4: AI Tables Migration
```bash
docker cp ~/budget/backend/database/migrations/add_ai_tables.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_ai_tables.sql
```

### Adım 5: Notification Tracking Migration
```bash
docker cp ~/budget/backend/database/migrations/add_notification_tracking_columns.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_notification_tracking_columns.sql
```

### Adım 6: Sonuçları Kontrol Et
```bash
# Yeni tabloları kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app -c "\dt" | grep -E "(ai_|smart_|fixed_payment_history)"

# Veri sayılarını kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app -c "
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'fixed_payments', COUNT(*) FROM fixed_payments;"
```

### Adım 7: Container'ları Yeniden Başlat
```bash
cd ~/budget

# docker-compose dosyasını kontrol et
ls -la docker-compose*.yml

# Eğer docker-compose.prod.yml varsa:
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend

# Yoksa manuel restart:
docker restart budget_backend_prod
docker restart budget_frontend_prod
```

### Adım 8: Test Et
```bash
# Container durumu
docker ps

# Backend health
curl http://localhost:5001/health

# Frontend
curl -I http://localhost:3000

# Logları kontrol et
docker logs budget_backend_prod --tail 50
docker logs budget_frontend_prod --tail 50
```

---

## 🌐 Web Test
```
https://butce.obiwan.com.tr
```

---

## 🔙 Rollback (Sorun Çıkarsa)
```bash
cd ~/db-backups
ls -lt *.sql.gz | head -1
gunzip budget_db_backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i budget_database_prod psql -U postgres -d budget_app < budget_db_backup_YYYYMMDD_HHMMSS.sql
docker restart budget_backend_prod budget_frontend_prod
```

---

## 📊 Hızlı Kontrol Komutları

```bash
# Dizin yapısını göster
ls -la ~/

# Budget dizinini kontrol et
ls -la ~/budget/

# Docker container'lar
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Database tabloları
docker exec budget_database_prod psql -U postgres -d budget_app -c "\dt"

# Backend logs (son 20 satır)
docker logs budget_backend_prod --tail 20

# Frontend logs (son 20 satır)
docker logs budget_frontend_prod --tail 20
```

---

## ✅ Başarı Kontrolü

Migration başarılı ise:
- ✅ `docker ps` - 3 container çalışıyor (healthy)
- ✅ `curl http://localhost:5001/health` - 200 OK
- ✅ `curl -I http://localhost:3000` - 200 OK
- ✅ Web sitesi açılıyor
- ✅ Login yapılabiliyor

---

## 🎯 Şimdi Yapın

```bash
# 1. Budget dizinine git
cd ~/budget

# 2. Son kodu çek
git pull origin main

# 3. Script'i kontrol et
ls -la apply-production-migrations.sh

# 4. Script'i çalıştır
chmod +x apply-production-migrations.sh
./apply-production-migrations.sh
```

**Hazır! 🚀**
