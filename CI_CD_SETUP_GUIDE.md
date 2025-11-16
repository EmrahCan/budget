# CI/CD Pipeline Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, local geliştirme ortamından Azure VM production ortamına otomatik deployment için GitHub Actions CI/CD pipeline'ı kurmayı anlatır.

### Ortamlar

- **Local (Development):** macOS, Node.js direkt çalışıyor (Docker yok)
- **Production:** Azure VM (98.71.149.168), Docker Compose ile çalışıyor

### Workflow

```
Local Development → Git Push → GitHub Actions → Azure VM Docker Deploy
```

## 🔧 Kurulum Adımları

### 1. SSH Key Oluştur (Eğer yoksa)

Local makinende:

```bash
# SSH key oluştur
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Public key'i kopyala
cat ~/.ssh/github_actions_deploy.pub
```

### 2. Azure VM'e SSH Key Ekle

Azure VM'de:

```bash
# SSH dizinine git
cd ~/.ssh

# Authorized keys dosyasını düzenle
nano authorized_keys

# Public key'i (yukarıda kopyaladığın) dosyanın sonuna ekle
# Kaydet ve çık (CTRL+X, Y, Enter)

# İzinleri kontrol et
chmod 600 authorized_keys
chmod 700 ~/.ssh
```

### 3. GitHub Secrets Ekle

GitHub repository'de:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

2. Şu secret'ları ekle:

   **SSH_PRIVATE_KEY:**
   ```bash
   # Local'de private key'i kopyala
   cat ~/.ssh/github_actions_deploy
   ```
   Tüm içeriği (-----BEGIN ... END----- dahil) kopyala ve GitHub'a yapıştır.

   **VM_HOST:**
   ```
   98.71.149.168
   ```

   **VM_USER:**
   ```
   obiwan
   ```

### 4. GitHub Actions Workflow Dosyasını Kontrol Et

Dosya zaten oluşturuldu: `.github/workflows/deploy-to-production.yml`

Bu workflow:
- `main` branch'e push olduğunda otomatik çalışır
- Manuel olarak da tetiklenebilir (Actions tab'ından)
- Backend veya frontend değişikliklerini algılar
- Sadece değişen servisleri rebuild eder
- Health check yapar
- Deployment sonucunu raporlar

## 🚀 Kullanım

### Otomatik Deployment

```bash
# Local'de değişiklik yap
git add .
git commit -m "feat: yeni özellik eklendi"
git push origin main

# GitHub Actions otomatik olarak deployment başlatır
# İlerlemeyi GitHub'da Actions tab'ından izleyebilirsin
```

### Manuel Deployment

1. GitHub repository'ye git
2. **Actions** tab'ına tıkla
3. **Deploy to Production (Azure VM)** workflow'unu seç
4. **Run workflow** butonuna tıkla
5. Branch seç (main)
6. **Run workflow** ile başlat

## 📊 Deployment Süreci

### Backend Değişikliği Olduğunda

```bash
1. Git pull origin main
2. Docker image rebuild (backend)
3. Container restart (budget_backend_prod)
4. Health check (http://localhost:5001/health)
5. Logs kontrolü
```

### Frontend Değişikliği Olduğunda

```bash
1. Git pull origin main
2. Docker image rebuild (frontend)
3. Container restart (budget_frontend_prod)
4. Health check
5. Logs kontrolü
```

### Her İki Değişiklik Olduğunda

Her iki servis de sırayla rebuild edilir ve restart edilir.

## 🔍 Monitoring ve Troubleshooting

### GitHub Actions Loglarını İzle

1. GitHub → **Actions** tab
2. Son workflow run'ı seç
3. Her step'in loglarını incele

### Azure VM'de Manuel Kontrol

```bash
# SSH ile bağlan
ssh obiwan@98.71.149.168

# Container'ları kontrol et
docker ps

# Logları kontrol et
docker logs budget_backend_prod --tail 50
docker logs budget_frontend_prod --tail 50

# Health check
curl http://localhost:5001/health
```

### Deployment Başarısız Olursa

1. GitHub Actions loglarını kontrol et
2. Azure VM'e SSH ile bağlan
3. Container loglarını incele
4. Manuel olarak fix uygula:

```bash
cd ~/budget
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Güvenlik

### SSH Key Güvenliği

- Private key'i **asla** commit etme
- GitHub Secrets'ta sakla
- Düzenli olarak rotate et

### Environment Variables

Production environment variables Azure VM'de `.env` dosyalarında:

```bash
# Backend
~/budget/backend/.env

# Frontend
~/budget/frontend/.env.production
```

Bu dosyalar Git'e commit edilmemeli (`.gitignore`'da).

## 📝 Best Practices

### 1. Branch Strategy

```
main (production) ← Her push otomatik deploy
  ↑
develop (staging) ← Test ortamı için
  ↑
feature/* ← Yeni özellikler
```

### 2. Commit Messages

```bash
feat: yeni özellik eklendi
fix: bug düzeltildi
docs: dokümantasyon güncellendi
refactor: kod iyileştirmesi
test: test eklendi
```

### 3. Deployment Zamanlaması

- **Acil fix'ler:** Hemen deploy et
- **Yeni özellikler:** Düşük trafikli saatlerde (gece)
- **Büyük değişiklikler:** Hafta sonu

### 4. Rollback Stratejisi

Eğer deployment sorun çıkarırsa:

```bash
# Azure VM'de
cd ~/budget
git log --oneline -5
git checkout <previous-commit-hash>
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 🎯 Gelişmiş Özellikler (Opsiyonel)

### Slack/Discord Bildirimleri

Deployment sonuçlarını Slack/Discord'a gönder:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Staging Environment

Test ortamı için ayrı bir workflow:

```yaml
# .github/workflows/deploy-to-staging.yml
on:
  push:
    branches:
      - develop
```

### Database Migrations

Otomatik migration çalıştır:

```bash
# Workflow'a ekle
ssh $VM_USER@$VM_HOST << 'ENDSSH'
  cd ~/budget
  docker exec budget_backend_prod npm run migrate
ENDSSH
```

### Health Check Endpoints

Backend'e health check endpoint'leri ekle:

```javascript
// backend/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

## 📚 Kaynaklar

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSH Key Management](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## ✅ Checklist

Kurulum tamamlandıktan sonra kontrol et:

- [ ] SSH key oluşturuldu ve Azure VM'e eklendi
- [ ] GitHub Secrets eklendi (SSH_PRIVATE_KEY, VM_HOST, VM_USER)
- [ ] Workflow dosyası commit edildi
- [ ] Test deployment yapıldı
- [ ] Health check'ler çalışıyor
- [ ] Rollback stratejisi test edildi

---

**Son Güncelleme:** 16 Kasım 2024
**Durum:** ✅ Hazır

