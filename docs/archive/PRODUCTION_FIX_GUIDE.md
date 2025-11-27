# 🔧 Production Esnek Hesap Silme Sorunu - Çözüm Rehberi

## 🎯 Sorun
Azure VM'de esnek hesap silme işlemi 400 Bad Request hatası veriyor.
Hata: `DELETE http://98.71.149.168/api/accounts/c740b41a-a946-4772-bd3a-541e8145b76b 400`

## 🔍 Kök Neden
Production'da UUID formatında ID kullanılıyor ama validation middleware sadece INTEGER ID kabul ediyor.

## ✅ Çözüm
Validation middleware'i hem INTEGER hem UUID ID'leri kabul edecek şekilde güncelledik.

---

## 📋 Azure VM'de Yapılacaklar

### Adım 1: Proje Dizinine Git
```bash
cd ~/budget
# veya projenin bulunduğu dizin
```

### Adım 2: Son Değişiklikleri Çek
```bash
git pull origin main
```

### Adım 3: Veritabanı Yapısını Kontrol Et
```bash
chmod +x check-production-db.sh
./check-production-db.sh
```

Bu komut şunları gösterecek:
- Accounts tablosunun yapısı
- ID'lerin formatı (INTEGER mi UUID mi?)
- Mevcut hesaplar ve transaction sayıları

### Adım 4: Fix'i Uygula
```bash
chmod +x fix-production-account-delete.sh
./fix-production-account-delete.sh
```

Bu script:
1. ✅ Mevcut validation.js'i yedekler
2. ✅ Güncellenmiş validation.js'i container'a kopyalar
3. ✅ Backend'i restart eder
4. ✅ Health check yapar

### Adım 5: Test Et
```bash
# Backend loglarını izle
docker logs budget_backend_prod -f
```

Başka bir terminal'de:
```bash
# Health check
curl http://localhost:5001/health

# API test
curl http://localhost:5001/api/accounts
```

---

## 🚨 Alternatif: Manuel Deployment

Eğer scriptler çalışmazsa manuel olarak:

### 1. Validation.js'i Güncelle
```bash
# Container'a gir
docker exec -it budget_backend_prod /bin/sh

# Dosyayı düzenle
vi /app/middleware/validation.js
```

Veya local'den kopyala:
```bash
docker cp backend/middleware/validation.js budget_backend_prod:/app/middleware/validation.js
```

### 2. Backend'i Restart Et
```bash
docker restart budget_backend_prod
```

### 3. Logları Kontrol Et
```bash
docker logs budget_backend_prod --tail 50 -f
```

---

## 🔍 Debug Komutları

### Container'ları Kontrol Et
```bash
docker ps -a
```

### Backend Logları
```bash
docker logs budget_backend_prod --tail 100
```

### Database'e Bağlan
```bash
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod
```

Database'de:
```sql
-- Accounts tablosunu incele
\d accounts

-- ID formatını kontrol et
SELECT id, name, type FROM accounts LIMIT 5;

-- Transaction sayılarını kontrol et
SELECT a.id, a.name, COUNT(t.id) as tx_count 
FROM accounts a 
LEFT JOIN transactions t ON a.id = t.account_id 
GROUP BY a.id, a.name;
```

### Backend Environment'ı Kontrol Et
```bash
docker exec budget_backend_prod env | grep -E "DB_|NODE_ENV|PORT"
```

---

## 📊 Beklenen Sonuç

Fix uygulandıktan sonra:
- ✅ Hem INTEGER ID'ler çalışacak (örn: 1, 2, 3)
- ✅ Hem UUID ID'ler çalışacak (örn: c740b41a-a946-4772-bd3a-541e8145b76b)
- ✅ Esnek hesap silme işlemi başarılı olacak
- ✅ 400 Bad Request hatası gitmeyecek

---

## 🔄 Rollback (Geri Alma)

Eğer bir sorun olursa:

```bash
# Backup'tan geri yükle
docker exec budget_backend_prod cp /app/middleware/validation.js.backup /app/middleware/validation.js

# Backend'i restart et
docker restart budget_backend_prod
```

---

## 📝 Notlar

1. **Soft Delete**: Eğer hesapta transaction varsa, hesap silinmez sadece deaktif edilir
2. **Hard Delete**: Transaction yoksa hesap tamamen silinir
3. **UUID vs INTEGER**: Production'da hangi format kullanıldığını kontrol edin

---

## 🆘 Sorun Devam Ederse

1. Backend loglarını kontrol edin:
   ```bash
   docker logs budget_backend_prod --tail 200 | grep -i "error\|delete\|account"
   ```

2. Database bağlantısını test edin:
   ```bash
   docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT 1;"
   ```

3. Frontend'in doğru API URL'ini kullandığını kontrol edin:
   ```bash
   docker exec budget_frontend_prod env | grep REACT_APP_API_URL
   ```

4. Network bağlantısını kontrol edin:
   ```bash
   docker network inspect budget_network_prod
   ```

---

**Son Güncelleme**: 15 Kasım 2024
