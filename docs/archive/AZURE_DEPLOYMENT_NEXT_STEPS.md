# 🚀 Azure Deployment - Sonraki Adımlar

**Tarih:** 24 Kasım 2024  
**Durum:** Environment Variables Ayarlandı ✅

---

## ✅ Tamamlanan Adımlar

### 1. Bilgiler Toplandı ✅
- ✅ Database Password: `iR1l21$znXTiiHvj`
- ✅ JWT Secret: `g67KEZ81txD0vOB0G1LO1kb4Upvs3/pp75nEvk6DQTc=`
- ✅ Gemini API Key: `AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g`

### 2. Web App Environment Variables Ayarlandı ✅
Tüm environment variables Azure Web App'e başarıyla eklendi:
- Database bağlantı bilgileri
- JWT configuration
- AI/Gemini configuration
- Node.js settings

---

## 📋 Yapılacaklar (Azure DevOps Portal'da)

### Adım 1: Variable Group Oluştur

1. **Azure DevOps'a git:** https://dev.azure.com/EmrahC/Budget/_library?itemType=VariableGroups

2. **+ Variable group** butonuna tıkla

3. **Variable group name:** `budget-app-production`

4. **Şu variables'ları ekle:**

| Variable Name | Value | Type |
|--------------|-------|------|
| `DB_PASSWORD` | `iR1l21$znXTiiHvj` | **Secret** ✅ |
| `JWT_SECRET` | `g67KEZ81txD0vOB0G1LO1kb4Upvs3/pp75nEvk6DQTc=` | **Secret** ✅ |
| `GEMINI_API_KEY` | `AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g` | **Secret** ✅ |

5. **Save** butonuna tıkla

---

### Adım 2: Service Connection Oluştur

1. **Project Settings'e git:** https://dev.azure.com/EmrahC/Budget/_settings/adminservices

2. **New service connection** butonuna tıkla

3. **Azure Resource Manager** seç

4. **Service principal (automatic)** seç

5. **Şu bilgileri gir:**
   - **Subscription:** Visual Studio Enterprise Aboneliği
   - **Resource group:** DarkSide-RG-WebApp
   - **Service connection name:** `Azure-Budget-App`
   - ✅ **Grant access permission to all pipelines** işaretle

6. **Save** butonuna tıkla

---

### Adım 3: Pipeline Oluştur

1. **Pipelines'a git:** https://dev.azure.com/EmrahC/Budget/_build

2. **New pipeline** butonuna tıkla

3. **Azure Repos Git** seç

4. **BugdetApp** repository'sini seç

5. **Existing Azure Pipelines YAML file** seç

6. **Path:** `/azure-pipelines.yml` seç

7. **Continue** butonuna tıkla

8. **Pipeline YAML'ı gözden geçir**

9. **Variables** sekmesine git ve variable group'u bağla:
   - **Variable groups** > **Link variable group**
   - `budget-app-production` seç

10. **Save** butonuna tıkla (henüz Run etme!)

---

### Adım 4: İlk Deployment

1. **Pipelines** > **budgetapp-pipeline** seç

2. **Run pipeline** butonuna tıkla

3. **Branch:** `main` seç

4. **Run** butonuna tıkla

5. **Pipeline'ı izle:**
   - ⏱️ Build (~5 dakika)
   - ⏱️ Database Migration (~2 dakika)
   - ⏱️ Deploy (~3 dakika)
   - ⏱️ Verify (~1 dakika)
   - **Toplam:** ~11 dakika

---

## 🔍 Deployment Sonrası Kontroller

### 1. Web App Erişimi
```bash
# Frontend
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net

# API Health Check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health
```

### 2. Logs Kontrolü
```bash
# Real-time logs
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp

# Download logs
az webapp log download --name budgetapp --resource-group DarkSide-RG-WebApp
```

### 3. Database Kontrolü
Database private network içinde olduğu için, Web App'ten bağlanabilirsiniz:
- SSH ile Web App'e bağlan
- psql ile database'e bağlan

---

## 🆘 Sorun Giderme

### Pipeline Build Hatası
```bash
# Local'de test et
cd frontend && npm ci && npm run build
cd ../backend && npm ci
```

### Database Migration Hatası
- Pipeline logs'ları kontrol et
- Database connection string'i doğrula
- VNet integration'ı kontrol et

### Web App 500 Error
```bash
# Logs kontrol et
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp

# Restart
az webapp restart --name budgetapp --resource-group DarkSide-RG-WebApp
```

### Database Bağlantı Hatası
- VNet integration doğru mu?
- Private DNS zone ayarları doğru mu?
- Database credentials doğru mu?

---

## 📊 Pipeline Stages

```
┌─────────────────────────────────────────────────────────┐
│ 1. BUILD (~5 min)                                       │
│    ├─ Install Node.js 18.x                              │
│    ├─ Install Backend Dependencies                      │
│    ├─ Install Frontend Dependencies                     │
│    ├─ Build Frontend (React)                            │
│    └─ Create Deployment Package                         │
├─────────────────────────────────────────────────────────┤
│ 2. DATABASE MIGRATION (~2 min)                          │
│    ├─ Install PostgreSQL Client                         │
│    ├─ Run Main Schema                                   │
│    ├─ Run AI Tables Migration                           │
│    ├─ Run Notification Columns Migration                │
│    └─ Run User Language Preference Migration            │
├─────────────────────────────────────────────────────────┤
│ 3. DEPLOY (~3 min)                                      │
│    ├─ Download Build Artifacts                          │
│    ├─ Deploy to Azure Web App                           │
│    └─ Restart Web App                                   │
├─────────────────────────────────────────────────────────┤
│ 4. VERIFY (~1 min)                                      │
│    ├─ Wait for App Startup                              │
│    ├─ Check Frontend (200 OK)                           │
│    └─ Check API Health (200 OK)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Başarı Kriterleri

- ✅ Pipeline başarıyla tamamlandı
- ✅ Frontend erişilebilir (200 OK)
- ✅ API health check başarılı (200 OK)
- ✅ Database bağlantısı çalışıyor
- ✅ Login/Register işlemleri çalışıyor
- ✅ AI features çalışıyor

---

## 📝 Notlar

### Database Private Network
- Database VNet içinde private olarak yapılandırılmış
- Public access kapalı (güvenlik için)
- Web App VNet integration ile bağlanıyor
- Local'den bağlanmak için Azure Cloud Shell veya VPN gerekli

### Environment Variables
- Tüm secrets Azure Web App'te güvenli şekilde saklanıyor
- Pipeline'da sadece database migration için DB_PASSWORD gerekli
- Diğer tüm ayarlar Web App'ten okunuyor

### Continuous Deployment
- `main` branch'e push yapıldığında otomatik deploy
- `develop` branch'e push yapıldığında otomatik deploy
- Manual trigger da mevcut

---

## 🔗 Faydalı Linkler

- **Azure Portal:** https://portal.azure.com
- **Azure DevOps:** https://dev.azure.com/EmrahC/Budget
- **Web App:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net
- **Resource Group:** https://portal.azure.com/#@/resource/subscriptions/e63f50ae-2721-4d35-9d76-c8bbb0440a84/resourceGroups/DarkSide-RG-WebApp

---

**Hazır! Azure DevOps Portal'da yukarıdaki adımları takip edin! 🚀**
