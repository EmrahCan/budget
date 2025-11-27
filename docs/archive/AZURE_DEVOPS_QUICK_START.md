# ⚡ Azure DevOps Quick Start Guide

**5 Dakikada Deployment'a Hazır!**

---

## 🎯 Hızlı Başlangıç

### Adım 1: Variable Group (2 dakika)

1. **Link'e git:** https://dev.azure.com/EmrahC/Budget/_library?itemType=VariableGroups

2. **+ Variable group** tıkla

3. **Name:** `budget-app-production`

4. **Add variable** ile 3 secret ekle:

```
Variable Name: DB_PASSWORD
Value: iR1l21$znXTiiHvj
Type: Secret ✅ (kilit ikonuna tıkla)

Variable Name: JWT_SECRET
Value: g67KEZ81txD0vOB0G1LO1kb4Upvs3/pp75nEvk6DQTc=
Type: Secret ✅

Variable Name: GEMINI_API_KEY
Value: AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
Type: Secret ✅
```

5. **Save** tıkla

---

### Adım 2: Service Connection (2 dakika)

1. **Link'e git:** https://dev.azure.com/EmrahC/Budget/_settings/adminservices

2. **New service connection** tıkla

3. **Azure Resource Manager** seç → **Next**

4. **Service principal (automatic)** seç → **Next**

5. **Bilgileri gir:**
   - Subscription: `Visual Studio Enterprise Aboneliği`
   - Resource group: `DarkSide-RG-WebApp`
   - Service connection name: `Azure-Budget-App`
   - ✅ Grant access permission to all pipelines

6. **Save** tıkla

---

### Adım 3: Pipeline Oluştur (1 dakika)

1. **Link'e git:** https://dev.azure.com/EmrahC/Budget/_build

2. **New pipeline** tıkla

3. **Azure Repos Git** seç

4. **BugdetApp** repository seç

5. **Existing Azure Pipelines YAML file** seç

6. **Path:** `/azure-pipelines.yml` seç

7. **Continue** tıkla

8. **Variables** sekmesine git:
   - **Variable groups** tıkla
   - **Link variable group** tıkla
   - `budget-app-production` seç
   - **Link** tıkla

9. **Save** tıkla (Run etme henüz!)

---

### Adım 4: İlk Deployment (11 dakika)

1. **Run pipeline** tıkla

2. **Branch:** `main` seç

3. **Run** tıkla

4. **İzle:**
   - ⏱️ Build (5 min)
   - ⏱️ Database Migration (2 min)
   - ⏱️ Deploy (3 min)
   - ⏱️ Verify (1 min)

5. **Başarılı olursa:**
   - ✅ Yeşil tik göreceksiniz
   - ✅ Tüm stage'ler başarılı
   - ✅ Verification passed

---

## 🔍 Deployment Sonrası Test

### 1. Frontend Test
```bash
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net
```
**Beklenen:** HTML response (200 OK)

### 2. API Health Test
```bash
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health
```
**Beklenen:** `{"status":"ok"}` (200 OK)

### 3. Browser Test
**URL:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net

**Test Et:**
- ✅ Ana sayfa yükleniyor
- ✅ Login sayfası açılıyor
- ✅ Register sayfası açılıyor

---

## 🆘 Sorun mu Var?

### Pipeline Başarısız Oldu
1. **Logs'a bak:** Pipeline'da failed stage'e tıkla
2. **Hata mesajını oku:** Genelde açıklayıcıdır
3. **Yaygın sorunlar:**
   - Variable group bağlanmadı → Adım 3'ü tekrar yap
   - Service connection yok → Adım 2'yi tekrar yap
   - Build hatası → Local'de test et

### Web App Açılmıyor
```bash
# Logs kontrol et
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp

# Restart dene
az webapp restart --name budgetapp --resource-group DarkSide-RG-WebApp
```

### Database Bağlantı Hatası
- VNet integration kontrol et
- Environment variables kontrol et
- Pipeline logs'ta migration başarılı mı?

---

## 📊 Pipeline Stages Açıklaması

### 1️⃣ Build Stage
- Frontend build (React → static files)
- Backend prepare (Node.js dependencies)
- Deployment package oluştur

### 2️⃣ Database Migration Stage
- PostgreSQL client kur
- Schema migration çalıştır
- AI tables oluştur
- Notification columns ekle
- User language preference ekle

### 3️⃣ Deploy Stage
- Build artifacts indir
- Azure Web App'e deploy et
- Web App'i restart et

### 4️⃣ Verify Stage
- App'in başlamasını bekle
- Frontend health check
- API health check

---

## ✅ Başarı Kriterleri

- ✅ Pipeline yeşil (tüm stage'ler başarılı)
- ✅ Frontend erişilebilir (200 OK)
- ✅ API health check başarılı
- ✅ Login/Register çalışıyor
- ✅ Database bağlantısı OK

---

## 🎉 Tebrikler!

Deployment başarılı! Artık uygulamanız Azure'da çalışıyor.

**Sonraki Adımlar:**
- Custom domain ekle (opsiyonel)
- SSL certificate yapılandır (opsiyonel)
- Monitoring ve alerts kur (önerilen)
- Backup stratejisi belirle (önerilen)

---

## 📚 Daha Fazla Bilgi

- **Detaylı Rehber:** `AZURE_DEPLOYMENT_NEXT_STEPS.md`
- **Session Summary:** `DEPLOYMENT_SESSION_SUMMARY.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

**Kolay gelsin! 🚀**
