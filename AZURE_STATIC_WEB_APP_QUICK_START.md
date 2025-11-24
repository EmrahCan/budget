# 🚀 Azure Static Web App - Hızlı Başlangıç

## 5 Dakikada Deploy!

### Ön Gereksinimler
- Azure hesabı (ücretsiz: https://azure.microsoft.com/free/)
- Azure CLI yüklü (https://docs.microsoft.com/cli/azure/install-azure-cli)
- GitHub hesabı

### Adım 1: Azure CLI Kurulumu (macOS)

```bash
# Azure CLI kur
brew install azure-cli

# Azure'a giriş yap
az login
```

### Adım 2: Otomatik Deployment

```bash
# Deployment script'i çalıştır
./deploy-to-azure-static-web-app.sh
```

Script şunları yapacak:
1. ✅ Resource Group oluşturur
2. ✅ PostgreSQL Database oluşturur
3. ✅ Database schema'yı migrate eder
4. ✅ Static Web App oluşturur
5. ✅ Environment variables ayarlar
6. ✅ Deployment token verir

### Adım 3: GitHub Secret Ekle

Script bittiğinde size bir deployment token verecek:

1. GitHub repository'nize gidin
2. Settings > Secrets and variables > Actions
3. "New repository secret" tıklayın
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Script'in verdiği token'ı yapıştırın
6. "Add secret" tıklayın

### Adım 4: Deploy!

```bash
# Kodu push et (otomatik deploy başlar)
git add .
git commit -m "Deploy to Azure Static Web App"
git push origin main
```

### Adım 5: Test Et

GitHub Actions'da deployment'ı izleyin:
- Repository > Actions > Son workflow

Deployment tamamlandığında uygulamanız hazır:
- URL: `https://budget-app-static.azurestaticapps.net`

---

## 🎯 Manuel Deployment (Adım Adım)

Otomatik script kullanmak istemiyorsanız:

### 1. Resource Group Oluştur

```bash
az group create \
  --name budget-app-rg \
  --location westeurope
```

### 2. PostgreSQL Database Oluştur

```bash
# Server oluştur (5-10 dakika sürer)
az postgres flexible-server create \
  --resource-group budget-app-rg \
  --name budget-app-db-server \
  --location westeurope \
  --admin-user budgetadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Database oluştur
az postgres flexible-server db create \
  --resource-group budget-app-rg \
  --server-name budget-app-db-server \
  --database-name budget_app

# Firewall rule ekle
az postgres flexible-server firewall-rule create \
  --resource-group budget-app-rg \
  --name budget-app-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 3. Database Schema Migrate Et

```bash
# Database'e bağlan ve schema'yı import et
export PGPASSWORD='YourSecurePassword123!'
psql -h budget-app-db-server.postgres.database.azure.com \
     -p 5432 \
     -U budgetadmin \
     -d budget_app \
     -f backend/database/schema.sql

# Migrations çalıştır
psql -h budget-app-db-server.postgres.database.azure.com \
     -p 5432 \
     -U budgetadmin \
     -d budget_app \
     -f backend/database/migrations/add_ai_tables.sql

psql -h budget-app-db-server.postgres.database.azure.com \
     -p 5432 \
     -U budgetadmin \
     -d budget_app \
     -f backend/database/migrations/add_notification_columns.sql

psql -h budget-app-db-server.postgres.database.azure.com \
     -p 5432 \
     -U budgetadmin \
     -d budget_app \
     -f backend/database/migrations/add_user_language_preference.sql
```

### 4. Static Web App Oluştur

```bash
az staticwebapp create \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --location westeurope \
  --source https://github.com/EmrahCan/budget \
  --branch main \
  --app-location "/frontend" \
  --api-location "/backend" \
  --output-location "build" \
  --login-with-github
```

### 5. Environment Variables Ayarla

```bash
az staticwebapp appsettings set \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --setting-names \
    DB_HOST="budget-app-db-server.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_NAME="budget_app" \
    DB_USER="budgetadmin" \
    DB_PASSWORD="YourSecurePassword123!" \
    JWT_SECRET="your-production-jwt-secret-min-32-chars" \
    JWT_EXPIRES_IN="7d" \
    NODE_ENV="production" \
    GEMINI_API_KEY="your-gemini-api-key" \
    GEMINI_MODEL="gemini-2.5-flash" \
    AI_CATEGORIZATION_ENABLED="true" \
    AI_INSIGHTS_ENABLED="true" \
    AI_RECOMMENDATIONS_ENABLED="true" \
    AI_NL_QUERIES_ENABLED="true" \
    AI_RATE_LIMIT="60" \
    AI_CACHE_ENABLED="true" \
    AI_CACHE_TTL="3600" \
    AI_USE_MOCK_DATA="false"
```

### 6. Deployment Token Al

```bash
az staticwebapp secrets list \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --query "properties.apiKey" \
  --output tsv
```

Bu token'ı GitHub secret olarak ekleyin (yukarıdaki Adım 3'e bakın).

---

## 🔧 Gerekli Dosyalar

Deployment için bu dosyaların olması gerekiyor:

### 1. staticwebapp.config.json (proje root'unda)

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/api/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "platform": {
    "apiRuntime": "node:18"
  }
}
```

### 2. frontend/.env.production

```bash
REACT_APP_API_URL=/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_LOG_LEVEL=error
REACT_APP_NAME=Budget App
REACT_APP_VERSION=2.0.0
```

### 3. .github/workflows/azure-static-web-apps.yml

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci

      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci

      - name: Build Frontend
        run: |
          cd frontend
          npm run build
        env:
          REACT_APP_API_URL: /api
          REACT_APP_ENVIRONMENT: production

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: "/backend"
          output_location: "build"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

---

## 🧪 Test Komutları

```bash
# Static Web App URL'ini al
az staticwebapp show \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --query "defaultHostname" \
  --output tsv

# Frontend test et
curl https://budget-app-static.azurestaticapps.net

# API test et
curl https://budget-app-static.azurestaticapps.net/api/health

# Logs görüntüle
az staticwebapp logs show \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --follow
```

---

## 💰 Maliyet

### Ücretsiz Tier:
- Static Web Apps: 100 GB bandwidth/ay
- Azure Functions: 1M execution/ay
- **Toplam: $0/ay**

### Database (ücretli):
- PostgreSQL Flexible Server (B1ms): ~$12/ay
- Storage (32 GB): ~$1/ay
- **Toplam: ~$13/ay**

### Toplam Maliyet: ~$13/ay

---

## 🆘 Sorun Giderme

### Build Hatası
```bash
# GitHub Actions logs kontrol et
# Repository > Actions > Son workflow run > Build logs
```

### Database Bağlantı Hatası
```bash
# Firewall rules kontrol et
az postgres flexible-server firewall-rule list \
  --resource-group budget-app-rg \
  --name budget-app-db-server

# Connection test et
psql "postgresql://budgetadmin:PASSWORD@budget-app-db-server.postgres.database.azure.com:5432/budget_app?sslmode=require" -c "SELECT 1"
```

### Environment Variables Yüklenmiyor
```bash
# Environment variables listele
az staticwebapp appsettings list \
  --name budget-app-static \
  --resource-group budget-app-rg

# Yeniden deploy et
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

---

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için:
- `AZURE_STATIC_WEB_APP_DEPLOYMENT.md` - Tam deployment rehberi
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)

---

## ✅ Checklist

- [ ] Azure CLI kuruldu
- [ ] Azure'a giriş yapıldı
- [ ] Deployment script çalıştırıldı
- [ ] GitHub secret eklendi
- [ ] Kod push edildi
- [ ] Deployment başarılı
- [ ] Uygulama erişilebilir
- [ ] Database bağlantısı çalışıyor

---

**Hazır mısın? Hadi başlayalım! 🚀**

```bash
./deploy-to-azure-static-web-app.sh
```
