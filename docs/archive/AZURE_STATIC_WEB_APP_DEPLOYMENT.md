# Azure Static Web Apps + Database Deployment Rehberi

## 📋 İçindekiler
1. [Mimari Genel Bakış](#mimari-genel-bakış)
2. [Ön Hazırlık](#ön-hazırlık)
3. [Azure Kaynakları Oluşturma](#azure-kaynakları-oluşturma)
4. [Veritabanı Kurulumu](#veritabanı-kurulumu)
5. [Static Web App Konfigürasyonu](#static-web-app-konfigürasyonu)
6. [Backend API Deployment](#backend-api-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Environment Variables](#environment-variables)
9. [Test ve Doğrulama](#test-ve-doğrulama)
10. [Sorun Giderme](#sorun-giderme)

---

## 🏗️ Mimari Genel Bakış

Azure Static Web Apps ile projeniz şu şekilde çalışacak:

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Static Web App                      │
│                                                               │
│  ┌──────────────────┐         ┌─────────────────────────┐   │
│  │   React Frontend │────────▶│  Managed Functions API  │   │
│  │   (Static Files) │         │  (Node.js Backend)      │   │
│  └──────────────────┘         └─────────────────────────┘   │
│                                         │                     │
└─────────────────────────────────────────┼─────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  Azure Database for    │
                              │  PostgreSQL/MySQL      │
                              └────────────────────────┘
```

### Avantajlar:
- ✅ Otomatik HTTPS
- ✅ Global CDN
- ✅ Ücretsiz SSL sertifikası
- ✅ GitHub/Azure DevOps entegrasyonu
- ✅ Otomatik build ve deploy
- ✅ Staging environments
- ✅ Custom domain desteği

---

## 🎯 Ön Hazırlık

### Gereksinimler:
- Azure hesabı (ücretsiz tier yeterli)
- Azure CLI yüklü
- GitHub veya Azure DevOps repository
- Node.js 18+ yüklü

### Azure CLI Kurulumu:
```bash
# macOS
brew install azure-cli

# Giriş yap
az login

# Subscription seç
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

---

## 🚀 Azure Kaynakları Oluşturma

### 1. Resource Group Oluştur

```bash
# Resource group oluştur
az group create \
  --name budget-app-rg \
  --location westeurope

# Doğrula
az group show --name budget-app-rg
```

### 2. PostgreSQL Database Oluştur

```bash
# PostgreSQL Flexible Server oluştur
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

# Firewall rule ekle (Azure services için)
az postgres flexible-server firewall-rule create \
  --resource-group budget-app-rg \
  --name budget-app-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Alternatif: MySQL kullanmak isterseniz:**
```bash
az mysql flexible-server create \
  --resource-group budget-app-rg \
  --name budget-app-mysql-server \
  --location westeurope \
  --admin-user budgetadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 8.0.21 \
  --storage-size 32 \
  --public-access 0.0.0.0
```

### 3. Static Web App Oluştur

```bash
# Static Web App oluştur
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

# Deployment token al (CI/CD için gerekli)
az staticwebapp secrets list \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --query "properties.apiKey" \
  --output tsv
```

---

## 💾 Veritabanı Kurulumu

### 1. Connection String Al

```bash
# PostgreSQL connection string
az postgres flexible-server show-connection-string \
  --server-name budget-app-db-server \
  --database-name budget_app \
  --admin-user budgetadmin \
  --admin-password 'YourSecurePassword123!' \
  --query connectionStrings.psql_cmd \
  --output tsv
```

Connection string formatı:
```
postgresql://budgetadmin:YourSecurePassword123!@budget-app-db-server.postgres.database.azure.com:5432/budget_app?sslmode=require
```

### 2. Schema ve Migration Çalıştır

Yerel bilgisayarınızdan Azure database'e bağlanın:

```bash
# PostgreSQL client kur (eğer yoksa)
brew install postgresql

# Azure database'e bağlan
psql "postgresql://budgetadmin:YourSecurePassword123!@budget-app-db-server.postgres.database.azure.com:5432/budget_app?sslmode=require"

# Schema'yı import et
\i backend/database/schema.sql

# Çıkış
\q
```

**Alternatif: Script ile:**
```bash
# Migration script oluştur
cat > migrate-to-azure.sh << 'EOF'
#!/bin/bash

DB_HOST="budget-app-db-server.postgres.database.azure.com"
DB_PORT="5432"
DB_NAME="budget_app"
DB_USER="budgetadmin"
DB_PASSWORD="YourSecurePassword123!"

export PGPASSWORD=$DB_PASSWORD

echo "🔄 Migrating schema to Azure..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/schema.sql

echo "🔄 Running AI tables migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_ai_tables.sql

echo "🔄 Running notification columns migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_notification_columns.sql

echo "🔄 Running user language preference migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_user_language_preference.sql

echo "✅ Migration completed!"
EOF

chmod +x migrate-to-azure.sh
./migrate-to-azure.sh
```

---

## ⚙️ Static Web App Konfigürasyonu

### 1. staticwebapp.config.json Oluştur

Proje root'unda bu dosyayı oluşturun:

```bash
cat > staticwebapp.config.json << 'EOF'
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
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".js": "text/javascript",
    ".css": "text/css"
  },
  "platform": {
    "apiRuntime": "node:18"
  }
}
EOF
```

### 2. Backend'i Azure Functions Formatına Dönüştür

Azure Static Web Apps, backend için Azure Functions kullanır. Backend kodunuzu dönüştürelim:

```bash
# API klasörü oluştur
mkdir -p api

# Function host config
cat > api/host.json << 'EOF'
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[3.*, 4.0.0)"
  }
}
EOF

# Local settings (development için)
cat > api/local.settings.json << 'EOF'
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "NODE_ENV": "production"
  }
}
EOF
```

### 3. Backend Proxy Function Oluştur

Backend'inizi Azure Functions ile wrap edelim:

```bash
# Ana function dosyası
cat > api/index.js << 'EOF'
const app = require('../backend/server');

module.exports = async function (context, req) {
  context.log('HTTP trigger function processed a request.');
  
  // Express app'i Azure Function olarak çalıştır
  return new Promise((resolve, reject) => {
    const res = {
      status: (code) => {
        context.res = { status: code };
        return res;
      },
      json: (body) => {
        context.res = {
          ...context.res,
          body: body,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        resolve();
      },
      send: (body) => {
        context.res = {
          ...context.res,
          body: body
        };
        resolve();
      }
    };

    app(req, res);
  });
};
EOF

# Function config
cat > api/function.json << 'EOF'
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete", "patch"],
      "route": "{*segments}"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
EOF
```

**DAHA İYİ YAKLAŞIM:** Backend'i olduğu gibi kullan (önerilen):

Azure Static Web Apps, `/api` klasöründeki her klasörü ayrı bir function olarak çalıştırır. Backend'inizi daha iyi entegre etmek için:

```bash
# Backend'i API klasörüne kopyala
cp -r backend api/

# API package.json güncelle
cat > api/package.json << 'EOF'
{
  "name": "budget-app-api",
  "version": "2.0.0",
  "description": "Budget App API for Azure Static Web Apps",
  "main": "index.js",
  "scripts": {
    "start": "func start",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "pg-pool": "^3.6.1",
    "winston": "^3.11.0"
  }
}
EOF
```

---

## 🔐 Environment Variables

### Azure Static Web App'e Environment Variables Ekle

```bash
# Environment variables ekle
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

# Environment variables listele
az staticwebapp appsettings list \
  --name budget-app-static \
  --resource-group budget-app-rg
```

### Frontend Environment Variables

Frontend için `.env.production` dosyası oluşturun:

```bash
cat > frontend/.env.production << 'EOF'
# API URL - Static Web App otomatik olarak /api route'unu backend'e yönlendirir
REACT_APP_API_URL=/api

# Environment
REACT_APP_ENVIRONMENT=production

# Debug Mode
REACT_APP_DEBUG=false

# Development Features
REACT_APP_ENABLE_DEVTOOLS=false
REACT_APP_LOG_LEVEL=error

# App Information
REACT_APP_NAME=Budget App
REACT_APP_VERSION=2.0.0
EOF
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/azure-static-web-apps.yml` dosyası oluşturun:

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

### GitHub Secret Ekle

```bash
# Deployment token'ı al
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --query "properties.apiKey" \
  --output tsv)

echo "GitHub repository settings > Secrets and variables > Actions'a gidin"
echo "New repository secret oluşturun:"
echo "Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "Value: $DEPLOYMENT_TOKEN"
```

---

## 🧪 Test ve Doğrulama

### 1. Deployment URL'i Al

```bash
# Static Web App URL'ini al
az staticwebapp show \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --query "defaultHostname" \
  --output tsv
```

URL formatı: `https://budget-app-static.azurestaticapps.net`

### 2. Test Scriptleri

```bash
# Test script oluştur
cat > test-azure-deployment.sh << 'EOF'
#!/bin/bash

AZURE_URL="https://budget-app-static.azurestaticapps.net"

echo "🧪 Testing Azure Static Web App Deployment..."

# Test 1: Frontend
echo "📱 Testing Frontend..."
curl -s -o /dev/null -w "%{http_code}" $AZURE_URL
if [ $? -eq 0 ]; then
  echo "✅ Frontend is accessible"
else
  echo "❌ Frontend is not accessible"
fi

# Test 2: API Health
echo "🔧 Testing API..."
curl -s -o /dev/null -w "%{http_code}" $AZURE_URL/api/health
if [ $? -eq 0 ]; then
  echo "✅ API is accessible"
else
  echo "❌ API is not accessible"
fi

# Test 3: Database Connection
echo "💾 Testing Database Connection..."
curl -s $AZURE_URL/api/health | jq '.database'

echo "✅ All tests completed!"
EOF

chmod +x test-azure-deployment.sh
./test-azure-deployment.sh
```

### 3. Database Connection Test

Backend'e health check endpoint ekleyin:

```javascript
// backend/routes/health.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/health', async (req, res) => {
  try {
    // Database connection test
    const result = await pool.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        timestamp: result.rows[0].now
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

module.exports = router;
```

---

## 🌐 Custom Domain Ekleme

### 1. Custom Domain Ekle

```bash
# Custom domain ekle
az staticwebapp hostname set \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --hostname "budget.yourdomain.com"

# Validation token al
az staticwebapp hostname show \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --hostname "budget.yourdomain.com"
```

### 2. DNS Ayarları

Domain sağlayıcınızda (Cloudflare, GoDaddy, vb.) şu DNS kayıtlarını ekleyin:

```
Type: CNAME
Name: budget
Value: budget-app-static.azurestaticapps.net
TTL: Auto
```

---

## 🔍 Monitoring ve Logging

### Application Insights Ekle

```bash
# Application Insights oluştur
az monitor app-insights component create \
  --app budget-app-insights \
  --location westeurope \
  --resource-group budget-app-rg \
  --application-type web

# Instrumentation key al
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app budget-app-insights \
  --resource-group budget-app-rg \
  --query "instrumentationKey" \
  --output tsv)

# Static Web App'e ekle
az staticwebapp appsettings set \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --setting-names \
    APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

### Log Görüntüleme

```bash
# Real-time logs
az staticwebapp logs show \
  --name budget-app-static \
  --resource-group budget-app-rg \
  --follow

# Application Insights'ta sorgula
az monitor app-insights query \
  --app budget-app-insights \
  --resource-group budget-app-rg \
  --analytics-query "requests | where timestamp > ago(1h) | summarize count() by resultCode"
```

---

## 🚨 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. Build Hatası
```bash
# Logs kontrol et
az staticwebapp show \
  --name budget-app-static \
  --resource-group budget-app-rg

# GitHub Actions logs kontrol et
# Repository > Actions > Son workflow run
```

#### 2. Database Connection Hatası
```bash
# Firewall rules kontrol et
az postgres flexible-server firewall-rule list \
  --resource-group budget-app-rg \
  --name budget-app-db-server

# Connection string test et
psql "postgresql://budgetadmin:YourSecurePassword123!@budget-app-db-server.postgres.database.azure.com:5432/budget_app?sslmode=require" -c "SELECT 1"
```

#### 3. API Route Çalışmıyor
```bash
# staticwebapp.config.json kontrol et
# API location doğru mu?
# Function.json dosyaları var mı?
```

#### 4. Environment Variables Yüklenmiyor
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

## 💰 Maliyet Optimizasyonu

### Free Tier Limitleri:
- Static Web Apps: 100 GB bandwidth/ay (ücretsiz)
- Azure Functions: 1M execution/ay (ücretsiz)
- PostgreSQL Flexible Server: ~$12/ay (Burstable B1ms)

### Maliyet Azaltma İpuçları:
1. Database'i gerektiğinde durdur
2. CDN cache'i maksimize et
3. Staging environment'ı sadece gerektiğinde kullan
4. Application Insights sampling rate'i ayarla

```bash
# Database'i durdur (geliştirme yapmıyorsan)
az postgres flexible-server stop \
  --resource-group budget-app-rg \
  --name budget-app-db-server

# Database'i başlat
az postgres flexible-server start \
  --resource-group budget-app-rg \
  --name budget-app-db-server
```

---

## 📚 Ek Kaynaklar

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Node.js Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [Azure PostgreSQL Docs](https://docs.microsoft.com/azure/postgresql/)

---

## ✅ Deployment Checklist

- [ ] Azure CLI kuruldu ve giriş yapıldı
- [ ] Resource Group oluşturuldu
- [ ] PostgreSQL Database oluşturuldu ve konfigüre edildi
- [ ] Database schema migrate edildi
- [ ] Static Web App oluşturuldu
- [ ] Environment variables ayarlandı
- [ ] GitHub Actions workflow eklendi
- [ ] Deployment token GitHub'a eklendi
- [ ] İlk deployment başarılı
- [ ] Frontend erişilebilir
- [ ] API endpoints çalışıyor
- [ ] Database bağlantısı test edildi
- [ ] Custom domain eklendi (opsiyonel)
- [ ] SSL sertifikası aktif
- [ ] Monitoring kuruldu

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 24 Kasım 2024  
**Versiyon:** 1.0
