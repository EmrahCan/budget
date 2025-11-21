# 🔄 Yeni Session İçin: Production Migration Devam

## 📍 Şu An Neredeyiz?

Production Azure VM'de database migration yapıyoruz. Şu adımları tamamladık:

### ✅ Tamamlanan Adımlar
1. ✅ Database adını bulduk: `budget_app_prod`
2. ✅ Dizin adını düzelttik: `~/budget` (budget-app değil)
3. ✅ Backup başarıyla alındı: `~/db-backups/budget_db_backup_20251121_172423.sql.gz`
4. ✅ Migration dosyaları GitHub'a eklendi:
   - `add_ai_tables.sql` ✅
   - `rollback_ai_tables.sql` ✅
   - `add_fixed_payment_history.sql` ✅
   - `add_notification_tracking_columns.sql` ✅

### 🔄 Şimdi Yapılacak

Azure VM'de şu komutu çalıştırın:

```bash
cd ~/budget && git pull origin main && ./apply-production-migrations.sh
```

Bu komut:
- Son migration dosyalarını çekecek
- Backup alacak (zaten alındı ama yeni bir tane daha alır)
- 3 migration'ı uygulayacak
- Container'ları yeniden başlatacak
- Test edecek

---

## 📋 Detaylı Bilgiler

### Production Ortam Bilgileri
- **Server:** Azure VM - `ssh obiwan@98.71.149.168`
- **Dizin:** `~/budget`
- **Database:** `budget_app_prod`
- **Container'lar:**
  - `budget_database_prod` (PostgreSQL)
  - `budget_backend_prod` (Node.js)
  - `budget_frontend_prod` (React)

### Migration Dosyaları
1. **add_fixed_payment_history.sql** - Sabit ödeme geçmişi tablosu
2. **add_ai_tables.sql** - 9 AI tablosu (ai_interactions, user_ai_preferences, vb.)
3. **add_notification_tracking_columns.sql** - smart_notifications tablosuna 2 kolon

### Backup Konumu
```
~/db-backups/budget_db_backup_20251121_172423.sql.gz
```

---

## 🚀 Yeni Session'da Yapılacaklar

### 1. Azure'a Bağlan
```bash
ssh obiwan@98.71.149.168
```

### 2. Migration'ı Çalıştır
```bash
cd ~/budget && git pull origin main && ./apply-production-migrations.sh
```

### 3. Sonuçları Kontrol Et

Script başarılı olursa:
```bash
# Yeni tabloları kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "\dt" | grep -E "(ai_|smart_|fixed_payment_history)"

# Veri sayılarını kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions;"

# Container durumu
docker ps

# Backend health
curl http://localhost:5001/health

# Web sitesi
curl -I http://localhost:3000
```

### 4. Web'den Test Et
```
https://butce.obiwan.com.tr
```
- Login yapın
- Dashboard'u kontrol edin
- Bildirimler çalışıyor mu?

---

## 🔧 Sorun Çıkarsa

### Script Hata Verirse

Manuel migration:

```bash
cd ~/budget

# 1. Fixed Payment History
docker cp backend/database/migrations/add_fixed_payment_history.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app_prod -f /tmp/add_fixed_payment_history.sql

# 2. AI Tables
docker cp backend/database/migrations/add_ai_tables.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app_prod -f /tmp/add_ai_tables.sql

# 3. Notification Tracking
docker cp backend/database/migrations/add_notification_tracking_columns.sql budget_database_prod:/tmp/
docker exec budget_database_prod psql -U postgres -d budget_app_prod -f /tmp/add_notification_tracking_columns.sql

# 4. Container'ları yeniden başlat
docker restart budget_backend_prod budget_frontend_prod
```

### Rollback Gerekirse

```bash
cd ~/db-backups
gunzip budget_db_backup_20251121_172423.sql.gz
docker exec -i budget_database_prod psql -U postgres -d budget_app_prod < budget_db_backup_20251121_172423.sql
docker restart budget_backend_prod budget_frontend_prod
```

---

## 📊 Beklenen Sonuç

Migration başarılı olduğunda:

### Yeni Tablolar (9 adet)
- ✅ `fixed_payment_history`
- ✅ `ai_interactions`
- ✅ `user_ai_preferences`
- ✅ `category_learning`
- ✅ `user_spending_profile`
- ✅ `receipt_images`
- ✅ `smart_notifications`
- ✅ `ai_query_history`
- ✅ `financial_coach_sessions`

### Güncellenen Tablolar
- ✅ `smart_notifications` - 2 yeni kolon eklendi

### Veri Durumu
- ❌ Veri kaybı YOK
- ✅ Tüm kullanıcı verileri korundu
- ✅ Tüm transaction'lar korundu

---

## 💡 Yeni Session'da Kiro'ya Ne Söylemeli?

Yeni session açtığınızda Kiro'ya şunu söyleyin:

```
"Production migration'a devam etmek istiyorum. 
NEXT_SESSION_PRODUCTION_MIGRATION.md dosyasını oku ve kaldığımız yerden devam edelim."
```

Veya daha kısa:

```
"Production migration devam - Azure'da migration script'ini çalıştıracağız"
```

---

## 📁 İlgili Dosyalar

Referans için:
- `PRODUCTION_MIGRATION_SUMMARY.md` - Genel özet
- `PRODUCTION_MIGRATION_QUICK_START.md` - Hızlı komutlar
- `PRODUCTION_DB_MIGRATION_PLAN.md` - Detaylı plan
- `AZURE_PRODUCTION_COMMANDS.md` - Azure komutları
- `apply-production-migrations.sh` - Otomatik script

---

## ✅ Checklist

Yeni session'da kontrol edin:

- [ ] Azure'a SSH bağlantısı yapıldı
- [ ] `cd ~/budget` dizinine gidildi
- [ ] `git pull origin main` çalıştırıldı
- [ ] `./apply-production-migrations.sh` çalıştırıldı
- [ ] Script başarıyla tamamlandı
- [ ] Yeni tablolar oluşturuldu
- [ ] Container'lar yeniden başlatıldı
- [ ] Backend health check OK
- [ ] Frontend erişilebilir
- [ ] Web sitesi test edildi

---

## 🎯 Tek Komut

Hepsini tek seferde:

```bash
ssh obiwan@98.71.149.168 "cd ~/budget && git pull origin main && ./apply-production-migrations.sh"
```

**Hazır! 🚀**
