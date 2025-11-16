# CI/CD Başlangıç Rehberi - Adım Adım

## 🎯 Hedef

Local'de kod yaz → Git push yap → Otomatik olarak Azure VM'e deploy olsun

## 📋 Ön Hazırlık (Tek Seferlik)

### Adım 1: SSH Key Oluştur

Terminal'de (local makinende):

```bash
cd ~/ButceAPP/budget
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**Sorular:**
- "Enter passphrase": Boş bırak, Enter'a bas
- "Enter same passphrase again": Yine Enter'a bas

✅ İki dosya oluşturuldu:
- `~/.ssh/github_actions_deploy` (private key - GİZLİ)
- `~/.ssh/github_actions_deploy.pub` (public key - paylaşılabilir)

---

### Adım 2: Public Key'i Azure VM'e Ekle

**2.1. Public key'i kopyala:**

```bash
cat ~/.ssh/github_actions_deploy.pub
```

Çıktıyı kopyala (ssh-ed25519 ile başlayan tüm satır)

**2.2. Azure VM'e SSH yap:**

```bash
ssh obiwan@98.71.149.168
```

**2.3. Public key'i ekle:**

```bash
echo 'BURAYA_KOPYALADIGIN_PUBLIC_KEY_YAPISTIR' >> ~/.ssh/authorized_keys
```

**2.4. İzinleri kontrol et:**

```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**2.5. Çık:**

```bash
exit
```

---

### Adım 3: SSH Bağlantısını Test Et

Local'de:

```bash
ssh -i ~/.ssh/github_actions_deploy obiwan@98.71.149.168 "echo 'Bağlantı başarılı!'"
```

✅ "Bağlantı başarılı!" yazısını görmelisin.

❌ Hata alırsan: Public key'i doğru kopyaladığından emin ol.

---

### Adım 4: GitHub'a Private Key Ekle

**4.1. Private key'i kopyala:**

```bash
cat ~/.ssh/github_actions_deploy
```

Tüm içeriği kopyala (-----BEGIN ... END----- dahil)

**4.2. GitHub'a git:**

1. Tarayıcıda: https://github.com/EmrahCan/budget
2. **Settings** (sağ üstte)
3. Sol menüden: **Secrets and variables** → **Actions**
4. **New repository secret** butonuna tıkla

**4.3. İlk secret'ı ekle:**

- Name: `SSH_PRIVATE_KEY`
- Secret: Kopyaladığın private key'i yapıştır (tüm içerik)
- **Add secret** butonuna tıkla

**4.4. İkinci secret'ı ekle:**

- **New repository secret** butonuna tıkla
- Name: `VM_HOST`
- Secret: `98.71.149.168`
- **Add secret**

**4.5. Üçüncü secret'ı ekle:**

- **New repository secret** butonuna tıkla
- Name: `VM_USER`
- Secret: `obiwan`
- **Add secret**

✅ Toplam 3 secret olmalı:
- SSH_PRIVATE_KEY
- VM_HOST
- VM_USER

---

### Adım 5: Değişiklikleri GitHub'a Push Et

Local'de:

```bash
cd ~/ButceAPP/budget

# Tüm değişiklikleri ekle
git add .

# Commit yap
git commit -m "ci: CI/CD pipeline ve admin routes UUID fix"

# GitHub'a push et
git push origin main
```

---

## 🎉 Kurulum Tamamlandı!

Artık her `git push origin main` yaptığında:

1. ✅ GitHub Actions otomatik tetiklenir
2. ✅ Azure VM'e SSH ile bağlanır
3. ✅ `git pull` yapar
4. ✅ Değişen servisleri rebuild eder
5. ✅ Container'ları restart eder
6. ✅ Health check yapar

---

## 📊 İlk Deployment'ı İzle

**1. GitHub'da Actions tab'ına git:**

https://github.com/EmrahCan/budget/actions

**2. En üstteki workflow'u tıkla:**

"ci: CI/CD pipeline ve admin routes UUID fix" gibi bir isim göreceksin

**3. İçine gir ve adımları izle:**

