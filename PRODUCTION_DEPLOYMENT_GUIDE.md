# Production Deployment Guide - Azure Static Web Apps

## 🎯 **Hızlı Deployment - 15 Dakikada Canlı!**

### **1. Azure Static Web App Oluşturma**

1. **Azure Portal'a gidin**: https://portal.azure.com
2. **"Static Web Apps" arayın** ve seçin
3. **"Create"** butonuna tıklayın

**Konfigürasyon:**
```
Subscription: [Azure aboneliğiniz]
Resource Group: budget-app-rg (yeni oluşturun)
Name: budget-management-app
Plan: Free (başlangıç için)
Region: West Europe (Türkiye'ye yakın)
Source: GitHub
Repository: [GitHub repo URL'niz]
Branch: main
Build Presets: React
App location: /budget/frontend
Output location: build
```

### **2. GitHub Secrets Ayarlama**

GitHub repo'nuzda **Settings > Secrets and variables > Actions**:

```
AZURE_STATIC_WEB_APPS_API_TOKEN: [Azure'dan alacağınız token]
REACT_APP_API_URL: https://your-backend-url.com/api
```

### **3. Backend Deployment (Seçenekler)**

#### **Seçenek A: Azure App Service**
```bash
# Azure CLI ile
az webapp create --resource-group budget-app-rg --plan budget-plan --name budget-backend --runtime "NODE|18-lts"
```

#### **Seçenek B: Azure Container Instances**
```bash
# Docker image build ve push
docker build -t budget-backend ./budget/backend
docker tag budget-backend your-registry.azurecr.io/budget-backend
docker push your-registry.azurecr.io/budget-backend
```

#### **Seçenek C: Azure VM (Mevcut Docker Setup)**
```bash
# VM'de
git clone [your-repo]
cd budget
./scripts/deploy.sh production
```

### **4. Database Setup**

#### **Azure Database for MySQL**
```bash
az mysql flexible-server create \
  --resource-group budget-app-rg \
  --name budget-mysql-server \
  --admin-user budgetadmin \
  --admin-password [güçlü-şifre] \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 20 \
  --version 8.0.21
```

### **5. Environment Variables**

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://budget-backend.azurewebsites.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=2.0.0
```

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=80
DB_HOST=budget-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_NAME=budget_app
DB_USER=budgetadmin
DB_PASSWORD=[şifreniz]
JWT_SECRET=[güvenli-secret]
GEMINI_API_KEY=[gemini-api-key]
CORS_ORIGIN=https://your-static-web-app.azurestaticapps.net
```

## 🚀 **Otomatik Deployment**

GitHub Actions zaten konfigüre edilmiş. Main branch'e push yaptığınızda:

1. ✅ **Build** otomatik çalışır
2. ✅ **Test** otomatik çalışır  
3. ✅ **Deploy** otomatik olur
4. ✅ **Live URL** alırsınız

## 📊 **Monitoring ve Health Checks**

### **Health Endpoints**
- Frontend: `https://your-app.azurestaticapps.net`
- Backend: `https://your-backend.azurewebsites.net/health`
- API: `https://your-backend.azurewebsites.net/api`

### **Azure Application Insights**
```javascript
// Otomatik monitoring için
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: 'your-key'
  }
});
```

## 💰 **Maliyet Tahmini (Aylık)**

### **Minimal Setup (Başlangıç)**
- Static Web Apps: **Ücretsiz**
- App Service (Basic): **~$13**
- MySQL (Basic): **~$20**
- **Toplam: ~$33/ay**

### **Production Setup**
- Static Web Apps: **$9/ay**
- App Service (Standard): **~$55**
- MySQL (General Purpose): **~$80**
- **Toplam: ~$144/ay**

## 🔐 **Security Checklist**

- [ ] **HTTPS** zorlaması aktif
- [ ] **CORS** origins kısıtlı
- [ ] **JWT secrets** güvenli
- [ ] **Database** firewall aktif
- [ ] **API rate limiting** aktif
- [ ] **Environment variables** güvenli

## 🎯 **Custom Domain Setup**

1. **Azure Static Web Apps'te**:
   - Custom domains sekmesi
   - Domain ekle: `budget.yourdomain.com`
   - DNS kayıtları ayarla

2. **DNS Kayıtları**:
   ```
   Type: CNAME
   Name: budget
   Value: your-app.azurestaticapps.net
   ```

## 🚨 **Troubleshooting**

### **Build Hataları**
```bash
# Local'de test et
cd budget/frontend
npm install
npm run build
```

### **CORS Hataları**
```javascript
// Backend'de CORS ayarları
app.use(cors({
  origin: [
    'https://your-app.azurestaticapps.net',
    'http://localhost:3002'
  ]
}));
```

### **Database Bağlantı Sorunları**
```bash
# Connection string test
mysql -h budget-mysql-server.mysql.database.azure.com -u budgetadmin -p
```

## 📈 **Performance Optimization**

### **Frontend**
- ✅ **Code splitting** aktif
- ✅ **Lazy loading** aktif
- ✅ **CDN** otomatik
- ✅ **Gzip compression** aktif

### **Backend**
- ✅ **Connection pooling** aktif
- ✅ **Caching** sistemi mevcut
- ✅ **Rate limiting** aktif

## 🎉 **Deployment Tamamlandı!**

Başarılı deployment sonrası:

1. ✅ **Frontend**: https://your-app.azurestaticapps.net
2. ✅ **Backend**: https://your-backend.azurewebsites.net
3. ✅ **API**: https://your-backend.azurewebsites.net/api
4. ✅ **Health**: https://your-backend.azurewebsites.net/health
5. ✅ **SSL**: Otomatik aktif
6. ✅ **CDN**: Global edge locations
7. ✅ **Monitoring**: Application Insights

**🚀 Artık production'da canlı bir Budget Management System'iniz var!**

## 📞 **Sonraki Adımlar**

1. **Custom domain** ayarlayın
2. **Application Insights** konfigüre edin
3. **Backup stratejisi** oluşturun
4. **Monitoring alerts** ayarlayın
5. **Performance testing** yapın

---

*Bu guide ile 15-30 dakikada production'a çıkabilirsiniz! 🎯*