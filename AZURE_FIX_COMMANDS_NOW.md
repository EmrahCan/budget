# 🔧 Azure VM'de API URL Düzeltme Komutları

## Adım 1: Azure VM'e SSH ile bağlan

```bash
ssh azureuser@budgetapp.site
```

## Adım 2: Proje dizinine git ve güncellemeleri çek

```bash
cd /home/azureuser/budget-app
git pull origin main
```

## Adım 3: Script'i çalıştırılabilir yap

```bash
chmod +x fix-production-api-url.sh
```

## Adım 4: Script'i çalıştır

```bash
./fix-production-api-url.sh
```

Bu script şunları yapacak:
- ✅ Frontend container'ı durduracak
- ✅ Eski container ve image'ı silecek
- ✅ Frontend'i `REACT_APP_API_URL=/api` ile yeniden build edecek (--no-cache)
- ✅ Yeni container'ı başlatacak
- ✅ Logları gösterecek

## Adım 5: Test et

Tarayıcıda aç:
```
https://budgetapp.site
```

Login yapmayı dene. Artık CORS hatası almamalısın!

## Sorun Devam Ederse

### Browser Console'da kontrol et:
```
Network tab > login isteği > Request URL
```
Şu olmalı: `https://budgetapp.site/api/auth/login`
Şu OLMAMALI: `http://localhost:5001/api/auth/login`

### Container loglarını kontrol et:
```bash
docker logs budget_frontend_prod
docker logs budget_backend_prod
```

### Nginx konfigürasyonunu kontrol et:
```bash
sudo nginx -t
sudo systemctl status nginx
```
