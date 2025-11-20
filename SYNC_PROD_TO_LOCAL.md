# 🔄 Production DB'yi Local'e Senkronize Etme

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. **Hassas Veriler (PII - Personally Identifiable Information)**
**Sorun:** Production'da gerçek kullanıcı verileri var (email, şifre, kişisel bilgiler)  
**Risk:** Veri güvenliği ve GDPR/KVKK uyumsuzluğu

**Çözümler:**
- ✅ Verileri anonimleştir (anonymize)
- ✅ Test kullanıcıları oluştur
- ✅ Hassas alanları maskele

### 2. **Veri Boyutu**
**Sorun:** Production DB çok büyük olabilir  
**Risk:** Local disk dolabilir, yavaş çalışabilir

**Çözümler:**
- ✅ Sadece son X ay verilerini al
- ✅ Sadece gerekli tabloları al
- ✅ Büyük dosyaları (uploads) alma

### 3. **Environment Farklılıkları**
**Sorun:** Production ve local environment'lar farklı  
**Risk:** Bazı özellikler çalışmayabilir

**Çözümler:**
- ✅ Environment-specific ayarları güncelle
- ✅ External service'leri mock'la
- ✅ API key'leri güncelle

### 4. **Şifre Güvenliği**
**Sorun:** Production şifreleri local'de kullanılmamalı  
**Risk:** Güvenlik açığı

**Çözümler:**
- ✅ Tüm şifreleri reset et
- ✅ Test şifreleri kullan
- ✅ Admin kullanıcısı oluştur

---

## 🚀 Güvenli Senkronizasyon Script'i

### Seçenek 1: Tam Veri (Dikkatli Kullan)

```bash
#!/bin/bash
# sync-prod-to-local-full.sh

set -e

echo "🔄 Syncing production database to local..."

# 1. Production'dan backup al
echo "📦 Creating production backup..."
ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod" > prod_backup_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Backup created"

# 2. Local database'i temizle
echo "🗑️  Cleaning local database..."
docker exec -i budget_database_dev psql -U postgres -c "DROP DATABASE IF EXISTS budget_app_dev;"
docker exec -i budget_database_dev psql -U postgres -c "CREATE DATABASE budget_app_dev;"

echo "✅ Local database cleaned"

# 3. Backup'ı restore et
echo "📥 Restoring backup to local..."
cat prod_backup_*.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev

echo "✅ Backup restored"

# 4. Hassas verileri temizle
echo "🔒 Anonymizing sensitive data..."
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
-- Email'leri anonimleştir (admin hariç)
UPDATE users 
SET email = 'user_' || id || '@test.local'
WHERE role != 'admin';

-- Şifreleri reset et (hepsi "Test123!" olacak)
UPDATE users 
SET password_hash = '$2a$10$YourHashedPasswordHere';

-- Telefon numaralarını temizle
UPDATE users 
SET phone = NULL;

-- Diğer hassas alanları temizle
-- ...

EOF

echo "✅ Sensitive data anonymized"

# 5. Test admin kullanıcısı oluştur
echo "👤 Creating test admin user..."
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@local.test',
  '$2a$10$YourHashedPasswordHere',  -- Test123!
  'Admin',
  'User',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;
EOF

echo "✅ Test admin created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Production data synced to local successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Test Credentials:"
echo "   Email: admin@local.test"
echo "   Password: Test123!"
echo ""
echo "⚠️  Remember: This is anonymized production data!"
echo ""
```

### Seçenek 2: Sadece Schema (Güvenli)

```bash
#!/bin/bash
# sync-prod-schema-only.sh

set -e

echo "🔄 Syncing production schema to local..."

# 1. Production'dan sadece schema al
echo "📦 Getting production schema..."
ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres -s budget_app_prod" > prod_schema_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Schema exported"

# 2. Local database'i temizle
echo "🗑️  Cleaning local database..."
docker exec -i budget_database_dev psql -U postgres -c "DROP DATABASE IF EXISTS budget_app_dev;"
docker exec -i budget_database_dev psql -U postgres -c "CREATE DATABASE budget_app_dev;"

echo "✅ Local database cleaned"

# 3. Schema'yı restore et
echo "📥 Restoring schema to local..."
cat prod_schema_*.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev

echo "✅ Schema restored"

# 4. Test verileri ekle
echo "📝 Adding test data..."
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev -f backend/database/init/02-seed.sql

echo "✅ Test data added"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Production schema synced to local successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

### Seçenek 3: Kısmi Veri (Önerilen)

```bash
#!/bin/bash
# sync-prod-to-local-partial.sh

set -e

echo "🔄 Syncing partial production data to local..."

# 1. Production'dan son 3 ay verilerini al
echo "📦 Getting last 3 months data..."
ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod \
  --exclude-table-data=audit_logs \
  --exclude-table-data=sessions" > prod_partial_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Partial backup created"

# 2. Local database'i temizle
echo "🗑️  Cleaning local database..."
docker exec -i budget_database_dev psql -U postgres -c "DROP DATABASE IF EXISTS budget_app_dev;"
docker exec -i budget_database_dev psql -U postgres -c "CREATE DATABASE budget_app_dev;"

