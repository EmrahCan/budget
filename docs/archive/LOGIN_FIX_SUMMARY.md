# Login Sorunu Çözümü

## Sorun
Frontend localhost:5001'e istek atıyordu ama backend 5002 portunda çalışıyor.

## Çözüm

### 1. API URL Düzeltildi
`frontend/.env` dosyası güncellendi:
```
PORT=3003
REACT_APP_API_URL=http://localhost:5002/api
```

### 2. Kullanıcı Şifresi Resetlendi
emrahcan@hotmail.com kullanıcısının şifresi `Emrah123` olarak ayarlandı.

### 3. Frontend Yeniden Başlatıldı
- Cache temizlendi
- npm process'leri durduruldu
- Frontend 3003 portunda yeniden başlatıldı

## Test

### Backend Test (Başarılı ✅)
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"emrahcan@hotmail.com","password":"Emrah123"}'
```

Sonuç:
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": {
      "id": "5f10819f-a875-4ebd-ad4c-72ebd3b19e87",
      "email": "emrahcan@hotmail.com",
      "firstName": "Emrah",
      "lastName": "Cercioglu",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Login Bilgileri

**Email:** emrahcan@hotmail.com  
**Şifre:** Emrah123

## Çalışan Servisler

| Servis | Port | Durum |
|--------|------|-------|
| Frontend (npm) | 3003 | ✅ Çalışıyor |
| Backend (Docker) | 5002 | ✅ Çalışıyor |
| Database (Docker) | 5434 | ✅ Çalışıyor |

## Frontend Erişim

http://localhost:3003

## Notlar

1. Frontend npm ile çalışıyor (Docker değil)
2. Backend ve Database Docker'da çalışıyor
3. API URL artık doğru: http://localhost:5002/api
4. Cache temizlendi, environment variable'lar yüklendi

## Sorun Giderme

### Hala localhost:5001'e gidiyorsa:
1. Browser cache'ini temizle (Cmd+Shift+R veya Ctrl+Shift+R)
2. Browser'ı tamamen kapat ve yeniden aç
3. Incognito/Private mode'da dene

### Frontend başlamazsa:
```bash
cd frontend
rm -rf node_modules/.cache
npm start
```

### Şifre unutulursa:
```bash
docker exec budget_backend_local_prod node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_local_prod',
  user: 'postgres',
  password: 'local_prod_password_123'
});
async function reset() {
  const hash = await bcrypt.hash('YeniSifre123', 10);
  await pool.query('UPDATE users SET password_hash = \$1 WHERE email = \$2', [hash, 'email@example.com']);
  await pool.end();
  console.log('Şifre resetlendi');
}
reset();
"
```
