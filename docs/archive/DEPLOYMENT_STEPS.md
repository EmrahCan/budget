# 🚀 Azure Deployment - Hızlı Başlangıç

## ✅ Hazır Olan Kaynaklar

- ✅ **Web App:** budgetapp (Central US)
- ✅ **PostgreSQL:** budgetapp-server.postgres.database.azure.com
- ✅ **Database:** budgetapp-database
- ✅ **VNet:** budgetappVnet
- ✅ **Resource Group:** DarkSide-RG-WebApp

---

## 📋 Deployment Adımları (5 Adım)

### 1️⃣ Database Migration

```bash
# Database password'ü ayarla
export AZURE_DB_PASSWORD="your-database-password"

# Migration script'i çalıştır
./migrate-to-azure-db.sh
```

**Beklenen Çıktı:**
```
✓ Database connection successful
✓ Main schema migrated
✓ AI tables migrated
✓ Notification columns migrated
✓ User language preference migrated
✓ Found 17 tables in database
```

---

### 2️⃣ Web App Environment Variables

```bash
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
    WEBSITE_NODE_DEFAULT_VERSION="~18" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

---

### 3️⃣ Azure DevOps Pipeline Setup

#### A. Variable Group Oluştur

1. Azure DevOps'a git: https://dev.azure.com/EmrahC/Budget
2. Pipelines > Library > + Variable group
3. Name: `budget-app-production`
4. Variables ekle:
   - `DB_PASSWORD` (Secret) ✅
   - `JWT_SECRET` (Secret) ✅
   - `GEMINI_API_KEY` (Secret) ✅

#### B. Service Connection Oluştur

1. Project Settings > Service connections
2. New service connection > Azure Resource Manager
3. Service principal (automatic)
4. Subscription: Visual Studio Enterprise Aboneliği
5. Resource group: DarkSide-RG-WebApp
6. Name: `Azure-Budget-App`

#### C. Pipeline Oluştur

1. Pipelines > New Pipeline
2. Azure Repos Git
3. Repository: BugdetApp
4. Existing Azure Pipelines YAML file
5. Path: `/azure-pipelines.yml`
6. Save and run

---

### 4️⃣ Code Push (Trigger Deployment)

```bash
# Zaten push edildi! Pipeline otomatik başlayacak
# Azure DevOps'ta izle: https://dev.azure.com/EmrahC/Budget/_build
```

---

### 5️⃣ Verify Deployment

```bash
# Frontend check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net

# API health check
curl https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health

# Logs
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp
```

---

## 🎯 Production URLs

- **Frontend:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net
- **API:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api
- **Health:** https://budgetapp-bkabcabubzhmazbk.centralus-01.azurewebsites.net/api/health

---

## 📚 Detaylı Dokümantasyon

- **AZURE_DEVOPS_DEPLOYMENT_GUIDE.md** - Kapsamlı deployment rehberi
- **azure-pipelines.yml** - CI/CD pipeline konfigürasyonu
- **migrate-to-azure-db.sh** - Database migration scripti

---

## 🆘 Sorun Giderme

### Database Connection Hatası
```bash
# Firewall rule ekle
az postgres flexible-server firewall-rule create \
  --resource-group DarkSide-RG-WebApp \
  --name budgetapp-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Web App 500 Error
```bash
# Logs kontrol et
az webapp log tail --name budgetapp --resource-group DarkSide-RG-WebApp

# Restart
az webapp restart --name budgetapp --resource-group DarkSide-RG-WebApp
```

---

## ✅ Checklist

- [ ] Database migration tamamlandı
- [ ] Environment variables ayarlandı
- [ ] Azure DevOps variable group oluşturuldu
- [ ] Service connection oluşturuldu
- [ ] Pipeline çalıştırıldı
- [ ] Frontend erişilebilir
- [ ] API çalışıyor
- [ ] Database bağlantısı OK

---

**Hazır! Deployment başlasın! 🚀**
