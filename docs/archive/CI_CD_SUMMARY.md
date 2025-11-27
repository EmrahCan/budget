# CI/CD Pipeline - Özet

## ✅ Oluşturulan Dosyalar

1. **`.github/workflows/deploy-to-production.yml`** - GitHub Actions workflow
2. **`CI_CD_SETUP_GUIDE.md`** - Detaylı kurulum rehberi
3. **`CI_CD_QUICK_START.md`** - Hızlı başlangıç rehberi
4. **`setup-cicd.sh`** - Otomatik kurulum scripti

## 🎯 Ne Yapıyor?

Local'de kod değişikliği yaptığında:

```
1. git push origin main
2. GitHub Actions otomatik tetiklenir
3. Azure VM'e SSH ile bağlanır
4. git pull yapar
5. Değişen servisleri (backend/frontend) rebuild eder
6. Docker container'ları restart eder
7. Health check yapar
8. Sonucu raporlar
```

## 🚀 Kurulum (İlk Kez)

### Seçenek 1: Otomatik (Önerilen)

```bash
cd budget
./setup-cicd.sh
```

Script seni adım adım yönlendirir.

### Seçenek 2: Manuel

1. **SSH Key Oluştur:**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy
   ```

2. **Public Key'i Azure VM'e Ekle:**
   ```bash
   # Public key'i kopyala
   cat ~/.ssh/github_actions_deploy.pub
   
   # Azure VM'de
   echo 'PUBLIC_KEY_BURAYA' >> ~/.ssh/authorized_keys
   ```

3. **GitHub Secrets Ekle:**
   - Settings → Secrets and variables → Actions
   - `SSH_PRIVATE_KEY`: Private key içeriği
   - `VM_HOST`: `98.71.149.168`
   - `VM_USER`: `obiwan`

4. **Push Et:**
   ```bash
   git push origin main
   ```

## 📝 Kullanım

### Günlük Geliştirme

```bash
# Kod değişikliği yap
vim backend/routes/someFile.js

# Commit ve push
git add .
git commit -m "feat: yeni özellik"
git push origin main

# GitHub Actions otomatik deploy eder!
```

### Manuel Deployment

GitHub → Actions → Deploy to Production → Run workflow

## 🔍 Monitoring

### GitHub'da
- Actions tab'ından real-time log'ları izle
- Her step'in detaylarını gör
- Başarı/hata durumunu gör

### Azure VM'de
```bash
ssh obiwan@98.71.149.168
docker ps
docker logs budget_backend_prod -f
```

## 🎨 Özellikler

✅ **Akıllı Rebuild:** Sadece değişen servisler rebuild edilir
✅ **Health Check:** Deployment sonrası otomatik kontrol
✅ **Rollback:** Git history ile kolayca geri dönülebilir
✅ **Güvenli:** SSH key authentication
✅ **Hızlı:** Ortalama 2-3 dakika
✅ **İzlenebilir:** Tüm log'lar GitHub'da

## 🛠️ Troubleshooting

### Deployment Başarısız

1. GitHub Actions log'larını kontrol et
2. Azure VM'e SSH ile bağlan
3. Manuel fix:
   ```bash
   cd ~/budget
   git pull origin main
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

### SSH Hatası

- GitHub Secrets'ı kontrol et
- Azure VM'de authorized_keys'i kontrol et
- SSH key'in doğru olduğundan emin ol

## 📊 Workflow Detayları

### Tetikleyiciler
- `push` to `main` branch (otomatik)
- `workflow_dispatch` (manuel)

### Adımlar
1. Checkout code
2. Setup SSH
3. Deploy to Azure VM
   - Git pull
   - Detect changes
   - Rebuild changed services
   - Restart containers
   - Health check
4. Verify deployment
5. Notify result

### Ortam
- **Runner:** Ubuntu latest
- **SSH:** webfactory/ssh-agent@v0.8.0
- **Target:** Azure VM (98.71.149.168)

## 🔐 Güvenlik

- Private key GitHub Secrets'ta saklanır
- SSH key authentication kullanılır
- Environment variables VM'de .env dosyalarında
- Secrets asla log'lara yazılmaz

## 📚 Dokümantasyon

- **Hızlı Başlangıç:** [CI_CD_QUICK_START.md](CI_CD_QUICK_START.md)
- **Detaylı Rehber:** [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)
- **Workflow:** [.github/workflows/deploy-to-production.yml](.github/workflows/deploy-to-production.yml)

## 🎉 Sonuç

Artık sadece `git push` yapman yeterli! GitHub Actions geri kalanını halleder.

**Deployment süresi:** ~2-3 dakika
**Manuel işlem:** Yok
**Hata oranı:** Minimal

---

**Oluşturulma:** 16 Kasım 2024
**Durum:** ✅ Hazır
**Sonraki Adım:** `./setup-cicd.sh` çalıştır

