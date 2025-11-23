# 🔄 Production Database Senkronizasyon Rehberi

## Amaç

Production database'in tam kopyasını (schema + data) local'e almak.

## Neden Gerekli?

Local'de oluşturduğumuz migration'lar production ile tam uyumlu olmayabilir:
- Kolon isimleri farklı olabilir (`due_day` vs `payment_day`)
- Veri tipleri farklı olabilir (UUID vs INTEGER)
- Eksik tablolar veya kolonlar olabilir

**Çözüm:** Production'dan tam dump alıp local'e restore etmek.

## 📋 Adım Adım Kullanım

### Yöntem 1: İki Aşamalı (Önerilen)

#### 1. Production'dan Dump Al

```bash
cd budget
./get-prod-dump.sh
```

**SSH Şifresi:** `Eben2010++**++`

Bu komut `prod_full_YYYYMMDD_HHMMSS.sql` dosyası oluşturur.

#### 2. Dump'ı Local'e Restore Et

```bash
./restore-prod-dump.sh prod_full_20241118_223000.sql
```

(Dosya adını kendi oluşan dosya ile değiştirin)

### Yöntem 2: Tek Komut (İnteraktif)

```bash
cd budget
./full-prod-sync.sh
```

Bu komut hem dump alır hem restore eder.

## 🔍 Ne Yapılıyor?

### 1. Backup Alma
```bash
ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod" > backup.sql
```

### 2. Local Database Temizleme
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Restore
```bash
cat backup.sql | docker exec -i budget_database_local_prod psql -U postgres -d budget_app_local_prod
```

## ✅ Restore Sonrası Kontrol

### Tabloları Kontrol Et
```bash
PGPASSWORD=local_prod_password_123 psql -h localhost -p 5434 -U postgres -d budget_app_local_prod -c "\dt"
```

Beklenen tablolar:
- users
- accounts
- transactions
- fixed_payments
- fixed_payment_history
- installment_payments
- credit_cards
- credit_card_transactions
- credit_card_statements

### Fixed Payments Schema Kontrol
```bash
PGPASSWORD=local_prod_password_123 psql -h localhost -p 5434 -U postgres -d budget_app_local_prod -c "\d fixed_payments"
```

Beklenen kolonlar:
- `id` (UUID) - ✅ Production ile aynı
- `user_id` (UUID)
- `name` (VARCHAR)
- `amount` (NUMERIC)
- `due_day` (INTEGER) - ✅ Production'daki isim
- `category` (VARCHAR)
- `account_id` (UUID)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Kullanıcıları Kontrol Et
```bash
PGPASSWORD=local_prod_password_123 psql -h localhost -p 5434 -U postgres -d budget_app_local_prod -c "SELECT email, role FROM users;"
```

### Veri Sayılarını Kontrol Et
```bash
PGPASSWORD=local_prod_password_123 psql -h localhost -p 5434 -U postgres -d budget_app_local_prod << 'EOF'
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM accounts) as accounts,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM fixed_payments) as fixed_payments;
EOF
```

## 🔑 Login Bilgileri

Restore sonrası production kullanıcıları ile login olabilirsiniz:

### Production Kullanıcıları
- **emrahcan@hotmail.com** (admin) - Production şifresi
- **admin@budgetapp.com** (admin) - Production şifresi
- **ersannozcann@gmail.com** (user) - Production şifresi

⚠️ **Önemli:** Şifreler production'daki ile aynıdır. Test kullanıcısı (admin123) silinmiş olacaktır.

## 🧪 Test

### 1. Login Test
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@budgetapp.com","password":"PRODUCTION_PASSWORD"}'
```

### 2. Sabit Ödemeler Test
```bash
# Token al
TOKEN="..."

# Sabit ödemeleri listele
curl -X GET http://localhost:5002/api/fixed-payments \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Frontend Test
1. http://localhost:3001 adresine git
2. Production kullanıcısı ile login ol
3. Sabit ödemeler sayfasına git
4. Yeni sabit ödeme ekle

## 📊 Backup Dosyası

### Dosya Boyutu
Production database boyutuna göre 1-50 MB arası olabilir.

### Saklama
Backup dosyasını saklayabilir veya silebilirsiniz:

```bash
# Sakla (önerilen)
mkdir -p backups
mv prod_full_*.sql backups/

# Sil
rm prod_full_*.sql
```

### Eski Backup'ları Temizle
```bash
# 7 günden eski backup'ları sil
find . -name "prod_full_*.sql" -mtime +7 -delete
```

## 🔄 Ne Zaman Senkronize Edilmeli?

### Düzenli Senkronizasyon
- Haftada bir production verilerini güncellemek için
- Yeni özellik geliştirmeye başlamadan önce
- Production'da bug fix yapıldıktan sonra

### Sorun Çözme
- Local'de bir özellik çalışmıyorsa
- Schema uyumsuzluğu varsa
- Migration sorunları yaşanıyorsa

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Local Değişiklikler Silinir
Restore işlemi local database'i tamamen siler. Local'de yaptığınız değişiklikler kaybolur.

### 2. Container Yeniden Başlatma Gerekmez
Restore sonrası backend container'ı yeniden başlatmanıza gerek yok. Değişiklikler anında geçerli olur.

### 3. Production Şifreleri
Restore sonrası production şifreleri geçerli olur. Test şifresi (admin123) çalışmaz.

### 4. Disk Alanı
Backup dosyası için yeterli disk alanı olduğundan emin olun.

## 🛠️ Sorun Giderme

### SSH Bağlantı Hatası
```bash
# SSH key kontrolü
ssh obiwan@98.71.149.168 "echo 'Connection OK'"
```

### Restore Hatası
```bash
# Container'ın çalıştığını kontrol et
docker ps | grep budget_database_local_prod

# Database loglarını kontrol et
docker logs budget_database_local_prod --tail 50
```

### Schema Uyumsuzluğu
Eğer restore sonrası hala sorun varsa:

```bash
# Backend container'ı yeniden başlat
docker restart budget_backend_local_prod

# Logları kontrol et
docker logs budget_backend_local_prod --tail 50
```

## 📝 Özet

1. **Dump Al:** `./get-prod-dump.sh`
2. **Restore Et:** `./restore-prod-dump.sh prod_full_*.sql`
3. **Kontrol Et:** Tabloları ve verileri kontrol et
4. **Test Et:** Frontend'de login ol ve özellikleri test et

Artık local ortamınız production'ın tam kopyası!

---

**Son Güncelleme:** 18 Kasım 2024
