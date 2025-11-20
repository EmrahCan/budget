# 🚀 Budget App - Deployment & Development

## 📖 Dokümantasyon

### 🔧 Development
- **[Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md)** - Local'de geliştirme için tam rehber

### 🚀 Deployment
- **[Deployment Problems Analysis](DEPLOYMENT_PROBLEMS_ANALYSIS.md)** - Production sorunlarının analizi ve çözümleri
- **[Cloudflare SSL Fix](CLOUDFLARE_SSL_FIX.md)** - SSL/TLS konfigürasyonu

### 📚 Diğer
- **[CI/CD Workflow](CI_CD_WORKFLOW_GUIDE.md)** - GitHub Actions ile otomatik deployment
- **[AI Features](AI_FEATURES_NOTE.md)** - AI özellikleri dokümantasyonu

---

## 🎯 Hızlı Başlangıç

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/EmrahCan/budget.git
cd budget

# 2. Environment setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Start database
docker-compose -f docker-compose.dev.yml up -d database

# 5. Start backend
cd backend && npm run dev

# 6. Start frontend (yeni terminal)
cd frontend && npm start
```

### Production Deployment

```bash
# VM'de
cd ~/budget
./deploy-to-production.sh
```

---

## 🔑 Önemli Dosyalar

### Deployment Scripts
- `deploy-to-production.sh` - Otomatik production deployment
- `rollback.sh` - Önceki versiyona geri dönme

### Docker Compose
- `docker-compose.dev.yml` - Local development
- `docker-compose.local-prod.yml` - Local production test
- `docker-compose.prod.yml` - Production

### Environment Files
- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template
- `backend/.env.production` - Production environment (gitignore)

---

## 🐛 Sorun Giderme

### Production'da sorun mu var?

1. **Container'ları kontrol et**
   ```bash
   docker ps
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Logları incele**
   ```bash
   docker logs budget_backend_prod --tail=100
   docker logs budget_frontend_prod --tail=100
   ```

3. **Health check**
   ```bash
   curl http://localhost:5001/health
   curl http://localhost:3000
   ```

4. **Rollback yap**
   ```bash
   ./rollback.sh backups/YYYYMMDD_HHMMSS
   ```

### Local'de sorun mu var?

[Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md#-troubleshooting) bölümüne bakın.

---

## 📊 Production Sorunları ve Çözümleri

### Sorun 1: Backend DB'ye bağlanamıyor
**Neden:** `DB_HOST=localhost` yerine `database` olmalı  
**Çözüm:** `backend/.env.production` dosyasında `DB_HOST=database`

### Sorun 2: Frontend Mixed Content hatası
**Neden:** HTTPS sayfada HTTP API çağrısı  
**Çözüm:** Frontend'de `REACT_APP_API_URL=https://budgetapp.site/api`

### Sorun 3: Port çakışması
**Neden:** PM2 veya başka process port kullanıyor  
**Çözüm:** `sudo lsof -i :5001` ile bulup `kill -9 <PID>`

### Sorun 4: SSL/TLS hatası
**Neden:** Cloudflare "Full" modda ama VM'de SSL yok  
**Çözüm:** Cloudflare'de "Flexible" moda geç veya SSL sertifikası kur

Detaylı analiz için: [Deployment Problems Analysis](DEPLOYMENT_PROBLEMS_ANALYSIS.md)

---

## 🔄 Deployment Workflow

```
Local Dev → Git Push → GitHub → Manual Deploy → Production
    ↓          ↓          ↓           ↓              ↓
  Test     Commit    Actions    VM Deploy      Health Check
```

### Adımlar:

1. **Local'de geliştir**
   ```bash
   # Değişiklik yap
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```

2. **VM'ye deploy et**
   ```bash
   ssh obiwan@98.71.149.168
   cd ~/budget
   ./deploy-to-production.sh
   ```

3. **Test et**
   - https://budgetapp.site
   - Login dene
   - Temel fonksiyonları test et

4. **Sorun varsa rollback**
   ```bash
   ./rollback.sh backups/YYYYMMDD_HHMMSS
   ```

---

## 🛡️ Best Practices

### Development
- ✅ Her zaman feature branch kullan
- ✅ Küçük, anlamlı commit'ler yap
- ✅ Commit message'larda convention kullan
- ✅ Local'de test et
- ✅ Code review yap

### Deployment
- ✅ Deployment öncesi backup al
- ✅ Health check'leri kontrol et
- ✅ Rollback planı hazır olsun
- ✅ Environment variables'ı doğrula
- ✅ Logları izle

### Security
- ✅ `.env` dosyalarını commit etme
- ✅ Secrets'ları güvenli sakla
- ✅ Production credentials'ları paylaşma
- ✅ SSL/TLS kullan
- ✅ CORS ayarlarını doğru yap

---

## 📞 Yardım

Sorun yaşıyorsan:

1. **Dokümantasyonu kontrol et**
   - [Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md)
   - [Deployment Problems Analysis](DEPLOYMENT_PROBLEMS_ANALYSIS.md)

2. **Logları incele**
   ```bash
   docker logs budget_backend_prod --tail=100
   ```

3. **GitHub Issues**
   - Mevcut issue'lara bak
   - Yeni issue aç

4. **Rollback yap**
   ```bash
   ./rollback.sh backups/YYYYMMDD_HHMMSS
   ```

---

## 🎉 Başarılı Deployment Kriterleri

- ✅ Tüm container'lar healthy
- ✅ Backend API yanıt veriyor
- ✅ Frontend erişilebilir
- ✅ Database bağlantısı çalışıyor
- ✅ Login işlemi başarılı
- ✅ CORS hataları yok
- ✅ SSL/TLS çalışıyor

---

**Happy Coding! 🚀**
