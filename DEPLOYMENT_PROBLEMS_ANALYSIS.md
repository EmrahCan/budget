# Production Deployment Sorunları - Kök Neden Analizi

## 🔴 Yaşanan Sorunlar

### 1. Backend DB Bağlantı Hatası
**Sorun:** Backend `localhost:5432` kullanıyor, Docker'da `database` olmalı
**Neden:** `.env.production` dosyasında `DB_HOST=localhost` yazıyordu
**Çözüm:** `DB_HOST=database` olarak değiştirildi

### 2. Frontend Mixed Content Hatası
**Sorun:** HTTPS sayfada HTTP API çağrısı
**Neden:** Frontend build'de `http://98.71.149.168:5001/api` hardcoded edilmişti
**Çözüm:** `https://budgetapp.site/api` olarak değiştirildi

### 3. Port Çakışması
**Sorun:** Port 5001 zaten kullanımda
**Neden:** PM2 ile çalışan eski backend instance vardı
**Çözüm:** PM2 durduruldu, sadece Docker kullanıldı

### 4. Nginx Konfigürasyon Çakışması
**Sorun:** 3 farklı Nginx config dosyası çakışıyordu
**Neden:** Farklı zamanlarda farklı config'ler oluşturulmuş
**Çözüm:** Eski config'ler silindi, tek config kullanıldı

### 5. SSL/TLS Sorunu
**Sorun:** Cloudflare HTTPS ile bağlanamıyor
**Neden:** VM'de SSL sertifikası yok, Cloudflare "Full" modda
**Çözüm:** Cloudflare "Flexible" moda alındı

---

## 🎯 Kök Nedenler

### 1. **Environment Variable Yönetimi Eksikliği**
- Local, staging, production için ayrı `.env` dosyaları yok
- Docker Compose'da environment variable'lar doğru yüklenmiyor
- Build-time vs runtime environment karışıklığı

### 2. **Deployment Stratejisi Yok**
- Manuel deployment yapılıyor
- Her seferinde farklı yöntem deneniyor
- Rollback planı yok
- Health check'ler yok

### 3. **Konfigürasyon Yönetimi Zayıf**
- Nginx config'leri versiyonlanmıyor
- Docker Compose dosyaları environment'a göre ayrılmamış
- Secrets yönetimi yok

### 4. **Test Eksikliği**
- Production'a geçmeden önce test edilmiyor
- Staging environment yok
- Smoke test'ler yok

### 5. **Dokümantasyon Eksikliği**
- Deployment adımları net değil
- Troubleshooting guide yok
- Rollback prosedürü yok

---

## ✅ Çözüm: Düzgün Deployment Stratejisi

### 1. Environment Yönetimi

```
budget/
├── backend/
│   ├── .env.example          # Template
│   ├── .env.development      # Local dev
│   ├── .env.production       # Production (gitignore)
│   └── .env.production.example  # Production template
├── frontend/
│   ├── .env.example
│   ├── .env.development
│   └── .env.production.example
```

### 2. Docker Compose Stratejisi

```
docker-compose.yml              # Base config
docker-compose.dev.yml          # Development overrides
docker-compose.prod.yml         # Production overrides
```

### 3. Deployment Pipeline

```
Local Dev → GitHub → Azure VM
    ↓          ↓         ↓
  Test    CI/CD    Auto Deploy
```

### 4. Health Checks

Her deployment sonrası:
- ✅ Database bağlantısı
- ✅ Backend API health
- ✅ Frontend erişimi
- ✅ CORS ayarları
- ✅ SSL/TLS

---

## 🚀 Önerilen Deployment Workflow

### A. Local Development
```bash
# 1. Değişiklikleri yap
# 2. Local'de test et
npm run dev

# 3. Commit ve push
git add .
git commit -m "feat: new feature"
git push origin main
```

### B. Production Deployment (Manuel)
```bash
# VM'de
cd ~/budget
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps  # Health check
```

### C. Production Deployment (Otomatik - Gelecek)
```bash
# GitHub Actions ile otomatik
# Push → Test → Build → Deploy → Health Check
```

---

## 🛡️ Önleyici Tedbirler

### 1. Pre-deployment Checklist
- [ ] Environment variables kontrol edildi
- [ ] Database migrations hazır
- [ ] Frontend build başarılı
- [ ] Backend testleri geçti
- [ ] CORS ayarları doğru
- [ ] SSL/TLS ayarları doğru

### 2. Deployment Script
```bash
#!/bin/bash
# deploy-to-production.sh

set -e  # Hata olursa dur

echo "🔍 Pre-deployment checks..."
# Environment check
# Database check
# Port check

echo "🚀 Deploying..."
# Pull latest code
# Build containers
# Run migrations
# Start services

echo "✅ Post-deployment checks..."
# Health checks
# Smoke tests

echo "✅ Deployment successful!"
```

### 3. Rollback Plan
```bash
#!/bin/bash
# rollback.sh

# Previous version'a dön
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📊 Monitoring

### Production'da İzlenmesi Gerekenler
1. **Container Health**
   ```bash
   docker ps
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Logs**
   ```bash
   docker logs budget_backend_prod --tail=100 -f
   docker logs budget_frontend_prod --tail=100 -f
   ```

3. **Resource Usage**
   ```bash
   docker stats
   ```

4. **Database Connections**
   ```bash
   docker exec budget_database_prod psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

---

## 🎓 Öğrenilen Dersler

1. **Environment variables her zaman Docker Compose'da tanımlanmalı**
2. **Build-time ve runtime environment'ları ayır**
3. **Her deployment öncesi health check yap**
4. **Tek bir deployment yöntemi kullan (PM2 veya Docker, ikisi birden değil)**
5. **Nginx config'lerini versiyonla**
6. **SSL/TLS ayarlarını baştan doğru yap**
7. **Rollback planı hazır olsun**

---

## 🔧 Hızlı Troubleshooting

### Backend çalışmıyor?
```bash
docker logs budget_backend_prod --tail=50
docker exec budget_backend_prod env | grep DB_
```

### Frontend API'ye ulaşamıyor?
```bash
# Browser console'da
console.log(process.env.REACT_APP_API_URL)

# VM'de
curl http://localhost:5001/health
```

### Database bağlantı hatası?
```bash
docker exec budget_backend_prod ping database
docker exec budget_database_prod pg_isready -U postgres
```

### Port çakışması?
```bash
sudo lsof -i :5001
sudo lsof -i :3000
```

---

## 📝 Sonraki Adımlar

1. ✅ Environment variable yönetimini düzelt
2. ✅ Deployment script'i oluştur
3. ✅ Health check script'i ekle
4. ⏳ GitHub Actions CI/CD kur
5. ⏳ Monitoring ekle (Prometheus/Grafana)
6. ⏳ Automated backup sistemi kur

---

**Özet:** Sorunların temel nedeni environment yönetimi ve deployment stratejisi eksikliği. Bunları düzelterek stabil bir production ortamı oluşturabiliriz.
