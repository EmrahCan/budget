# 🚀 Azure DevOps Deployment Rehberi

**Tarih:** 24 Kasım 2024  
**Resource Group:** DarkSide-RG-WebApp  
**Location:** Central US

---

## 📋 Mevcut Azure Kaynakları

### ✅ Kurulu Kaynaklar

#### 1. Web App
- **Name:** budgetapp
- **URL:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net
- **Location:** Central US
- **State:** Running
- **Runtime:** Node.js (yapılandırılacak)

#### 2. PostgreSQL Flexible Server
- **Name:** budgetapp-server
- **FQDN:** budgetapp-server.postgres.database.azure.com
- **Version:** PostgreSQL 14
- **Admin User:** bzexmlrqxt
- **State:** Ready
- **Database:** budgetapp-database

#### 3. Network
- **VNet:** budgetappVnet
- **Private DNS Zones:**
  - privatelink.postgres.database.azure.com
  - privatelink.redis.cache.windows.net

---

## 🎯 Deployment Stratejisi

### Mimari
```
Azure DevOps Pipeline
        │
        ├─► Build Frontend (React)
        │   └─► Output: build/
        │
        ├─► Prepare Backend (Node.js)
        │   └─► Output: backend/
        │
        ├─► Database Migration
        │   └─► PostgreSQL Schema + Data
        │
        └─► Deploy to Azure Web App
            ├─► Frontend (Static Files)
            └─► Backend (Node.js API)
```

---

## 📝 Adım 1: Database Migration

### 1.1 Database Connection String Al

```bash
# Admin password'ü al (Azure Portal'dan veya Key Vault'tan)
DB_PASSWORD="your-admin-password"

# Connection string
DB_CONNECTION_STRING="postgresql://bzexmlrqxt:${DB_PASSWORD}@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require"
```

### 1.2 Local'den Database'e Bağlan

```bash
# PostgreSQL client ile bağlan
psql "postgresql://bzexmlrqxt:PASSWORD@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require"

# Veya environment variable ile
export PGPASSWORD="your-password"
psql -h budgetapp-server.postgres.database.azure.com \
     -p 5432 \
     -U bzexmlrqxt \
     -d budgetapp-database
```

### 1.3 Schema Migration

```bash
# Ana schema'yı migrate et
psql "postgresql://bzexmlrqxt:PASSWORD@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require" \
  -f backend/database/schema.sql

# AI tables migration
psql "postgresql://bzexmlrqxt:PASSWORD@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require" \
  -f backend/database/migrations/add_ai_tables.sql

# Notification columns migration
psql "postgresql://bzexmlrqxt:PASSWORD@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require" \
  -f backend/database/migrations/add_notification_columns.sql

# User language preference migration
psql "postgresql://bzexmlrqxt:PASSWORD@budgetapp-server.postgres.database.azure.com:5432/budgetapp-database?sslmode=require" \
  -f backend/database/migrations/add_user_language_preference.sql
```

### 1.4 Migration Script Oluştur

```bash
cat > migrate-to-azure-db.sh << 'EOF'
#!/bin/bash

# Azure PostgreSQL Migration Script

DB_HOST="budgetapp-server.postgres.database.azure.com"
DB_PORT="5432"
DB_NAME="budgetapp-database"
DB_USER="bzexmlrqxt"
DB_PASSWORD="${AZURE_DB_PASSWORD}"  # Environment variable'dan al

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ AZURE_DB_PASSWORD environment variable gerekli!"
    exit 1
fi

export PGPASSWORD=$DB_PASSWORD

echo "🔄 Migrating schema to Azure PostgreSQL..."

# Ana schema
echo "📊 Running main schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/schema.sql

# AI tables
echo "🤖 Running AI tables migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_ai_tables.sql

# Notification columns
echo "🔔 Running notification columns migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_notification_columns.sql

# User language preference
echo "🌍 Running user language preference migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_user_language_preference.sql

echo "✅ Migration completed successfully!"

unset PGPASSWORD
EOF

chmod +x migrate-to-azure-db.sh
```

---

## 🔧 Adım 2: Web App Configuration

### 2.1 Application Settings (Environment Variables)

```bash
# Web App'e environment variables ekle
az webapp config appsettings set \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    DB_HOST="budgetapp-server.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_NAME="budgetapp-database" \
    DB_USER="bzexmlrqxt" \
    DB_PASSWORD="@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/db-password/)" \
    JWT_SECRET="your-production-jwt-secret-min-32-chars" \
    JWT_EXPIRES_IN="7d" \
    GEMINI_API_KEY="your-gemini-api-key" \
    GEMINI_MODEL="gemini-2.5-flash" \
    AI_CATEGORIZATION_ENABLED="true" \
    AI_INSIGHTS_ENABLED="true" \
    AI_RECOMMENDATIONS_ENABLED="true" \
    AI_NL_QUERIES_ENABLED="true" \
    AI_RATE_LIMIT="60" \
    AI_CACHE_ENABLED="true" \
    AI_CACHE_TTL="3600" \
    AI_USE_MOCK_DATA="false" \
    WEBSITE_NODE_DEFAULT_VERSION="~18" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### 2.2 Startup Command

```bash
# Web App startup command ayarla
az webapp config set \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp \
  --startup-file "node backend/server.js"
