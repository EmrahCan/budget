# Azure Static Web Apps - Step by Step Guide

## 🎯 **Mimari Genel Bakış**

```
Internet → Azure Static Web Apps (Frontend) → Azure App Service (Backend) → Azure MySQL (Database)
```

**Neden bu mimari?**
- ✅ **Frontend**: Hızlı, global CDN, ücretsiz SSL
- ✅ **Backend**: Scalable API, environment variables
- ✅ **Database**: Managed, güvenli, otomatik backup

## 📋 **ADIM 1: Azure Database for MySQL Oluşturma**

### **Azure Portal'da:**

1. **"Azure Database for MySQL flexible server" arayın**
2. **"Create" butonuna tıklayın**

**Konfigürasyon:**
```
Resource group: budget-app-rg (yeni oluşturun)
Server name: budget-mysql-server
Region: West Europe
MySQL version: 8.0
Compute + storage: Burstable, B1ms (1 vCore, 2GB RAM) - $20/ay
Admin username: budgetadmin
Password: [güçlü şifre - kaydedin!]
```

3. **"Networking" sekmesi:**
   - ✅ "Allow public access from any Azure service"
   - ✅ "Add current client IP address" (geliştirme için)

4. **"Create" butonuna tıklayın** (5-10 dakika sürer)

### **Database Oluşturma:**

MySQL server hazır olduktan sonra:

1. **"Connect" sekmesine gidin**
2. **Connection string'i kopyalayın:**
   ```
   Server: budget-mysql-server.mysql.database.azure.com
   Username: budgetadmin
   Password: [şifreniz]
   ```

3. **MySQL Workbench veya phpMyAdmin ile bağlanın**
4. **Database oluşturun:**
   ```sql
   CREATE DATABASE budget_app;
   USE budget_app;
   ```

5. **Tablolarınızı oluşturun** (mevcut migration'larınızı çalıştırın)

## 📋 **ADIM 2: Azure App Service (Backend) Oluşturma**

### **Azure Portal'da:**

1. **"App Services" arayın**
2. **"Create" butonuna tıklayın**

**Konfigürasyon:**
```
Resource group: budget-app-rg (aynı grup)
Name: budget-backend-api
Runtime stack: Node 18 LTS
Operating System: Linux
Region: West Europe
App Service Plan: Basic B1 (1 Core, 1.75GB RAM) - $13/ay
```

3. **"Create" butonuna tıklayın**

### **Backend Deploy Etme:**

**Seçenek A: GitHub Actions ile (Önerilen)**

1. **App Service'te "Deployment Center" sekmesi**
2. **Source: GitHub**
3. **Repository: [your-repo]**
4. **Branch: main**
5. **Build provider: GitHub Actions**
6. **Runtime stack: Node.js**
7. **Workflow file path: .github/workflows/backend-deploy.yml**

**Seçenek B: ZIP Deploy**

```bash
# Backend'i build et
cd budget/backend
npm install
zip -r backend.zip . -x "node_modules/*" "logs/*"

# Azure CLI ile deploy
az webapp deployment source config-zip \
  --resource-group budget-app-rg \
  --name budget-backend-api \
  --src backend.zip
```

### **Environment Variables Ayarlama:**

App Service'te **"Configuration" sekmesi**:

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
CORS_ORIGIN = https://your-static-web-app.azurestaticapps.net
```

## 📋 **ADIM 3: Azure Static Web Apps (Frontend) Oluşturma**

### **Azure Portal'da:**

1. **"Static Web Apps" arayın**
2. **"Create" butonuna tıklayın**

**Konfigürasyon:**
```
Resource group: budget-app-rg (aynı grup)
Name: budget-frontend-app
Plan type: Free
Region: West Europe
Source: GitHub
Repository: [your-github-repo]
Branch: main
Build Presets: React
App location: /budget/frontend
Output location: build
```

3. **"Create" butonuna tıklayın**

### **GitHub Secrets Ayarlama:**

GitHub repo'nuzda **Settings > Secrets and variables > Actions**:

```
AZURE_STATIC_WEB_APPS_API_TOKEN: [Azure'dan otomatik oluşturulan token]
REACT_APP_API_URL: https://budget-backend-api.azurewebsites.net/api
```

## 📋 **ADIM 4: Frontend'i Backend'e Bağlama**

### **Frontend Environment Variables:**

`budget/frontend/.env.production` dosyası oluşturun:

```env
REACT_APP_API_URL=https://budget-backend-api.azurewebsites.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.0.0
```

### **API URL'lerini Güncelleme:**

`budget/frontend/src/services/api.js` dosyasını kontrol edin:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

## 📋 **ADIM 5: CORS Ayarları**

Backend'te CORS ayarlarını güncelleyin:

`budget/backend/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-static-web-app.azurestaticapps.net',
    'http://localhost:3002' // development için
  ],
  credentials: true
}));
```

## 🚀 **ADIM 6: Deploy ve Test**

### **Otomatik Deploy:**

1. **Main branch'e push yapın**
2. **GitHub Actions otomatik çalışacak**
3. **5-10 dakikada deploy tamamlanır**

### **URL'ler:**

Deploy sonrası URL'leriniz:

```
Frontend: https://your-app-name.azurestaticapps.net
Backend:  https://budget-backend-api.azurewebsites.net
API:      https://budget-backend-api.azurewebsites.net/api
Health:   https://budget-backend-api.azurewebsites.net/health
```

### **Test Etme:**

1. **Frontend URL'ini açın**
2. **Login sayfası görünmeli**
3. **Register/Login test edin**
4. **Dashboard'a erişim test edin**

## 💰 **Maliyet Hesabı (Aylık)**

```
Azure Database for MySQL (B1ms):     ~$20
Azure App Service (Basic B1):        ~$13
Azure Static Web Apps (Free):        $0
─────────────────────────────────────
TOPLAM:                              ~$33/ay
```

## 🔧 **Troubleshooting**

### **Backend Çalışmıyor:**
```bash
# App Service logs kontrol et
az webapp log tail --name budget-backend-api --resource-group budget-app-rg
```

### **Database Bağlantı Sorunu:**
```bash
# Connection string test
mysql -h budget-mysql-server.mysql.database.azure.com -u budgetadmin -p budget_app
```

### **CORS Hatası:**
```javascript
// Backend'de CORS origins kontrol et
console.log('CORS Origins:', process.env.CORS_ORIGIN);
```

### **Frontend Build Hatası:**
```bash
# Local'de test et
cd budget/frontend
npm install
npm run build
```

## 🎯 **Sonraki Adımlar**

Deploy tamamlandıktan sonra:

1. ✅ **Custom domain** ekleyin
2. ✅ **SSL sertifikası** otomatik aktif
3. ✅ **Application Insights** monitoring
4. ✅ **Backup stratejisi** oluşturun
5. ✅ **Performance testing** yapın

## 📞 **Yardım Gerekirse**

Her adımda takıldığınız yerde:

1. **Azure Portal'da logs kontrol edin**
2. **GitHub Actions logs bakın**
3. **Browser developer tools kontrol edin**
4. **Health endpoints test edin**

---

**🚀 Bu adımları takip ederek 30-45 dakikada production'da canlı olacaksınız!**