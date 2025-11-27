# 🚀 Azure VM'de Esnek Hesap Güncelleme Fix'i Deployment

## Yapılan Değişiklikler

✅ **Account.js**: 
- `currentBalance` field'i eklendi (frontend compatibility)
- `interestRate` field'i API response'a eklendi

✅ **accountController.js**:
- Frontend'den gelen `currentBalance` → backend'de `overdraftUsed`'a map ediliyor

## Azure VM'de Çalıştırılacak Komutlar

### Tek Komut (Önerilen)
```bash
cd ~/budget && git pull origin main && chmod +x scripts/deploy-overdraft-fix.sh && ./scripts/deploy-overdraft-fix.sh
```

### Adım Adım

```bash
# 1. Proje dizinine git
cd ~/budget

# 2. Son değişiklikleri çek
git pull origin main

# 3. Script'i çalıştırılabilir yap
chmod +x scripts/deploy-overdraft-fix.sh

# 4. Deploy script'ini çalıştır
./scripts/deploy-overdraft-fix.sh
```

## Beklenen Sonuç

Script çalıştıktan sonra:
```
✅ Account.js copied
✅ accountController.js copied
✅ Backend is healthy!
✨ Deployment complete!
```

## Test

1. Tarayıcıda: `http://98.71.149.168`
2. Esnek Hesaplar sayfasına git
3. Bir hesap düzenle
4. Limit, Mevcut Bakiye ve Faiz Oranı değiştir
5. Güncelle butonuna tıkla
6. ✅ Tüm alanlar güncellenecek!

## Logları İzleme

```bash
docker logs budget_backend_prod -f
```

## Rollback (Geri Alma)

Eğer sorun olursa:
```bash
cd ~/budget
git checkout HEAD~1 backend/models/Account.js backend/controllers/accountController.js
docker cp backend/models/Account.js budget_backend_prod:/app/models/Account.js
docker cp backend/controllers/accountController.js budget_backend_prod:/app/controllers/accountController.js
docker restart budget_backend_prod
```

---

**Deployment Tarihi**: 15 Kasım 2024
**Commit**: 880fe9f
