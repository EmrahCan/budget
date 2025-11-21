# 🔍 Database Adını Bulma ve Düzeltme

## Sorun
`budget_app` database'i bulunamadı. Farklı bir isim kullanılıyor olabilir.

---

## Azure VM'de Şu Komutları Çalıştırın

### 1. Database Adını Bulun
```bash
# PostgreSQL container'a bağlan ve database'leri listele
docker exec budget_database_prod psql -U postgres -c "\l"
```

### 2. Backend Environment Değişkenlerini Kontrol Et
```bash
# Backend container'daki environment değişkenlerini göster
docker exec budget_backend_prod env | grep -i db

# Veya docker-compose dosyasını kontrol et
cat ~/budget/docker-compose.prod.yml | grep -i database
```

### 3. Backend Loglarını Kontrol Et
```bash
# Backend loglarında database bağlantı bilgilerini ara
docker logs budget_backend_prod 2>&1 | grep -i "database\|postgres\|connection"
```

---

## Muhtemel Database İsimleri

Production'da genellikle şunlardan biri kullanılır:
- `postgres` (default)
- `budget`
- `budget_prod`
- `budgetapp`
- `production`

---

## Database Adını Bulduktan Sonra

Doğru database adıyla backup almak için:

```bash
# Örnek: Database adı "postgres" ise
docker exec budget_database_prod pg_dump -U postgres postgres > ~/db-backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Örnek: Database adı "budget" ise
docker exec budget_database_prod pg_dump -U postgres budget > ~/db-backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Hızlı Test

```bash
# Her bir olası database adını test et
for db in postgres budget budget_prod budgetapp production; do
  echo "Testing database: $db"
  docker exec budget_database_prod psql -U postgres -d $db -c "SELECT 1;" 2>&1 | grep -q "1 row" && echo "✅ Found: $db" || echo "❌ Not found: $db"
done
```

---

## Sonuç

Yukarıdaki komutları çalıştırın ve bana database adını söyleyin. 
Script'i doğru database adıyla güncelleyeceğim.