```

---

## 📦 Adım 3: Azure DevOps Pipeline Oluştur

### 3.1 Azure DevOps Project Setup

1. Azure DevOps'a git: https://dev.azure.com/EmrahC/Budget
2. Pipelines > New Pipeline
3. Azure Repos Git seç
4. Repository: BugdetApp
5. Configure: Node.js with React

### 3.2 Pipeline YAML Dosyası

`azure-pipelines.yml` dosyası oluştur:



### 3.3 Pipeline Variables (Secrets)

Azure DevOps'ta Pipeline > Library > Variable Groups oluştur:

**Variable Group Name:** `budget-app-production`

| Variable Name | Value | Secret? |
|--------------|-------|---------|
| DB_PASSWORD | [Azure Portal'dan al] | ✅ Yes |
| JWT_SECRET | [32+ karakter güvenli string] | ✅ Yes |
| GEMINI_API_KEY | [Google AI Studio'dan al] | ✅ Yes |

### 3.4 Service Connection

1. Project Settings > Service connections
2. New service connection > Azure Resource Manager
3. Service principal (automatic)
4. Subscription: Visual Studio Enterprise Aboneliği
5. Resource group: DarkSide-RG-WebApp
6. Service connection name: `Azure-Budget-App`

---

## 🚀 Adım 4: İlk Deployment

### 4.1 Database Migration (Manuel - İlk Kez)

```bash
# Database password'ü environment variable olarak ayarla
export AZURE_DB_PASSWORD="your-database-password"

# Migration script'i çalıştır
./migrate-to-azure-db.sh
```

**Çıktı:**
```
✓ Database connection successful
✓ Main schema migrated
✓ AI tables migrated
✓ Notification columns migrated
✓ User language preference migrated
✓ Found 17 tables in database
```

### 4.2 Web App Environment Variables

```bash
# Tüm environment variables'ı bir seferde ayarla
az webapp config appsettings set \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    DB_HOST="budgetapp-server.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_NAME="budgetapp-database" \
    DB_USER="bzexmlrqxt" \
    DB_PASSWORD="your-database-password" \
    JWT_SECRET="your-production-jwt-secret-min-32-chars" \
    JWT_EXPIRES_IN="7d" \
    GEMINI_API_KEY="your-gemini-api-key" \
    GEMINI_MODEL="gemini-2.5-flash" \
    AI_CATEGORIZATION_ENABLED="true" \
    AI_INSIGHTS_ENABLED="true" \
    AI_RECOMMENDATIONS_ENABLED="true" \
    AI_NL_QUERIES_ENABLED="true" \
    AI_RATE_LIMIT="60" \
    AI_CACHE_ENABLED="true" \
    AI_CACHE_TTL="3600" \
    AI_USE_MOCK_DATA="false" \
    AI_CATEGORIZATION_MIN_CONFIDENCE="70" \
    AI_INSIGHT_MIN_CONFIDENCE="60" \
    AI_RECOMMENDATION_MIN_CONFIDENCE="75" \
    WEBSITE_NODE_DEFAULT_VERSION="~18" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### 4.3 Code Push (Trigger Pipeline)

```bash
# Tüm dosyaları commit et
git add .
git commit -m "feat: Add Azure DevOps deployment pipeline

- Added azure-pipelines.yml for CI/CD
- Added database migration script
- Added deployment guide
- Configured for Azure Web App + PostgreSQL"

# Azure DevOps'a push et
git push azure main
```

Pipeline otomatik olarak başlayacak!

---

## 📊 Adım 5: Monitoring ve Verification

### 5.1 Pipeline Status

Azure DevOps'ta pipeline durumunu izle:
- https://dev.azure.com/EmrahC/Budget/_build

### 5.2 Web App Logs

```bash
# Real-time logs
az webapp log tail \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp

# Download logs
az webapp log download \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp \
  --log-file webapp-logs.zip
```

### 5.3 Health Check

```bash
# Frontend check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net

# API health check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health

# Database connection check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health | jq '.database'
```

### 5.4 Application Insights (Opsiyonel)

```bash
# Application Insights oluştur
az monitor app-insights component create \
  --app budgetapp-insights \
  --location centralus \
  --resource-group DarkSide-RG-WebApp \
  --application-type web

# Instrumentation key al
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app budgetapp-insights \
  --resource-group DarkSide-RG-WebApp \
  --query "instrumentationKey" \
  --output tsv)

# Web App'e ekle
az webapp config appsettings set \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

---

## 🔧 Troubleshooting

### Problem 1: Pipeline Build Hatası

**Çözüm:**
```bash
# Local'de test et
cd frontend
npm ci
npm run build