- ✅ Checkout code
- ✅ Setup SSH
- ✅ Deploy to Azure VM
- ✅ Verify Deployment

**4. Her adımı tıklayarak log'ları görebilirsin**

---

## 🚀 Günlük Kullanım (Artık Çok Basit!)

### Senaryo: Backend'de bir değişiklik yaptın

```bash
# 1. Dosyayı düzenle
vim backend/routes/someFile.js

# 2. Değişiklikleri kaydet ve test et (local'de)
# Backend ve frontend'i test et

# 3. Git'e ekle
git add backend/routes/someFile.js

# 4. Commit yap
git commit -m "fix: şifre reset sorunu düzeltildi"

# 5. Push yap
git push origin main

# 6. GitHub Actions'da izle (opsiyonel)
# https://github.com/EmrahCan/budget/actions
```

**O kadar! 🎉**

GitHub Actions otomatik olarak:
- Azure VM'e bağlanır
- Kodu çeker
- Backend'i rebuild eder
- Container'ı restart eder
- Health check yapar

**2-3 dakika sonra production'da!**

---

## 🔍 Deployment Durumunu Kontrol Et

### GitHub'da

https://github.com/EmrahCan/budget/actions

- ✅ Yeşil tik: Başarılı
- ❌ Kırmızı X: Hata var
- 🟡 Sarı nokta: Devam ediyor

### Azure VM'de

```bash
ssh obiwan@98.71.149.168

# Container'ları kontrol et
docker ps

# Backend loglarını izle
docker logs budget_backend_prod --tail 50

# Frontend loglarını izle
docker logs budget_frontend_prod --tail 50
```

---

## 🛠️ Sorun Giderme

### Deployment Başarısız Olursa

**1. GitHub Actions log'larını kontrol et:**

- Actions tab'ına git
- Başarısız workflow'u tıkla
- Kırmızı X olan adımı tıkla
- Hata mesajını oku

**2. Yaygın hatalar:**

**SSH Bağlantı Hatası:**
```
Permission denied (publickey)
```
**Çözüm:** Public key'in Azure VM'de olduğunu kontrol et

**Git Pull Hatası:**
```
error: Your local changes would be overwritten
```
**Çözüm:** Azure VM'de manuel değişiklik yapılmış, temizle:
```bash
ssh obiwan@98.71.149.168
cd ~/budget
git reset --hard origin/main
```

**Docker Build Hatası:**
```
Error building image
```
**Çözüm:** Syntax hatası var, local'de test et

---

## 📝 İpuçları

### Commit Mesajları

İyi commit mesajları yaz:

```bash
# ✅ İyi
git commit -m "fix: kullanıcı şifre reset sorunu düzeltildi"
git commit -m "feat: yeni ödeme raporu eklendi"
git commit -m "refactor: account controller optimize edildi"

# ❌ Kötü
git commit -m "fix"
git commit -m "değişiklikler"
git commit -m "test"
```

### Deployment Zamanlaması

- **Küçük fix'ler:** Hemen push et
- **Büyük özellikler:** Gece veya hafta sonu
- **Acil fix'ler:** Hemen push et, sonra izle

### Test Etmeyi Unutma

Push etmeden önce local'de test et:

```bash
# Backend test
curl http://localhost:5001/health

# Frontend test
# Tarayıcıda: http://localhost:3002
```

---

## 🎯 Özet

### Tek Seferlik Kurulum (Bugün)

1. ✅ SSH key oluştur
2. ✅ Public key'i Azure VM'e ekle
3. ✅ Private key'i GitHub Secrets'a ekle
4. ✅ Push et

### Günlük Kullanım (Her Gün)

1. Kod yaz
2. Test et (local)
3. `git add .`
4. `git commit -m "mesaj"`
5. `git push origin main`
6. GitHub Actions halleder! ☕

---

## 🆘 Yardım

Sorun olursa:

1. GitHub Actions log'larını kontrol et
2. Azure VM'de manuel kontrol yap
3. Bu dokümana bak: `CI_CD_SETUP_GUIDE.md`

---

**Hazırsın! Artık profesyonel bir CI/CD pipeline'ın var! 🚀**

