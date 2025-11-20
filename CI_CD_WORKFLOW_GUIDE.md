# 🔄 CI/CD Workflow Rehberi

## Branch Stratejisi

### `test` Branch → Local Test Ortamı
- **Amaç:** Geliştirme ve test
- **Ortam:** Local Docker (localhost:3001)
- **Otomatik Deploy:** Hayır (manuel local test)
- **Workflow:** `.github/workflows/deploy-to-test.yml`

### `main` Branch → Production Ortamı
- **Amaç:** Canlı production
- **Ortam:** Azure VM (98.71.149.168)
- **Otomatik Deploy:** Evet
- **Workflow:** `.github/workflows/deploy-to-production.yml`

## 🔄 Geliştirme Akışı

### 1. Yeni Özellik Geliştirme

```bash
# Test branch'e geç
git checkout test

# Değişikliklerini yap
# ... kod değişiklikleri ...

# Commit ve push
git add .
git commit -m "feat: yeni özellik eklendi"
git push origin test
```

**Ne Olur:**
- ✅ GitHub Actions otomatik testleri çalıştırır
- ✅ Build kontrolü yapar
- ℹ️ Local'de test etmen için bildirim gönderir

### 2. Local'de Test Et

```bash
# Test branch'i pull et
git pull origin test

# Local test ortamını başlat
cd budget
docker-compose -f docker-compose.local-prod.yml down
docker-compose -f docker-compose.local-prod.yml up -d --build

# Test et
# Frontend: http://localhost:3001
# Backend: http://localhost:5002
```

**Test Checklist:**
- [ ] Login çalışıyor mu?
- [ ] Yeni özellik çalışıyor mu?
- [ ] Mevcut özellikler bozulmadı mı?
- [ ] Console'da hata var mı?
- [ ] API çağrıları başarılı mı?

### 3. Production'a Deploy

Test başarılıysa main'e merge et:

```bash
# Main branch'e geç
git checkout main

# Test branch'i merge et
git merge test

# Production'a push et
git push origin main
```

**Ne Olur:**
- 🚀 GitHub Actions otomatik deploy başlar
- 🔄 Azure VM'de Docker container'lar güncellenir
- ✅ Health check'ler yapılır
- 🌐 Production güncellenmiş olur

## 📊 Workflow Detayları

### Test Branch Workflow

**Tetikleme:**
```yaml
on:
  push:
    branches:
      - test
```

**Adımlar:**
1. ✅ Code checkout
2. ✅ Backend testleri çalıştır
3. ✅ Frontend testleri çalıştır
4. ✅ Build kontrolü
5. ℹ️ Local test bildirimi

**Süre:** ~2-3 dakika

### Main Branch Workflow

**Tetikleme:**
```yaml
on:
  push:
    branches:
      - main
```

**Adımlar:**
1. ✅ Code checkout
2. 🔐 SSH bağlantısı kur
3. 📥 Azure VM'de git pull
4. 🔍 Değişiklikleri tespit et
5. 🔄 Backend rebuild (gerekirse)
6. 🔄 Frontend rebuild (gerekirse)
7. ✅ Health check
8. 📊 Durum raporu

**Süre:** ~5-10 dakika

## 🔐 GitHub Secrets

Production deploy için gerekli secrets:

```
SSH_PRIVATE_KEY: Azure VM SSH private key
VM_HOST: 98.71.149.168
VM_USER: obiwan
```

**Secrets'ı Eklemek İçin:**
1. GitHub repo → Settings → Secrets and variables → Actions
2. "New repository secret" tıkla
3. Secret'ları ekle

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hızlı Bug Fix

```bash
# Test branch'de fix yap
git checkout test
# ... fix ...
git commit -m "fix: kritik bug düzeltildi"
git push origin test

# Local'de test et
docker-compose -f docker-compose.local-prod.yml up -d --build

# Başarılıysa hemen production'a al
git checkout main
git merge test
git push origin main
```

### Senaryo 2: Büyük Özellik Geliştirme

