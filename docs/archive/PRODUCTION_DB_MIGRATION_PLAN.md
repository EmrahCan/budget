# Production Database Migration Plan
## Azure VM - Data Kaybı Olmadan DB Güncelleme

### 🎯 Hedef
GitHub'daki son DB yapısını (AI tables, notification tracking, fixed payment history) production'a güvenli şekilde aktarmak.

### 📋 Ön Hazırlık (Local'de)

#### 1. Migration Dosyalarını Kontrol Et
```bash
# Local'de çalıştır
cd budget
ls -la backend/database/migrations/
```

Olması gerekenler:
- ✅ add_ai_tables.sql
- ✅ add_notification_tracking_columns.sql  
- ✅ add_fixed_payment_history.sql

#### 2. Production'a Bağlan
```bash
ssh obiwan@98.71.149.168
```

---

### 🔍 ADIM 1: Production Durumunu Kontrol Et

```bash
# Docker container'ları kontrol et
docker ps

# Production dizinine git
cd ~/budget-app

# Mevcut branch'i kontrol et
git status
git branch
```

---

### 💾 ADIM 2: Database Backup Al (ÇOK ÖNEMLİ!)

```bash
# Backup dizini oluştur
mkdir -p ~/db-backups
cd ~/db-backups

# Timestamp ile backup al
BACKUP_FILE="budget_db_backup_$(date +%Y%m%d_%H%M%S).sql"

# PostgreSQL backup
docker exec budget_database_prod pg_dump -U postgres budget_app > $BACKUP_FILE

# Backup'ı kontrol et
ls -lh $BACKUP_FILE
echo "✅ Backup alındı: $BACKUP_FILE"

# Backup'ı sıkıştır (opsiyonel)
gzip $BACKUP_FILE
```

**⚠️ BACKUP ALINMADAN DEVAM ETMEYİN!**

---

### 📥 ADIM 3: GitHub'dan Son Kodu Çek

```bash
cd ~/budget-app

# Mevcut değişiklikleri sakla (varsa)
git stash

# Son kodu çek
git fetch origin
git pull origin main

# Migration dosyalarını kontrol et
ls -la backend/database/migrations/
```

---

### 🔍 ADIM 4: Mevcut DB Yapısını Kontrol Et

```bash
# PostgreSQL'e bağlan
docker exec -it budget_database_prod psql -U postgres -d budget_app

# Mevcut tabloları listele
\dt

# AI tablolarının olup olmadığını kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ai_interactions',
  'user_ai_preferences', 
  'smart_notifications',
  'fixed_payment_history'
);

# Çıkış
\q
```

---

### 🚀 ADIM 5: Migration'ları Uygula

#### 5.1 Fixed Payment History Migration
```bash
# Migration dosyasını container'a kopyala
docker cp ~/budget-app/backend/database/migrations/add_fixed_payment_history.sql budget_database_prod:/tmp/

# Migration'ı çalıştır
docker exec -it budget_database_prod psql -U postgres -d budget_app -f /tmp/add_fixed_payment_history.sql

# Sonucu kontrol et
docker exec -it budget_database_prod psql -U postgres -d budget_app -c "\d fixed_payment_history"
```

#### 5.2 AI Tables Migration
```bash
# Migration dosyasını container'a kopyala
docker cp ~/budget-app/backend/database/migrations/add_ai_tables.sql budget_database_prod:/tmp/

# Migration'ı çalıştır
docker exec -it budget_database_prod psql -U postgres -d budget_app -f /tmp/add_ai_tables.sql

# Sonucu kontrol et
docker exec -it budget_database_prod psql -U postgres -d budget_app -c "\dt ai_*"
docker exec -it budget_database_prod psql -U postgres -d budget_app -c "\dt smart_notifications"
```

#### 5.3 Notification Tracking Columns Migration
```bash
# Migration dosyasını container'a kopyala
docker cp ~/budget-app/backend/database/migrations/add_notification_tracking_columns.sql budget_database_prod:/tmp/

# Migration'ı çalıştır
docker exec -it budget_database_prod psql -U postgres -d budget_app -f /tmp/add_notification_tracking_columns.sql

# Sonucu kontrol et
docker exec -it budget_database_prod psql -U postgres -d budget_app -c "\d smart_notifications"
```

---

