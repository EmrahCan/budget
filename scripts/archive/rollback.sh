#!/bin/bash

# Rollback Script
# Bir önceki stabil versiyona geri dön

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
echo "🔄 Budget App - Rollback"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backup directory is provided
if [ -z "$1" ]; then
    log_error "Usage: ./rollback.sh <backup_directory>"
    echo ""
    log_info "Available backups:"
    ls -lt backups/ | grep ^d | head -5
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

log_warning "This will rollback to backup: $BACKUP_DIR"
read -p "Are you sure? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# 1. Stop current containers
log_info "Stopping current containers..."
docker-compose -f docker-compose.prod.yml down
log_success "Containers stopped"

# 2. Restore git commit
if [ -f "$BACKUP_DIR/git_commit.txt" ]; then
    COMMIT=$(cat "$BACKUP_DIR/git_commit.txt")
    log_info "Rolling back to commit: $COMMIT"
    git checkout $COMMIT
    log_success "Code rolled back"
else
    log_warning "No git commit found in backup"
fi

# 3. Restore database
if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
    log_info "Restoring database..."
    
    # Start only database
    docker-compose -f docker-compose.prod.yml up -d database
    
    # Wait for database
    for i in {1..30}; do
        if docker exec budget_database_prod pg_isready -U postgres > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Restore backup
    cat "$BACKUP_DIR/database_backup.sql" | docker exec -i budget_database_prod psql -U postgres budget_app_prod
    log_success "Database restored"
else
    log_warning "No database backup found"
fi

# 4. Rebuild and start containers
log_info "Rebuilding containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
log_success "Containers rebuilt"

log_info "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d
log_success "Containers started"

# 5. Wait for services
log_info "Waiting for services..."
sleep 10

# 6. Health check
log_info "Running health checks..."

if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    log_success "Backend is healthy"
else
    log_error "Backend health check failed"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend is healthy"
else
    log_error "Frontend health check failed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Rollback completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
