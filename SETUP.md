# Budget App - Kurulum Rehberi

## Hızlı Başlangıç

### 1. Ön Gereksinimler

```bash
# Node.js versiyonunu kontrol et
node --version  # v18 veya üzeri olmalı

# Docker'ın çalıştığını kontrol et
docker --version
docker-compose --version
```

### 2. Projeyi İndir

```bash
git clone <repository-url>
cd budget
```

### 3. Environment Dosyalarını Hazırla

#### Backend (.env.local-prod)
```bash
cd backend
cp .env.example .env.local-prod
```

`.env.local-prod` içeriği:
```env
# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_local_prod
DB_USER=postgres
DB_PASSWORD=local_prod_password_123

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=production

# Frontend URL
FRONTEND_URL=http://localhost:3003

# AI Configuration (Opsiyonel)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true

# CORS Configuration
CORS_ORIGIN=http://localhost:3003,http://localhost:5002
```

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
```

`.env` içeriği:
```env
PORT=3003
REACT_APP_API_URL=http://localhost:5002/api
REACT_APP_ENVIRONMENT=development
```

### 4. Backend ve Database'i Başlat (Docker)

```bash
cd ..
./scripts/local/start-local-dev.sh
```

Bu komut:
- PostgreSQL database container'ını başlatır (port 5434)
- Backend container'ını başlatır (port 5002)
- Database'i initialize eder
- Health check'leri yapar

### 5. Frontend'i Başlat (npm)

Yeni bir terminal açın:

```bash
cd frontend
npm install
npm start
```

Frontend http://localhost:3003 adresinde açılacak.

## ✅ Kurulum Doğrulama

### Backend Kontrolü
```bash
curl http://localhost:5002/api/health
```

Beklenen yanıt:
```json
{"success": false, "message": "API endpoint not found"}
```
(Bu normal, /health endpoint'i yok ama backend çalışıyor demektir)

### Database Kontrolü
```bash
docker exec budget_database_local_prod psql -U postgres -d budget_app_local_prod -c "SELECT COUNT(*) FROM users;"
```

### Frontend Kontrolü
Browser'da http://localhost:3003 adresine gidin. Login sayfası görünmeli.

## 🔐 İlk Giriş

### Test Kullanıcısı Oluşturma

1. Frontend'de "Kayıt Ol" butonuna tıklayın
2. Bilgilerinizi girin (şifre en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam içermeli)
3. Kayıt olduktan sonra giriş yapın

### Veya Mevcut Kullanıcı ile Giriş

Eğer database'de kullanıcı varsa:

```bash
# Kullanıcıları listele
docker exec budget_database_local_prod psql -U postgres -d budget_app_local_prod -c "SELECT email, first_name, last_name FROM users;"

# Şifre sıfırla
./scripts/local/reset-user-password.sh user@example.com NewPass123
```

## 🛠️ Geliştirme Ortamı

### Hot Reload

- **Frontend**: Kod değişiklikleri otomatik yansır
- **Backend**: Container'ı yeniden başlatmanız gerekir

### Backend'i Yeniden Başlatma

```bash
docker-compose -f docker-compose.local-prod.yml restart backend
```

### Database'i Sıfırlama

```bash
# Tüm verileri sil ve yeniden başlat
docker-compose -f docker-compose.local-prod.yml down -v
./scripts/local/start-local-dev.sh
```

## 📊 Database Yönetimi

### Backup Alma

```bash
./scripts/local/backup-database.sh
```

Backup'lar `backups/` klasörüne kaydedilir.

### Database'e Bağlanma

```bash
docker exec -it budget_database_local_prod psql -U postgres -d budget_app_local_prod
```

### Migration Çalıştırma

```bash
# Backend container içinde
docker exec budget_backend_local_prod npm run migrate
```

## 🐛 Yaygın Sorunlar

### Port Zaten Kullanımda

```bash
# Port 3003'ü kullanan process'i bul
lsof -i :3003

# Process'i durdur
kill -9 <PID>
```

### Docker Container Başlamıyor

```bash
# Log'ları kontrol et
docker logs budget_backend_local_prod
docker logs budget_database_local_prod

# Container'ları temizle ve yeniden başlat
docker-compose -f docker-compose.local-prod.yml down
docker-compose -f docker-compose.local-prod.yml up -d --build
```

### Frontend API'ye Bağlanamıyor

1. Backend'in çalıştığını kontrol edin:
   ```bash
   docker ps | grep backend
   ```

2. `.env` dosyasını kontrol edin:
   ```bash
   cat frontend/.env
   ```

3. Browser cache'ini temizleyin (Cmd+Shift+R veya Ctrl+Shift+R)

4. Frontend'i yeniden başlatın:
   ```bash
   # Frontend terminal'inde Ctrl+C ile durdurun
   npm start
   ```

### Database Bağlantı Hatası

```bash
# Database'in healthy olduğunu kontrol et
docker ps

# Database log'larını kontrol et
docker logs budget_database_local_prod

# Database'e manuel bağlan
docker exec -it budget_database_local_prod psql -U postgres -d budget_app_local_prod
```

## 🔄 Servisleri Durdurma

```bash
# Backend ve Database'i durdur
./scripts/local/stop-local-dev.sh

# Frontend'i durdur (terminal'de Ctrl+C)
```

## 📝 Sonraki Adımlar

1. [LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md) - Detaylı geliştirme rehberi
2. [PROJECT_SPECIFICATIONS.md](PROJECT_SPECIFICATIONS.md) - Proje özellikleri
3. `docs/archive/` - Ek dokümanlar

## 💡 İpuçları

- Backend log'larını takip edin: `docker logs -f budget_backend_local_prod`
- Database değişikliklerini backup alarak yapın
- Production'a geçmeden önce tüm testleri çalıştırın
- Environment variable'ları asla commit etmeyin

## 🆘 Yardım

Sorun yaşıyorsanız:

1. Log dosyalarını kontrol edin
2. Docker container'ların durumunu kontrol edin
3. GitHub'da issue açın
4. Dokümanları tekrar okuyun

---

**Kurulum Tamamlandı!** 🎉

Artık geliştirmeye başlayabilirsiniz.