### ✅ ADIM 6: Migration Sonuçlarını Doğrula

```bash
# Tüm tabloları listele
docker exec -it budget_database_prod psql -U postgres -d budget_app -c "\dt"

# Kritik tabloları kontrol et
docker exec -it budget_database_prod psql -U postgres -d budget_app << EOF
-- Tablo sayılarını kontrol et
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'fixed_payments', COUNT(*) FROM fixed_payments
UNION ALL
SELECT 'fixed_payment_history', COUNT(*) FROM fixed_payment_history
UNION ALL
SELECT 'smart_notifications', COUNT(*) FROM smart_notifications;
EOF
```

---

### 🔄 ADIM 7: Docker Container'ları Yeniden Başlat

```bash
cd ~/budget-app

# Container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend

# Logları kontrol et
docker logs budget_backend_prod --tail 50
docker logs budget_frontend_prod --tail 50

# Health check
docker ps
```

---

### 🧪 ADIM 8: Production Test

```bash
# Backend health check
curl http://localhost:5001/health

# Frontend erişim kontrolü
curl -I http://localhost:3000

# Database bağlantı testi
docker exec budget_backend_prod node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'budget_database_prod',
  port: 5432,
  database: 'budget_app',
  user: 'postgres',
  password: process.env.DB_PASSWORD
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ DB Error:', err);
  else console.log('✅ DB Connected:', res.rows[0]);
  pool.end();
});
"
```

---

### 🌐 ADIM 9: Web Üzerinden Test

Tarayıcıdan test edin:
- https://butce.obiwan.com.tr - Ana sayfa
- Login yapın
- Dashboard'u kontrol edin
- Bildirimler çalışıyor mu?
- Sabit ödemeler görünüyor mu?

---

### 🔙 Rollback Planı (Sorun Çıkarsa)

```bash
# Backup'tan geri yükle
cd ~/db-backups

# En son backup'ı bul
ls -lt *.sql.gz | head -1

# Backup'ı aç
gunzip budget_db_backup_YYYYMMDD_HHMMSS.sql.gz

# Database'i geri yükle
docker exec -i budget_database_prod psql -U postgres -d budget_app < budget_db_backup_YYYYMMDD_HHMMSS.sql

# Container'ları yeniden başlat
cd ~/budget-app
docker-compose -f docker-compose.prod.yml restart
```

---

### 📊 Migration Özeti

**Eklenecek Tablolar:**
1. `fixed_payment_history` - Sabit ödeme takibi
2. `ai_interactions` - AI etkileşim logları
3. `user_ai_preferences` - Kullanıcı AI tercihleri
4. `category_learning` - Kategori öğrenme verileri
5. `user_spending_profile` - Harcama profili
6. `receipt_images` - Fiş resimleri
7. `smart_notifications` - Akıllı bildirimler
8. `ai_query_history` - AI sorgu geçmişi
9. `financial_coach_sessions` - Finansal koç oturumları

**Güncellenecek Tablolar:**
- `smart_notifications` - `related_entity_id` ve `related_entity_type` kolonları eklenecek

**Veri Kaybı:** ❌ YOK - Sadece yeni tablolar ve kolonlar ekleniyor

---

### ⏱️ Tahmini Süre
- Backup: 1-2 dakika
- Migration: 2-3 dakika
- Test: 2-3 dakika
- **Toplam: ~5-10 dakika**

---

### 📞 Sorun Çıkarsa
1. Önce logları kontrol edin: `docker logs budget_backend_prod`
2. Database bağlantısını test edin
3. Gerekirse rollback yapın
4. Backup her zaman elinizin altında!

---

## ✅ Checklist

- [ ] Production'a SSH bağlantısı yapıldı
- [ ] Docker container'lar çalışıyor
- [ ] Database backup alındı
- [ ] GitHub'dan son kod çekildi
- [ ] Migration dosyaları mevcut
- [ ] fixed_payment_history migration uygulandı
- [ ] AI tables migration uygulandı
- [ ] Notification tracking migration uygulandı
- [ ] Tablolar doğrulandı
- [ ] Container'lar yeniden başlatıldı
- [ ] Backend health check OK
- [ ] Frontend erişilebilir
- [ ] Web üzerinden test edildi

**Hazır olduğunuzda başlayalım! 🚀**