echo "✅ Local database cleaned"

# 3. Backup'ı restore et
echo "📥 Restoring backup to local..."
cat prod_partial_*.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev

echo "✅ Backup restored"

# 4. Eski verileri temizle (son 3 ay hariç)
echo "🗑️  Removing old data..."
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
-- Son 3 ay hariç transaction'ları sil
DELETE FROM transactions 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Son 3 ay hariç payment'ları sil
DELETE FROM fixed_payments 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Orphan kayıtları temizle
-- ...

EOF

echo "✅ Old data removed"

# 5. Hassas verileri anonimleştir
echo "🔒 Anonymizing sensitive data..."
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
-- Email'leri anonimleştir
UPDATE users 
SET email = 'user_' || id || '@test.local'
WHERE role != 'admin';

-- Şifreleri reset et
UPDATE users 
SET password_hash = '$2a$10$YourHashedPasswordHere';

EOF

echo "✅ Sensitive data anonymized"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Partial production data synced to local successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

---

## 🔐 Şifre Hash'i Oluşturma

Test şifresi için hash oluşturmak:

```javascript
// create-test-password.js
const bcrypt = require('bcryptjs');

async function createHash() {
  const password = 'Test123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

createHash();
```

```bash
node create-test-password.js
```

---

## 📋 Kullanım Önerileri

### Ne Zaman Tam Veri Sync Yapmalı?

✅ **Yapmalı:**
- Bug reproduction için
- Migration testing için
- Performance testing için
- Data migration testing için

❌ **Yapmamalı:**
- Günlük development için
- Public demo için
- Güvenlik testi için
- Paylaşılan development ortamında

### Ne Zaman Schema-Only Sync Yapmalı?

✅ **Yapmalı:**
- Günlük development için
- Yeni özellik geliştirme için
- Unit testing için
- CI/CD pipeline'da

### Ne Zaman Partial Sync Yapmalı?

✅ **Yapmalı:**
- Integration testing için
- UI testing için
- Realistic data ile test için
- Performance optimization için

---

## 🛡️ Güvenlik Checklist

Sync yapmadan önce:

- [ ] Production backup aldım
- [ ] Local'de test ediyorum (production değil)
- [ ] Hassas verileri anonimleştireceğim
- [ ] Şifreleri reset edeceğim
- [ ] Email'leri değiştireceğim
- [ ] API key'leri güncelleyeceğim
- [ ] External service'leri mock'layacağım
- [ ] Sync script'ini .gitignore'a ekledim
- [ ] Backup dosyalarını .gitignore'a ekledim

---

## 🚨 Yasal Uyarı

**GDPR/KVKK Uyumluluğu:**

Production verilerini local'e alırken:
1. Kullanıcı verilerini anonimleştirin
2. Kişisel verileri maskeleyin
3. Gereksiz verileri silmeyin (audit için gerekebilir)
4. Veri işleme kayıtlarını tutun
5. Veri güvenliği önlemlerini alın

**Önemli:** Gerçek kullanıcı verileriyle development yapmak GDPR/KVKK ihlalidir!

---

## 📊 Örnek Anonimleştirme SQL

```sql
-- Email'leri anonimleştir
UPDATE users 
SET email = 'user_' || id || '@test.local'
WHERE role != 'admin';

-- İsimleri anonimleştir
UPDATE users 
SET 
  first_name = 'User',
  last_name = 'Test_' || id;

-- Telefon numaralarını temizle
UPDATE users 
SET phone = NULL;

-- Adres bilgilerini temizle
UPDATE users 
SET address = NULL;

-- Notları temizle
UPDATE transactions 
SET notes = 'Test transaction';

-- IP adreslerini temizle
UPDATE audit_logs 
SET ip_address = '127.0.0.1';

-- Session'ları temizle
TRUNCATE TABLE sessions;

-- Password reset token'larını temizle
UPDATE users 
SET reset_token = NULL, reset_token_expires = NULL;
```

---

## 🎯 Hızlı Komutlar

### Production'dan Backup Al
```bash
ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod" > prod_backup.sql
```

### Local'e Restore Et
```bash
cat prod_backup.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev
```

### Hassas Verileri Temizle
```bash
docker exec -i budget_database_dev psql -U postgres -d budget_app_dev -f anonymize.sql
```

---

## 💡 Best Practices

1. **Düzenli Sync Yapma** - Sadece gerektiğinde
2. **Anonimleştir** - Her zaman hassas verileri temizle
3. **Backup Al** - Sync öncesi local backup al
4. **Test Et** - Sync sonrası uygulamayı test et
5. **Dokümante Et** - Ne zaman, neden sync yaptığını kaydet
6. **Güvenli Sil** - Kullanmadığın backup'ları sil
7. **Encrypt Et** - Backup dosyalarını şifrele
8. **Access Control** - Sadece gerekli kişiler erişsin

---

**Özet:** Production DB'yi local'e atabilirsiniz ama mutlaka hassas verileri anonimleştirin ve güvenlik önlemlerini alın!
