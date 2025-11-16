# Fixed Payments Mark-Paid Fix - Azure VM

## Sorun
Production'da fixed payments "ödendi" işaretleme çalışmıyor:
- Local: ✅ Çalışıyor (http://localhost:3002/fixed-payments)
- Production: ❌ 400 Bad Request (http://98.71.149.168:3000/fixed-payments)

**Hata:**
```
POST http://98.71.149.168:5001/api/fixed-payments/9f51c4a5-af33-4dea-800b-874c95929e74/mark-paid 400 (Bad Request)
```

## Kök Neden
`backend/routes/fixedPayments.js` dosyasında local paramValidation tanımı sadece INTEGER ID kabul ediyor, UUID kabul etmiyor.

## Çözüm Adımları

### 1. Proje Dizinine Git
```bash
cd ~/budget
```

### 2. Son Değişiklikleri Çek
```bash
git status
git pull origin main
```

### 3. Değişiklikleri Kontrol Et
```bash
# Fixed payments route dosyasını kontrol et
cat backend/routes/fixedPayments.js | grep -A 10 "const paramValidation"
```

Şunu görmelisin:
```javascript
const paramValidation = {
  id: [
    param('id')
      .custom((value) => {
        // Support both integer and UUID formats
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
```

### 4. Container'ları Kontrol Et
```bash
docker ps
```

Backend container adını not al (örn: `budget_backend_prod` veya `budget-backend`)

### 5. Backend'i Yeniden Başlat
```bash
# Container adını değiştir
docker restart budget_backend_prod

# Veya docker-compose kullanıyorsan
docker-compose -f docker-compose.prod.yml restart backend
```

### 6. Logları İzle
```bash
docker logs -f budget_backend_prod --tail 50
```

Başka bir terminal'de:

### 7. Health Check
```bash
curl http://localhost:5001/health
```

### 8. Test Et
Tarayıcıda: http://98.71.149.168:3000/fixed-payments

Fixed payment'ta "ödendi" checkbox'ını işaretle ve çalışıp çalışmadığını kontrol et.

## Alternatif: Manuel Dosya Kopyalama

Eğer git pull çalışmazsa:

```bash
# Local'den dosyayı kopyala
# Local makinende:
scp budget/backend/routes/fixedPayments.js azureuser@98.71.149.168:~/budget/backend/routes/

# VM'de container'a kopyala
docker cp ~/budget/backend/routes/fixedPayments.js budget_backend_prod:/app/routes/fixedPayments.js

# Restart
docker restart budget_backend_prod
```

## Doğrulama

### Backend Loglarında Kontrol
```bash
docker logs budget_backend_prod 2>&1 | grep -i "error\|mark-paid"
```

### API Test
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@budget.com","password":"demo123"}' | jq -r '.token')

# Fixed payments listele
curl -s -X GET http://localhost:5001/api/fixed-payments \
  -H "Authorization: Bearer $TOKEN" | jq '.data.fixedPayments[0]'

# ID'yi al ve mark-paid test et
PAYMENT_ID="9f51c4a5-af33-4dea-800b-874c95929e74"
curl -X POST http://localhost:5001/api/fixed-payments/$PAYMENT_ID/mark-paid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month":11,"year":2024}'
```

## Rollback (Gerekirse)

```bash
cd ~/budget
git log --oneline -5
git checkout HEAD~1 backend/routes/fixedPayments.js
docker restart budget_backend_prod
```

## Beklenen Sonuç

✅ UUID formatındaki fixed payment ID'leri kabul edilecek
✅ Mark-paid endpoint 200 OK dönecek
✅ Frontend'de checkbox çalışacak
✅ Payment history kaydedilecek

