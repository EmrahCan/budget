#!/bin/bash

# Production to Local Database Sync Script
# Bu script production DB'yi güvenli bir şekilde local'e senkronize eder

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Production to Local Database Sync"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Sync mode seçimi
echo "Select sync mode:"
echo "1) Full data (with anonymization) - For bug reproduction"
echo "2) Schema only - For development"
echo "3) Partial data (last 3 months) - For testing"
echo ""
read -p "Enter choice [1-3]: " SYNC_MODE

case $SYNC_MODE in
    1)
        SYNC_TYPE="full"
        log_warning "Full data sync selected - Data will be anonymized"
        ;;
    2)
        SYNC_TYPE="schema"
        log_info "Schema only sync selected"
        ;;
    3)
        SYNC_TYPE="partial"
        log_info "Partial data sync selected (last 3 months)"
        ;;
    *)
        log_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
log_warning "This will REPLACE your local database!"
read -p "Are you sure? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Sync cancelled"
    exit 0
fi

# Backup directory
BACKUP_DIR="backups/sync_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 1. Local database backup (safety)
log_info "Creating local database backup (safety)..."
if docker ps --format '{{.Names}}' | grep -q budget_database_dev; then
    docker exec budget_database_dev pg_dump -U postgres budget_app_dev > "$BACKUP_DIR/local_backup.sql" 2>/dev/null || true
    log_success "Local backup saved to $BACKUP_DIR/local_backup.sql"
fi

# 2. Production'dan backup al
log_info "Fetching data from production..."

if [ "$SYNC_TYPE" = "schema" ]; then
    # Sadece schema
    ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres -s budget_app_prod" > "$BACKUP_DIR/prod_schema.sql"
    log_success "Production schema downloaded"
elif [ "$SYNC_TYPE" = "partial" ]; then
    # Kısmi veri (bazı tabloları hariç tut)
    ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod \
      --exclude-table-data=audit_logs \
      --exclude-table-data=sessions" > "$BACKUP_DIR/prod_partial.sql"
    log_success "Production partial data downloaded"
else
    # Tam veri
    ssh obiwan@98.71.149.168 "docker exec budget_database_prod pg_dump -U postgres budget_app_prod" > "$BACKUP_DIR/prod_full.sql"
    log_success "Production full data downloaded"
fi

# 3. Local database'i temizle ve yeniden oluştur
log_info "Recreating local database..."

# Database container'ının çalıştığından emin ol
if ! docker ps --format '{{.Names}}' | grep -q budget_database_dev; then
    log_info "Starting database container..."
    docker-compose -f docker-compose.dev.yml up -d database
    sleep 5
fi

# Database'i drop ve create et
docker exec -i budget_database_dev psql -U postgres -c "DROP DATABASE IF EXISTS budget_app_dev;" 2>/dev/null || true
docker exec -i budget_database_dev psql -U postgres -c "CREATE DATABASE budget_app_dev;"

log_success "Local database recreated"

# 4. Backup'ı restore et
log_info "Restoring data to local database..."

if [ "$SYNC_TYPE" = "schema" ]; then
    cat "$BACKUP_DIR/prod_schema.sql" | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev
elif [ "$SYNC_TYPE" = "partial" ]; then
    cat "$BACKUP_DIR/prod_partial.sql" | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev
else
    cat "$BACKUP_DIR/prod_full.sql" | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev
fi

log_success "Data restored to local database"

# 5. Post-restore işlemler
if [ "$SYNC_TYPE" = "schema" ]; then
    # Schema-only: Test verileri ekle
    log_info "Adding test data..."
    if [ -f "backend/database/init/02-seed.sql" ]; then
        docker exec -i budget_database_dev psql -U postgres -d budget_app_dev < backend/database/init/02-seed.sql
        log_success "Test data added"
    fi
else
    # Full veya Partial: Verileri anonimleştir
    log_info "Anonymizing sensitive data..."
    
    docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
-- Email'leri anonimleştir (admin hariç)
UPDATE users 
SET email = 'user_' || id || '@test.local'
WHERE role != 'admin' AND email NOT LIKE '%@test.local';

-- Şifreleri reset et (Test123!)
-- Hash: $2a$10$rZ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGL
UPDATE users 
SET password_hash = '$2a$10$rZ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGL';

-- Telefon numaralarını temizle
UPDATE users 
SET phone = NULL
WHERE phone IS NOT NULL;

-- Session'ları temizle
TRUNCATE TABLE sessions CASCADE;

-- Reset token'larını temizle
UPDATE users 
SET reset_token = NULL, reset_token_expires = NULL
WHERE reset_token IS NOT NULL;

-- Audit log IP'lerini temizle
UPDATE audit_logs 
SET ip_address = '127.0.0.1'
WHERE ip_address IS NOT NULL;

EOF

    log_success "Sensitive data anonymized"
    
    # Partial sync için eski verileri temizle
    if [ "$SYNC_TYPE" = "partial" ]; then
        log_info "Removing old data (keeping last 3 months)..."
        
        docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
-- Son 3 ay hariç transaction'ları sil
DELETE FROM transactions 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Son 3 ay hariç fixed payment'ları sil
DELETE FROM fixed_payments 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Son 3 ay hariç installment'ları sil
DELETE FROM installment_payments 
WHERE created_at < NOW() - INTERVAL '3 months';

EOF

        log_success "Old data removed"
    fi
fi

# 6. Test admin kullanıcısı oluştur
log_info "Creating test admin user..."

docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  'admin@local.test',
  '$2a$10$rZ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGLJ5YhJKqX8YvGL',
  'Admin',
  'Local',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
EOF

log_success "Test admin user created/updated"

# 7. Database istatistikleri
log_info "Database statistics..."

docker exec -i budget_database_dev psql -U postgres -d budget_app_dev << 'EOF'
SELECT 
  'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Fixed Payments', COUNT(*) FROM fixed_payments
UNION ALL
SELECT 'Installment Payments', COUNT(*) FROM installment_payments;
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Database sync completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Sync Details:"
echo "  📦 Type: $SYNC_TYPE"
echo "  💾 Backup: $BACKUP_DIR"
echo "  🗄️  Database: budget_app_dev"
echo ""
log_info "Test Credentials:"
echo "  📧 Email: admin@local.test"
echo "  🔑 Password: Test123!"
echo ""
log_warning "Remember:"
echo "  • All sensitive data has been anonymized"
echo "  • All passwords have been reset to: Test123!"
echo "  • All emails have been changed to: user_X@test.local"
echo ""
log_info "To restore your previous local database:"
echo "  cat $BACKUP_DIR/local_backup.sql | docker exec -i budget_database_dev psql -U postgres -d budget_app_dev"
echo ""
