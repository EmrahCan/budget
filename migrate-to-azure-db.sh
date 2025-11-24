#!/bin/bash

# Azure PostgreSQL Migration Script
# Migrates local database schema to Azure PostgreSQL

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Azure Database Configuration
DB_HOST="budgetapp-server.postgres.database.azure.com"
DB_PORT="5432"
DB_NAME="budgetapp-database"
DB_USER="bzexmlrqxt"
DB_PASSWORD="${AZURE_DB_PASSWORD}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Azure PostgreSQL Database Migration                 ║${NC}"
echo -e "${BLUE}║   Budget App v2.0.0                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ AZURE_DB_PASSWORD environment variable gerekli!${NC}"
    echo ""
    echo "Kullanım:"
    echo "  export AZURE_DB_PASSWORD='your-password'"
    echo "  ./migrate-to-azure-db.sh"
    echo ""
    exit 1
fi

# Set PostgreSQL password
export PGPASSWORD=$DB_PASSWORD

# Test connection
echo -e "${BLUE}▶ Testing database connection...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo -e "${YELLOW}⚠ Firewall ayarlarını kontrol edin${NC}"
    unset PGPASSWORD
    exit 1
fi

# Backup existing data (optional)
echo ""
echo -e "${BLUE}▶ Creating backup...${NC}"
BACKUP_FILE="azure_db_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE 2>/dev/null || echo "No existing data to backup"
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    rm -f $BACKUP_FILE
    echo -e "${YELLOW}⚠ No backup created (database might be empty)${NC}"
fi

# Run migrations
echo ""
echo -e "${BLUE}▶ Running database migrations...${NC}"
echo ""

# 1. Main schema
echo -e "${BLUE}📊 Running main schema migration...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/schema.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Main schema migrated${NC}"
else
    echo -e "${YELLOW}⚠ Main schema already exists or error occurred${NC}"
fi

# 2. AI tables
echo -e "${BLUE}🤖 Running AI tables migration...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_ai_tables.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AI tables migrated${NC}"
else
    echo -e "${YELLOW}⚠ AI tables already exist or error occurred${NC}"
fi

# 3. Notification columns
echo -e "${BLUE}🔔 Running notification columns migration...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_notification_columns.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Notification columns migrated${NC}"
else
    echo -e "${YELLOW}⚠ Notification columns already exist or error occurred${NC}"
fi

# 4. User language preference
echo -e "${BLUE}🌍 Running user language preference migration...${NC}"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/database/migrations/add_user_language_preference.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✓ User language preference migrated${NC}"
else
    echo -e "${YELLOW}⚠ User language preference already exists or error occurred${NC}"
fi

# Verify tables
echo ""
echo -e "${BLUE}▶ Verifying tables...${NC}"
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $TABLE_COUNT tables in database${NC}"
    echo ""
    echo "Tables:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null | grep "public |" || true
else
    echo -e "${RED}✗ No tables found${NC}"
fi

# Clean up
unset PGPASSWORD

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Migration Completed Successfully!             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Database Information:${NC}"
echo -e "   Host: ${YELLOW}$DB_HOST${NC}"
echo -e "   Database: ${YELLOW}$DB_NAME${NC}"
echo -e "   User: ${YELLOW}$DB_USER${NC}"
echo ""
echo -e "${BLUE}🔗 Connection String:${NC}"
echo -e "   ${YELLOW}postgresql://$DB_USER:PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Update Web App environment variables"
echo "   2. Deploy application code"
echo "   3. Test the deployment"
echo ""
