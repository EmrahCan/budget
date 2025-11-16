# CI/CD Quick Start 🚀

Local'den Azure VM'e otomatik deployment için hızlı başlangıç rehberi.

## 🎯 Hedef

```
Local (macOS, Node.js) → Git Push → GitHub Actions → Azure VM (Docker)
```

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Setup Script'i Çalıştır

```bash
cd budget
./setup-cicd.sh
```

Script seni adım adım yönlendirecek:
- SSH key oluşturur
- Public key'i gösterir (Azure VM'e ekleyeceksin)
- Private key'i gösterir (GitHub Secrets'a ekleyeceksin)
- Bağlantıyı test eder
- Workflow'u commit eder

### 2. GitHub Secrets Ekle

GitHub'da: **Settings** → **Secrets and variables** → **Actions**

Eklenecek secrets:
- `SSH_PRIVATE_KEY` (script gösterecek)
- `VM_HOST` = `98.71.149.168`
- `VM_USER` = `obiwan`

### 3. Test Et

```bash
# Küçük bir değişiklik yap
echo "# CI/CD Test" >> README.md

# Commit ve push
git add README.md
git commit -m "test: CI/CD test"
git push origin main

# GitHub'da Actions tab'ından izle
```

## 📋 Nasıl Çalışır?

### Otomatik Deployment

`main` branch'e her push'ta:

1. ✅ GitHub Actions tetiklenir
2. ✅ Azure VM'e SSH ile bağlanır
3. ✅ `git pull origin main` yapar
4. ✅ Değişiklikleri algılar (backend/frontend)
5. ✅ Sadece değişen servisleri rebuild eder
6. ✅ Docker container'ları restart eder
7. ✅ Health check yapar
8. ✅ Sonucu raporlar

### Manuel Deployment

GitHub → **Actions** → **Deploy to Production** → **Run workflow**

## 🔍 Monitoring

### GitHub'da

Actions tab'ından real-time log'ları izle.

### Azure VM'de

```bash
ssh obiwan@98.71.149.168

# Container'ları kontrol et
docker ps

# Logları izle
docker logs budget_backend_prod -f
docker logs budget_frontend_prod -f
```

## 🛠️ Troubleshooting

### Deployment Başarısız Olursa

1. GitHub Actions log'larını kontrol et
2. Azure VM'e SSH ile bağlan
3. Manuel fix uygula:

```bash
cd ~/budget
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### SSH Bağlantı Hatası

```bash
# Public key'in Azure VM'de olduğunu kontrol et
ssh obiwan@98.71.149.168 "cat ~/.ssh/authorized_keys"

# GitHub Secrets'ı kontrol et
# Settings → Secrets → SSH_PRIVATE_KEY doğru mu?
```

## 📚 Detaylı Dokümantasyon

- **Tam Rehber:** [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)
- **Workflow Dosyası:** [.github/workflows/deploy-to-production.yml](.github/workflows/deploy-to-production.yml)

## ✅ Avantajlar

- ✅ **Otomatik:** Push yaptığında otomatik deploy
- ✅ **Hızlı:** Sadece değişen servisler rebuild edilir
- ✅ **Güvenli:** SSH key authentication
- ✅ **İzlenebilir:** GitHub Actions log'ları
- ✅ **Rollback:** Git history ile kolayca geri dönülebilir

## 🎉 Başarılı Kurulum Sonrası

Artık sadece:

```bash
git add .
git commit -m "feat: yeni özellik"
git push origin main
```

Geri kalanını GitHub Actions halleder! 🚀

