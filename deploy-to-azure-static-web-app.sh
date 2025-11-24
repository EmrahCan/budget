#!/bin/bash

# Azure Static Web App Deployment Script
# Bu script tüm deployment sürecini otomatikleştirir

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigürasyon
RESOURCE_GROUP="budget-app-rg"
LOCATION="westeurope"
STATIC_WEB_APP_NAME="budget-app-static"
DB_SERVER_NAME="budget-app-db-server"
DB_NAME="budget_app"
DB_USER="budgetadmin"
DB_PASSWORD=""  # Kullanıcıdan alınacak
GITHUB_REPO="https://github.com/EmrahCan/budget"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Azure Static Web App Deployment Script              ║${NC}"
echo -e "${BLUE}║   Budget App - Full Stack Deployment                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonksiyonlar
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Azure CLI kontrolü
print_step "Checking Azure CLI..."
if ! command -v az &> /dev/null; then
    print_error "Azure CLI bulunamadı. Lütfen yükleyin: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi
print_success "Azure CLI bulundu"

# Azure login kontrolü
print_step "Checking Azure login status..."
if ! az account show &> /dev/null; then
    print_warning "Azure'a giriş yapılmamış. Giriş yapılıyor..."
    az login
fi
print_success "Azure'a giriş yapıldı"

# Subscription seçimi
print_step "Selecting Azure subscription..."
SUBSCRIPTIONS=$(az account list --query "[].{Name:name, ID:id}" -o table)
echo "$SUBSCRIPTIONS"
echo ""
read -p "Subscription ID girin (Enter = default): " SUBSCRIPTION_ID
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    az account set --subscription "$SUBSCRIPTION_ID"
fi
CURRENT_SUB=$(az account show --query name -o tsv)
print_success "Aktif subscription: $CURRENT_SUB"