```bash
# Feature branch oluştur
git checkout -b feature/yeni-ozellik test

# Geliştir
# ... kod ...
git commit -m "feat: yeni özellik"

# Test branch'e merge et
git checkout test
git merge feature/yeni-ozellik
git push origin test

# Local'de kapsamlı test et
docker-compose -f docker-compose.local-prod.yml up -d --build

# Test başarılıysa main'e al
git checkout main
git merge test
git push origin main
```

### Senaryo 3: Hotfix (Acil Düzeltme)

```bash
# Main'den hotfix branch oluştur
git checkout main
git checkout -b hotfix/acil-duzeltme

# Fix yap
# ... kod ...
git commit -m "hotfix: acil güvenlik düzeltmesi"

# Hem test hem main'e merge et
git checkout test
git merge hotfix/acil-duzeltme
git push origin test

git checkout main
git merge hotfix/acil-duzeltme
git push origin main  # Otomatik deploy başlar
```

## 📋 Deployment Checklist

### Test Branch'e Push Öncesi
- [ ] Kod değişiklikleri tamamlandı
- [ ] Local'de çalıştığı doğrulandı
- [ ] Commit mesajı açıklayıcı

### Main Branch'e Merge Öncesi
- [ ] Test branch'de test edildi
- [ ] Local test ortamında sorun yok
- [ ] Breaking change var mı kontrol edildi
- [ ] Database migration gerekiyor mu kontrol edildi
- [ ] Environment variable değişikliği var mı kontrol edildi

### Production Deploy Sonrası
- [ ] GitHub Actions başarılı mı?
- [ ] Production health check geçti mi?
- [ ] Frontend erişilebilir mi? (http://98.71.149.168:3000)
- [ ] Backend API çalışıyor mu? (http://98.71.149.168:5001/health)
- [ ] Temel özellikler test edildi mi?

## 🚨 Sorun Giderme

### GitHub Actions Başarısız

```bash
# Logs'u kontrol et
# GitHub → Actions → Failed workflow → Logs

# Local'de aynı adımları test et
npm ci
npm test
npm run build
```

### Production Deploy Başarısız

```bash
# Azure VM'e bağlan
ssh obiwan@98.71.149.168

# Container durumunu kontrol et
cd ~/budget
docker-compose -f docker-compose.prod.yml ps

# Logs'u kontrol et
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Manuel restart
docker-compose -f docker-compose.prod.yml restart
```

### Rollback (Geri Alma)

```bash
# Azure VM'de
ssh obiwan@98.71.149.168
cd ~/budget

# Önceki commit'e dön
git log --oneline  # Commit hash'i bul
git reset --hard <commit-hash>

# Container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📊 Monitoring

### GitHub Actions

- **Workflow Runs:** GitHub → Actions
- **Status Badge:** README'ye eklenebilir
- **Email Notifications:** Settings → Notifications

### Production Health

```bash
# Backend health
curl http://98.71.149.168:5001/health

# Frontend
curl http://98.71.149.168:3000

# Container status
ssh obiwan@98.71.149.168 "docker ps"
```

## 🎓 Best Practices

1. **Küçük, Sık Commit'ler**
   - Her özellik için ayrı commit
   - Açıklayıcı commit mesajları

2. **Test Branch'de Test Et**
   - Hiçbir zaman doğrudan main'e push yapma
   - Her değişikliği önce test branch'de test et

3. **Semantic Commit Messages**
   ```
   feat: yeni özellik
   fix: bug düzeltme
   docs: dokümantasyon
   style: formatting
   refactor: kod iyileştirme
   test: test ekleme
   chore: bakım işleri
   ```

4. **Database Migration'lar**
   - Migration script'lerini test branch'de test et
   - Production'da manuel çalıştır
   - Backup al

5. **Environment Variables**
   - Değişiklik varsa önce Azure VM'de güncelle
   - Sonra deploy yap

## 📝 Özet

**Test Branch:**
- Local'de geliştirme ve test
- Otomatik testler çalışır
- Manuel local test gerekir

**Main Branch:**
- Production deploy
- Otomatik Azure VM'e deploy
- Health check'ler otomatik

**Akış:**
```
Geliştirme → test branch → Local test → main branch → Production
```

---

**Hazır!** Artık CI/CD yapınız kurulu. Test branch'de geliştir, main branch'e merge et, otomatik deploy olsun! 🚀
