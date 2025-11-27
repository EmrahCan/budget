# 🚀 Production Database'i Hemen Senkronize Et

## Hızlı Başlangıç

### 1. Dump Al (SSH Şifresi: Eben2010++**++)

```bash
cd budget
./get-prod-dump.sh
```

### 2. Restore Et

```bash
./restore-prod-dump.sh prod_full_*.sql
```

## Tek Komut

```bash
cd budget
./full-prod-sync.sh
```

## Ne Olacak?

✅ Production'daki tüm tablolar kopyalanır  
✅ Production'daki tüm veriler kopyalanır  
✅ Sabit ödemeler çalışır hale gelir  
✅ Tüm schema uyumsuzlukları düzelir  

## Login

Production kullanıcıları ile login olabilirsiniz.  
Test kullanıcısı (admin123) silinecektir.

## Detaylı Bilgi

`PRODUCTION_SYNC_GUIDE.md` dosyasına bakın.

---

**Hemen başla:** `./get-prod-dump.sh`