# Database password al
print_step "Database Configuration"
while [ -z "$DB_PASSWORD" ]; do
    read -sp "PostgreSQL admin password girin (min 8 karakter): " DB_PASSWORD
    echo ""
    if [ ${#DB_PASSWORD} -lt 8 ]; then
        print_error "Password en az 8 karakter olmalı"
        DB_PASSWORD=""
    fi
done
print_success "Password alındı"

# Gemini API Key al
print_step "AI Configuration"
read -p "Gemini API Key girin: " GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    print_warning "Gemini API Key girilmedi. AI özellikleri çalışmayacak."
fi

# JWT Secret oluştur
JWT_SECRET=$(openssl rand -base64 32)
print_success "JWT Secret oluşturuldu"

# Resource Group oluştur
print_step "Creating Resource Group..."
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource Group zaten mevcut"
else
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output none
    print_success "Resource Group oluşturuldu: $RESOURCE_GROUP"
fi

# PostgreSQL Database oluştur
print_step "Creating PostgreSQL Database (bu işlem 5-10 dakika sürebilir)..."
if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $DB_SERVER_NAME &> /dev/null; then
    print_warning "PostgreSQL server zaten mevcut"
else
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $DB_SERVER_NAME \
        --location $LOCATION \
        --admin-user $DB_USER \
        --admin-password "$DB_PASSWORD" \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --version 14 \
        --storage-size 32 \
        --public-access 0.0.0.0 \
        --output none
    print_success "PostgreSQL server oluşturuldu"
fi

# Database oluştur
print_step "Creating database..."
if az postgres flexible-server db show --resource-group $RESOURCE_GROUP --server-name $DB_SERVER_NAME --database-name $DB_NAME &> /dev/null; then
    print_warning "Database zaten mevcut"
else
    az postgres flexible-server db create \
        --resource-group $RESOURCE_GROUP \
        --server-name $DB_SERVER_NAME \
        --database-name $DB_NAME \
        --output none
    print_success "Database oluşturuldu: $DB_NAME"
fi

# Firewall rule ekle
print_step "Configuring firewall rules..."
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none 2>/dev/null || true
print_success "Firewall rules yapılandırıldı"

# Database schema migrate et
print_step "Migrating database schema..."
DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
export PGPASSWORD="$DB_PASSWORD"

echo "Connecting to database..."
if psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -c "SELECT 1" &> /dev/null; then
    print_success "Database bağlantısı başarılı"
    
    echo "Running schema migration..."
    psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f backend/database/schema.sql &> /dev/null
    print_success "Schema migration tamamlandı"
    
    echo "Running AI tables migration..."
    psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_ai_tables.sql &> /dev/null 2>&1 || true
    
    echo "Running notification migration..."
    psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_notification_columns.sql &> /dev/null 2>&1 || true
    
    echo "Running language preference migration..."
    psql -h $DB_HOST -p 5432 -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_user_language_preference.sql &> /dev/null 2>&1 || true
    
    print_success "Tüm migrations tamamlandı"
else
    print_error "Database bağlantısı başarısız. Lütfen firewall ayarlarını kontrol edin."
fi

unset PGPASSWORD

# Static Web App oluştur
print_step "Creating Static Web App..."
if az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Static Web App zaten mevcut"
else
    print_warning "GitHub ile authentication gerekli. Tarayıcı açılacak..."
    az staticwebapp create \
        --name $STATIC_WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --source $GITHUB_REPO \
        --branch main \
        --app-location "/frontend" \
        --api-location "/backend" \
        --output-location "build" \
        --login-with-github
    print_success "Static Web App oluşturuldu"
fi

# Environment variables ayarla
print_step "Configuring environment variables..."
az staticwebapp appsettings set \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --setting-names \
        DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com" \
        DB_PORT="5432" \
        DB_NAME="$DB_NAME" \
        DB_USER="$DB_USER" \
        DB_PASSWORD="$DB_PASSWORD" \
        JWT_SECRET="$JWT_SECRET" \
        JWT_EXPIRES_IN="7d" \
        NODE_ENV="production" \
        GEMINI_API_KEY="$GEMINI_API_KEY" \
        GEMINI_MODEL="gemini-2.5-flash" \
        AI_CATEGORIZATION_ENABLED="true" \
        AI_INSIGHTS_ENABLED="true" \
        AI_RECOMMENDATIONS_ENABLED="true" \
        AI_NL_QUERIES_ENABLED="true" \
        AI_RATE_LIMIT="60" \
        AI_CACHE_ENABLED="true" \
        AI_CACHE_TTL="3600" \
        AI_USE_MOCK_DATA="false" \
    --output none
print_success "Environment variables ayarlandı"

# Deployment token al
print_step "Getting deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.apiKey" \
    --output tsv)

# Static Web App URL al
STATIC_WEB_APP_URL=$(az staticwebapp show \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" \
    --output tsv)

# Özet bilgileri göster
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Başarıyla Tamamlandı!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Bilgileri:${NC}"
echo -e "   Resource Group: ${YELLOW}$RESOURCE_GROUP${NC}"
echo -e "   Location: ${YELLOW}$LOCATION${NC}"
echo ""
echo -e "${BLUE}🌐 Static Web App:${NC}"
echo -e "   Name: ${YELLOW}$STATIC_WEB_APP_NAME${NC}"
echo -e "   URL: ${GREEN}https://$STATIC_WEB_APP_URL${NC}"
echo ""
echo -e "${BLUE}💾 Database:${NC}"
echo -e "   Server: ${YELLOW}${DB_SERVER_NAME}.postgres.database.azure.com${NC}"
echo -e "   Database: ${YELLOW}$DB_NAME${NC}"
echo -e "   User: ${YELLOW}$DB_USER${NC}"
echo ""
echo -e "${BLUE}🔑 GitHub Secret:${NC}"
echo -e "   GitHub repository settings > Secrets and variables > Actions'a gidin"
echo -e "   Yeni secret oluşturun:"
echo -e "   Name: ${YELLOW}AZURE_STATIC_WEB_APPS_API_TOKEN${NC}"
echo -e "   Value: ${YELLOW}$DEPLOYMENT_TOKEN${NC}"
echo ""
echo -e "${BLUE}📝 Sonraki Adımlar:${NC}"
echo "   1. GitHub secret'ı yukarıdaki bilgilerle ekleyin"
echo "   2. Kodu GitHub'a push edin (otomatik deploy başlayacak)"
echo "   3. Deployment'ı GitHub Actions'da takip edin"
echo "   4. Uygulamayı test edin: https://$STATIC_WEB_APP_URL"
echo ""
echo -e "${BLUE}🔧 Yönetim Komutları:${NC}"
echo "   # Logs görüntüle:"
echo "   az staticwebapp logs show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "   # Environment variables listele:"
echo "   az staticwebapp appsettings list --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "   # Database'e bağlan:"
echo "   psql \"postgresql://$DB_USER:PASSWORD@${DB_SERVER_NAME}.postgres.database.azure.com:5432/$DB_NAME?sslmode=require\""
echo ""
echo -e "${GREEN}✨ Deployment tamamlandı! İyi çalışmalar!${NC}"
echo ""

# Deployment bilgilerini dosyaya kaydet
cat > AZURE_DEPLOYMENT_INFO.txt << EOF
Azure Static Web App Deployment Information
Generated: $(date)

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

Static Web App:
  Name: $STATIC_WEB_APP_NAME
  URL: https://$STATIC_WEB_APP_URL

Database:
  Server: ${DB_SERVER_NAME}.postgres.database.azure.com
  Database: $DB_NAME
  User: $DB_USER
  Connection String: postgresql://$DB_USER:PASSWORD@${DB_SERVER_NAME}.postgres.database.azure.com:5432/$DB_NAME?sslmode=require

GitHub Secret:
  Name: AZURE_STATIC_WEB_APPS_API_TOKEN
  Value: $DEPLOYMENT_TOKEN

Management Commands:
  View logs: az staticwebapp logs show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP --follow
  List settings: az staticwebapp appsettings list --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP
  Connect to DB: psql "postgresql://$DB_USER:PASSWORD@${DB_SERVER_NAME}.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"
EOF

print_success "Deployment bilgileri AZURE_DEPLOYMENT_INFO.txt dosyasına kaydedildi"
