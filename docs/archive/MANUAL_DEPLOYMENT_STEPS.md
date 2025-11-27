# 🚀 Manuel Deployment Adımları - i18n (Multi-Language Support)

## Ön Hazırlık

Local'de değişiklikler zaten commit edildi ve GitHub'a push edildi.

## Production'a Deployment

### 1️⃣ Production Sunucuya Bağlan

```bash
ssh azureuser@budgetapp.site
# veya IP ile:
# ssh azureuser@<AZURE_VM_IP>
```

### 2️⃣ Proje Dizinine Git

```bash
cd /home/azureuser/budget-app
```

### 3️⃣ Git Pull Yap

```bash
git status
git pull origin main
```

**Beklenen çıktı:** "feat: Add multi-language support" commit'i çekilmeli

### 4️⃣ Backend Dependencies Yükle

```bash
cd backend
npm install --production
```

**Yeni paket:** `i18n` paketi yüklenecek

### 5️⃣ Frontend Dependencies Yükle

```bash
cd ../frontend
npm install --legacy-peer-deps
```

**Yeni paketler:** 
- `react-i18next`
- `i18next`
- `i18next-browser-languagedetector`

### 6️⃣ Frontend Build Yap

```bash
REACT_APP_API_URL=https://budgetapp.site/api npm run build
```

**Süre:** ~2-3 dakika

### 7️⃣ Docker Containers'ı Yeniden Başlat

```bash
cd /home/azureuser/budget-app
sudo docker-compose down
sudo docker-compose up -d
```

### 8️⃣ Container Durumunu Kontrol Et

```bash
sudo docker-compose ps
```

**Beklenen:** Tüm container'lar "Up" durumunda olmalı

### 9️⃣ Logları Kontrol Et

```bash
# Backend logları
sudo docker-compose logs -f backend

# Frontend logları (başka terminal'de)
sudo docker-compose logs -f frontend
```

**Ctrl+C** ile çık

### 🔟 Health Check

```bash
# Backend
curl https://budgetapp.site/health

# Frontend
curl https://budgetapp.site | grep title
```

---

## ✅ Test Etme

### Tarayıcıda Test

1. **Aç:** https://budgetapp.site
2. **Login ol:** test@local.com / Test123!
3. **Dil değiştir:** Sağ üstteki 🌐 ikonuna tıkla
4. **Kontrol et:** 
   - Türkçe → English geçişi çalışıyor mu?
   - Tüm metinler çevriliyor mu?
   - Sayfa yenilendiğinde dil korunuyor mu?

### API Test

```bash
# Türkçe header ile
curl -H "Accept-Language: tr" https://budgetapp.site/api/auth/login

# İngilizce header ile
curl -H "Accept-Language: en" https://budgetapp.site/api/auth/login
```

---

## 🐛 Sorun Giderme

### Problem: Git pull çalışmıyor

```bash
# Değişiklikleri kontrol et
git status

# Local değişiklikler varsa stash yap
git stash

# Tekrar pull
git pull origin main

# Stash'i geri al (gerekirse)
git stash pop
```

### Problem: npm install hata veriyor

```bash
# Cache temizle
npm cache clean --force

# node_modules sil ve tekrar yükle
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Problem: Frontend build hata veriyor

```bash
# Build cache temizle
rm -rf build node_modules/.cache

# Tekrar build
REACT_APP_API_URL=https://budgetapp.site/api npm run build
```

### Problem: Docker containers başlamıyor

```bash
# Tüm containers'ı durdur
sudo docker-compose down

# Volumes ile birlikte temizle (DİKKAT: Veritabanı silinir!)
# sudo docker-compose down -v

# Tekrar başlat
sudo docker-compose up -d

# Logları izle
sudo docker-compose logs -f
```

### Problem: Dil değiştirme çalışmıyor

```bash
# Browser cache temizle
# Tarayıcıda: Ctrl+Shift+R (Hard refresh)

# localStorage kontrol et
# Browser Console'da:
# localStorage.getItem('i18nextLng')
```

---

## 📊 Deployment Özeti

### Eklenen Dosyalar

**Frontend:**
- `frontend/src/i18n/config.js` - i18n yapılandırması
- `frontend/src/i18n/locales/tr.json` - Türkçe çeviriler
- `frontend/src/i18n/locales/en.json` - İngilizce çeviriler
- `frontend/src/components/common/LanguageSwitcher.js` - Dil değiştirme komponenti

**Backend:**
- `backend/locales/tr.json` - Backend Türkçe mesajlar (ileride)
- `backend/locales/en.json` - Backend İngilizce mesajlar (ileride)

### Güncellenen Dosyalar

- `frontend/src/App.js` - i18n import eklendi
- `frontend/src/components/layout/Header.js` - LanguageSwitcher eklendi
- `frontend/package.json` - i18n dependencies
- `backend/package.json` - i18n dependency

---

## 🎯 Sonraki Adımlar

1. ✅ Deployment tamamlandı
2. ✅ Dil değiştirme çalışıyor
3. 🔄 Tüm sayfaları çevir (Task 4-14)
4. 🔄 Backend mesajlarını çevir (Task 19-22)
5. 🔄 Validation ve error mesajlarını çevir

---

## 📞 Yardım

Sorun yaşarsan:
1. Logları kontrol et: `sudo docker-compose logs -f`
2. Container durumunu kontrol et: `sudo docker-compose ps`
3. Health check yap: `curl https://budgetapp.site/health`

**Not:** GitHub Actions otomatik deployment de çalışıyor, ama manuel deployment daha hızlı ve kontrollü.