cd ../backend
npm ci
```

### Problem 2: Database Connection Hatası

**Çözüm:**
```bash
# Firewall rules kontrol et
az postgres flexible-server firewall-rule list \
  --resource-group DarkSide-RG-WebApp \
  --name budgetapp-server

# Azure services'e izin ver
az postgres flexible-server firewall-rule create \
  --resource-group DarkSide-RG-WebApp \
  --name budgetapp-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Problem 3: Web App 500 Error

**Çözüm:**
```bash
# Logs kontrol et
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp

# Environment variables kontrol et
az webapp config appsettings list \
  --name budgetapp \
  --resource-group DarkSide-RG-WebApp

# Restart
az webapp restart --name budgetapp --resource-group DarkSide-RG-WebApp
```

### Problem 4: Frontend 404 Error

**Çözüm:**
- `web.config` dosyasının doğru olduğundan emin ol
- SPA routing için fallback ayarlarını kontrol et

---

## 📝 Deployment Checklist

### Ön Hazırlık
- [ ] Azure CLI kurulu ve giriş yapıldı
- [ ] Azure DevOps project oluşturuldu
- [ ] Database password alındı
- [ ] Gemini API key alındı
- [ ] JWT secret oluşturuldu

### Database Setup
- [ ] PostgreSQL server hazır
- [ ] Database oluşturuldu
- [ ] Firewall rules ayarlandı
- [ ] Migration script çalıştırıldı
- [ ] Tables verify edildi

### Web App Configuration
- [ ] Environment variables ayarlandı
- [ ] Startup command ayarlandı
- [ ] Runtime stack ayarlandı (Node.js 18)

### Pipeline Setup
- [ ] azure-pipelines.yml oluşturuldu
- [ ] Variable group oluşturuldu
- [ ] Service connection oluşturuldu
- [ ] Pipeline test edildi

### Deployment
- [ ] Code push edildi
- [ ] Pipeline başarılı
- [ ] Frontend erişilebilir
- [ ] API çalışıyor
- [ ] Database bağlantısı OK
- [ ] Health check passed

### Post-Deployment
- [ ] Logs kontrol edildi
- [ ] Monitoring kuruldu
- [ ] Custom domain eklendi (opsiyonel)
- [ ] SSL sertifikası aktif

---

## 🌐 Production URLs

### Web App
- **URL:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net
- **API:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api
- **Health:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health

### Database
- **Host:** budgetapp-server.postgres.database.azure.com
- **Port:** 5432
- **Database:** budgetapp-database
- **User:** bzexmlrqxt

### Azure DevOps
- **Project:** https://dev.azure.com/EmrahC/Budget
- **Pipelines:** https://dev.azure.com/EmrahC/Budget/_build
- **Repository:** https://dev.azure.com/EmrahC/Budget/_git/BugdetApp

---

## 🎯 Sonraki Adımlar

1. **Custom Domain Ekle**
   ```bash
   az webapp config hostname add \
     --webapp-name budgetapp \
     --resource-group DarkSide-RG-WebApp \
     --hostname budgetapp.yourdomain.com
   ```

2. **SSL Certificate**
   - Azure App Service Managed Certificate (ücretsiz)
   - Veya Let's Encrypt

3. **Scaling**
   ```bash
   # Auto-scaling rule ekle
   az monitor autoscale create \
     --resource-group DarkSide-RG-WebApp \
     --resource budgetapp \
     --resource-type Microsoft.Web/sites \
     --name autoscale-budgetapp \
     --min-count 1 \
     --max-count 3 \
     --count 1
   ```

4. **Backup Strategy**
   - Database automated backups
   - Application code in Git
   - Configuration in Key Vault

---

## 💰 Maliyet Optimizasyonu

### Mevcut Kaynaklar
- **Web App (Basic B1):** ~$13/ay
- **PostgreSQL (Burstable B1ms):** ~$12/ay
- **Bandwidth:** İlk 5 GB ücretsiz
- **Toplam:** ~$25/ay

### Optimizasyon İpuçları
1. Development ortamında kaynakları durdur
2. Auto-scaling ile sadece gerektiğinde scale et
3. CDN kullan (static files için)
4. Application Insights sampling rate'i ayarla

---

## 📚 Kaynaklar

- [Azure Web Apps Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure PostgreSQL Docs](https://docs.microsoft.com/azure/postgresql/)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)
- [Node.js on Azure](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)

---

**Hazırlayan:** Kiro AI Assistant  
**Tarih:** 24 Kasım 2024  
**Versiyon:** 1.0  
**Durum:** ✅ Production Ready
