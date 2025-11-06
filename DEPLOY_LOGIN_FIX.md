# Login Sorunu Düzeltme - Deployment Adımları

## Sorun
Login endpoint'inde `User.findByEmail()` metodu tutarsız veri döndürüyordu.

## Düzeltilen Dosyalar
1. `backend/models/User.js` - findByEmailWithPassword() metodu eklendi
2. `backend/controllers/authController.js` - Login metodu güncellendi

## VM'ye Deployment Adımları

### Adım 1: Local'den Git'e Push
```bash
cd /path/to/your/local/budget-app
git add .
git commit -m "fix: Login authentication bug - separate password hash retrieval"
git push origin main
```

### Adım 2: VM'de Git Pull
```bash
# VM'ye SSH ile bağlanın
ssh azureuser@your-vm-ip

# Proje dizinine gidin
cd /home/azureuser/budget-app

# Son değişiklikleri çekin
git pull origin main
```

### Adım 3: Backend'i Yeniden Build ve Deploy
```bash
# Backend dizinine gidin
cd /home/azureuser/budget-app/budget/backend

# Docker image'ı yeniden build edin
docker build -t budget-backend .

# Eski container'ı durdurun ve silin
docker stop budget_backend_prod
docker rm budget_backend_prod

# Yeni container'ı başlatın
docker run -d \
  --name budget_backend_prod \
  --network budget_network \
  -e NODE_ENV=production \
  -e PORT=5001 \
  -e DB_HOST=budget_database_prod \
  -e DB_PORT=5432 \
  -e DB_NAME=budget_app_prod \
  -e DB_USER=postgres \
  -e 'DB_PASSWORD=BudgetApp2024!SecurePassword' \
  -e JWT_SECRET=budget_app_super_secret_jwt_key_2024 \
  -e GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g \
  -p 5001:5001 \
  --restart unless-stopped \
  budget-backend

# 20 saniye bekleyin
sleep 20

# Logları kontrol edin
docker logs budget_backend_prod --tail 30
```

### Adım 4: Test Edin
```bash
# Login testi
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}'
```

## Hızlı Deployment Script

Aşağıdaki komutu VM'de çalıştırabilirsiniz:

```bash
cd /home/azureuser/budget-app && \
git pull origin main && \
cd budget/backend && \
docker build -t budget-backend . && \
docker stop budget_backend_prod && \
docker rm budget_backend_prod && \
docker run -d \
  --name budget_backend_prod \
  --network budget_network \
  -e NODE_ENV=production \
  -e PORT=5001 \
  -e DB_HOST=budget_database_prod \
  -e DB_PORT=5432 \
  -e DB_NAME=budget_app_prod \
  -e DB_USER=postgres \
  -e 'DB_PASSWORD=BudgetApp2024!SecurePassword' \
  -e JWT_SECRET=budget_app_super_secret_jwt_key_2024 \
  -e GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g \
  -p 5001:5001 \
  --restart unless-stopped \
  budget-backend && \
sleep 20 && \
docker logs budget_backend_prod --tail 30
```

## Doğrulama
Başarılı olursa şu yanıtı almalısınız:
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": {...},
    "token": "eyJhbGc..."
  }
}
```
