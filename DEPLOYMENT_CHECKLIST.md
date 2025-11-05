# Azure Deployment Checklist

## 🎯 **Deployment Sırası**

### **1. 🗄️ Azure Database for MySQL (İlk Adım)**

**Azure Portal'da:**
- [ ] "Azure Database for MySQL flexible server" oluştur
- [ ] Resource group: `budget-app-rg`
- [ ] Server name: `budget-mysql-server`
- [ ] Region: `West Europe`
- [ ] Admin username: `budgetadmin`
- [ ] Password: [güçlü şifre - kaydet!]
- [ ] Compute: `Burstable B1ms` (~$20/ay)
- [ ] Networking: "Allow public access from any Azure service" ✅

**Database Setup:**
- [ ] MySQL Workbench ile bağlan
- [ ] Database oluştur: `CREATE DATABASE budget_app;`
- [ ] Migration script çalıştır: `node scripts/setup-production-db.js`

### **2. 🔧 Azure App Service (Backend)**

**Azure Portal'da:**
- [ ] "App Services" oluştur
- [ ] Resource group: `budget-app-rg` (aynı grup)
- [ ] Name: `budget-backend-api`
- [ ] Runtime: `Node 18 LTS`
- [ ] OS: `Linux`
- [ ] Plan: `Basic B1` (~$13/ay)

**Environment Variables (Configuration sekmesi):**
```
NODE_ENV = production
PORT = 80
DB_HOST = budget-mysql-server.mysql.database.azure.com
DB_PORT = 3306
DB_NAME = budget_app
DB_USER = budgetadmin
DB_PASSWORD = [mysql şifreniz]
JWT_SECRET = [güvenli-secret-key]
GEMINI_API_KEY = [gemini-api-key]
CORS_ORIGIN = https://budget-frontend-app.azurestaticapps.net
```

**Deployment:**
- [ ] "Deployment Center" → GitHub Actions
- [ ] Repository seç
- [ ] Workflow file: `.github/workflows/backend-deploy.yml`
- [ ] GitHub Secrets'a `AZURE_WEBAPP_PUBLISH_PROFILE` ekle

### **3. 🌐 Azure Static Web Apps (Frontend)**

**Azure Portal'da:**
- [ ] "Static Web Apps" oluştur
- [ ] Resource group: `budget-app-rg` (aynı grup)
- [ ] Name: `budget-frontend-app`
- [ ] Plan: `Free`
- [ ] Source: `GitHub`
- [ ] Repository: [your-repo]
- [ ] Branch: `main`
- [ ] App location: `/budget/frontend`
- [ ] Output location: `build`

**GitHub Secrets:**
- [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN`: [Azure'dan otomatik token]
- [ ] `REACT_APP_API_URL`: `https://budget-backend-api.azurewebsites.net/api`

## 🔧 **GitHub Secrets Listesi**

Repository Settings → Secrets and variables → Actions:

```
AZURE_STATIC_WEB_APPS_API_TOKEN: [Static Web App token]
AZURE_WEBAPP_PUBLISH_PROFILE: [App Service publish profile]
REACT_APP_API_URL: https://budget-backend-api.azurewebsites.net/api
```

## 🧪 **Test Checklist**

Deploy sonrası test edilecekler:

### **Backend Tests:**
- [ ] Health check: `https://budget-backend-api.azurewebsites.net/health`
- [ ] API endpoint: `https://budget-backend-api.azurewebsites.net/api`
- [ ] Database connection test
- [ ] CORS headers kontrol

### **Frontend Tests:**
- [ ] Static Web App URL'i açılıyor
- [ ] Login sayfası görünüyor
- [ ] API çağrıları çalışıyor
- [ ] Dashboard yükleniyor

### **Integration Tests:**
- [ ] Register/Login flow
- [ ] Account oluşturma
- [ ] Transaction ekleme
- [ ] Reports sayfası

## 🚨 **Troubleshooting**

### **Database Bağlantı Sorunu:**
```bash
# Test connection
mysql -h budget-mysql-server.mysql.database.azure.com -u budgetadmin -p budget_app
```

### **Backend Logs:**
```bash
# Azure CLI ile logs
az webapp log tail --name budget-backend-api --resource-group budget-app-rg
```

### **CORS Hatası:**
- Backend'de CORS_ORIGIN environment variable kontrol et
- Frontend URL'in doğru olduğunu kontrol et

### **Build Hatası:**
```bash
# Local test
cd budget/frontend
npm install
npm run build
```

## 💰 **Maliyet Özeti**

```
Azure Database for MySQL (B1ms):     ~$20/ay
Azure App Service (Basic B1):        ~$13/ay
Azure Static Web Apps (Free):        $0/ay
─────────────────────────────────────
TOPLAM:                              ~$33/ay
```

## 🎯 **Deployment Sonrası URL'ler**

```
Frontend: https://budget-frontend-app.azurestaticapps.net
Backend:  https://budget-backend-api.azurewebsites.net
API:      https://budget-backend-api.azurewebsites.net/api
Health:   https://budget-backend-api.azurewebsites.net/health
Database: budget-mysql-server.mysql.database.azure.com:3306
```

## ✅ **Başarı Kriterleri**

Deployment başarılı sayılır:

- [ ] ✅ Frontend açılıyor ve login sayfası görünüyor
- [ ] ✅ Backend health check 200 dönüyor
- [ ] ✅ Database bağlantısı çalışıyor
- [ ] ✅ Login/Register flow çalışıyor
- [ ] ✅ Dashboard verileri yükleniyor
- [ ] ✅ CORS hataları yok
- [ ] ✅ SSL sertifikaları aktif

---

**🚀 Bu checklist'i takip ederek 30-45 dakikada production'da olacaksınız!**