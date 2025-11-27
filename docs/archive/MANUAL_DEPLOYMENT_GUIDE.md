# 📘 Manual Deployment Guide

## Overview

GitHub Actions otomatik deployment'ı devre dışı bırakıldı. Artık production'a manuel deployment yapıyoruz.

## 🚀 Quick Start

### 1. GitHub Actions'ı Devre Dışı Bırak

```bash
cd budget
./disable-github-actions.sh
git add .github/workflows/
git commit -m "Disable auto-deployment"
git push origin main
```

### 2. Production'a Deploy Et

```bash
./manual-deploy-to-production.sh
```

Bu script:
- ✅ Azure VM'e SSH ile bağlanır
- ✅ Git'ten son değişiklikleri çeker
- ✅ Değişen servisleri rebuild eder (backend/frontend)
- ✅ Container'ları sırayla restart eder
- ✅ Nginx konfigürasyonunu kontrol eder
- ✅ Health check'leri çalıştırır

### 3. Dark Mode'u Kontrol Et

```bash
./check-production-dark-mode.sh
```

Bu script:
- ✅ ThemeContext.js dosyasının production'da olduğunu kontrol eder
- ✅ Dark mode'un default olduğunu doğrular
- ✅ Frontend container'ının çalıştığını kontrol eder
- ✅ Frontend'in erişilebilir olduğunu test eder

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Local'de değişiklikleri test et
- [ ] Git'e commit ve push yap
- [ ] Production backup'ı al (opsiyonel)

### Deployment

- [ ] `./manual-deploy-to-production.sh` çalıştır
- [ ] Script'in başarıyla tamamlandığını doğrula
- [ ] Container'ların çalıştığını kontrol et

### Post-Deployment

- [ ] Browser'da http://98.71.149.168:3000 aç
- [ ] Dark mode'un çalıştığını kontrol et
- [ ] Login fonksiyonunu test et
- [ ] Tüm sayfaların yüklendiğini kontrol et

## 🔧 Troubleshooting

### Problem: Frontend dark mode çalışmıyor

**Çözüm 1: Frontend'i rebuild et**
```bash
ssh obiwan@98.71.149.168
# Password: Eben2010++**++

cd ~/budget
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

**Çözüm 2: Browser cache'i temizle**
- Browser'da F12 aç
- Application/Storage → Clear site data
- Sayfayı yenile

### Problem: 502 Bad Gateway

**Çözüm: Nginx'i kontrol et**
```bash
ssh obiwan@98.71.149.168

# Nginx durumunu kontrol et
sudo systemctl status nginx

# Nginx yoksa kur
sudo apt update && sudo apt install -y nginx

# Konfigürasyonu oluştur
cd ~/budget
./QUICK_FIX_NOW.sh
```

### Problem: Backend çalışmıyor

**Çözüm: Backend'i restart et**
```bash
ssh obiwan@98.71.149.168

cd ~/budget
docker-compose -f docker-compose.prod.yml restart backend
docker logs budget_backend_prod --tail 50
```

### Problem: Database bağlantı hatası

**Çözüm: Database'i restart et**
```bash
ssh obiwan@98.71.149.168

cd ~/budget
docker-compose -f docker-compose.prod.yml restart database
docker logs budget_database_prod --tail 50
```

## 🌐 Access URLs

- **Direct Frontend**: http://98.71.149.168:3000
- **Direct Backend**: http://98.71.149.168:5001
- **Via Nginx** (if configured): http://budgetapp.site

## 📊 Monitoring Commands

### Check Container Status
```bash
ssh obiwan@98.71.149.168
cd ~/budget
docker-compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# Backend logs
docker logs budget_backend_prod --tail 100 -f

# Frontend logs
docker logs budget_frontend_prod --tail 100 -f

# Database logs
docker logs budget_database_prod --tail 100 -f
```

### Check Health
```bash
# Backend health
curl http://localhost:5001/health

# Frontend
curl http://localhost:3000

# Via Nginx
curl http://localhost/api/health
```

## 🔄 Rollback Procedure

If deployment fails:

```bash
ssh obiwan@98.71.149.168
cd ~/budget

# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Deployment Log

Keep track of deployments:

| Date | Time | Changes | Status | Notes |
|------|------|---------|--------|-------|
| 2024-11-19 | 14:30 | Dark mode added | ✅ Success | - |
| | | | | |

## 🔐 Credentials

**Azure VM SSH:**
- Host: 98.71.149.168
- User: obiwan
- Password: Eben2010++**++

**Database:**
- Host: localhost:5432 (from VM)
- Database: budget_app_prod
- User: postgres
- Password: 9Ht03GrRP7iK8zOgQrKC9br7w4jpcutn

## 📞 Emergency Contacts

If something goes wrong:
1. Check logs first
2. Try restart containers
3. Check this guide's troubleshooting section
4. SSH to VM and investigate manually

## 🎯 Best Practices

1. **Always test locally first**
2. **Deploy during low-traffic hours**
3. **Keep deployment logs**
4. **Monitor for 10 minutes after deployment**
5. **Have rollback plan ready**

## 📚 Related Files

- `manual-deploy-to-production.sh` - Main deployment script
- `check-production-dark-mode.sh` - Dark mode verification
- `disable-github-actions.sh` - Disable auto-deployment
- `QUICK_FIX_NOW.sh` - Emergency fix script
- `diagnose-production-502.sh` - Diagnostic script
