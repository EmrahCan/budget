#!/bin/bash

# Production Deployment Script
# Bu script güvenli ve kontrollü bir şekilde production'a deploy yapar

set -e  # Hata olursa dur

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonksiyonlar
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

# Banner
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Budget App - Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Pre-deployment Checks
log_info "Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running!"
    exit 1
fi
log_success "Docker is running"

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml not found!"
    exit 1
fi
log_success "docker-compose.prod.yml found"

# Check if .env.production exists
if [ ! -f "backend/.env.production" ]; then
    log_warning "backend/.env.production not found! Using defaults..."
fi

# Check for port conflicts
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    log_warning "Port 5001 is in use. Checking if it's our container..."
    PROCESS=$(lsof -Pi :5001 -sTCP:LISTEN -t)
    if docker ps --format '{{.Names}}' | grep -q budget_backend_prod; then
        log_info "Port 5001 is used by our backend container (OK)"
    else
        log_error "Port 5001 is used by another process (PID: $PROCESS)"
        log_info "Run: sudo kill -9 $PROCESS"
        exit 1
    fi
else
    log_success "Port 5001 is available"
fi

echo ""

# 2. Backup Current State
log_info "Creating backup of current state..."

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
if docker ps --format '{{.Names}}' | grep -q budget_database_prod; then
    log_info "Backing up database..."
    docker exec budget_database_prod pg_dump -U postgres budget_app_prod > "$BACKUP_DIR/database_backup.sql" 2>/dev/null || true
    log_success "Database backed up to $BACKUP_DIR/database_backup.sql"
fi

# Save current git commit
git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt" 2>/dev/null || true
log_success "Current commit saved"

echo ""

# 3. Pull Latest Code
log_info "Pulling latest code from GitHub..."
git fetch origin main
CURRENT_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    log_info "Already up to date"
else
    log_info "Updating from $CURRENT_COMMIT to $LATEST_COMMIT"
    git pull origin main
    log_success "Code updated"
fi

echo ""

# 4. Build Containers
log_info "Building Docker containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

log_success "Containers built successfully"

echo ""

# 5. Stop Old Containers
log_info "Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

log_success "Old containers stopped"

echo ""

# 6. Start New Containers
log_info "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

log_success "New containers started"

echo ""

# 7. Wait for Services
log_info "Waiting for services to be ready..."

# Wait for database
log_info "Waiting for database..."
for i in {1..30}; do
    if docker exec budget_database_prod pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Database failed to start"
        exit 1
    fi
    sleep 2
done

# Wait for backend
log_info "Waiting for backend..."
for i in {1..30}; do
    if curl -f http://localhost:5001/health > /dev/null 2>&1; then
        log_success "Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend failed to start"
        log_info "Check logs: docker logs budget_backend_prod"
        exit 1
    fi
    sleep 2
done

# Wait for frontend
log_info "Waiting for frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Frontend failed to start"
        log_info "Check logs: docker logs budget_frontend_prod"
        exit 1
    fi
    sleep 2
done

echo ""

# 8. Post-deployment Health Checks
log_info "Running post-deployment health checks..."

# Check container status
CONTAINERS=$(docker-compose -f docker-compose.prod.yml ps --services)
for container in $CONTAINERS; do
    STATUS=$(docker inspect -f '{{.State.Status}}' budget_${container}_prod 2>/dev/null || echo "not found")
    if [ "$STATUS" = "running" ]; then
        log_success "$container: running"
    else
        log_error "$container: $STATUS"
    fi
done

# Check database connections
DB_CONNECTIONS=$(docker exec budget_database_prod psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='budget_app_prod';" 2>/dev/null | tr -d ' ')
log_info "Database connections: $DB_CONNECTIONS"

# Check backend API
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    log_success "Backend API is responding"
else
    log_error "Backend API is not responding"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend is responding"
else
    log_error "Frontend is not responding"
fi

echo ""

# 9. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Services:"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔧 Backend:  http://localhost:5001"
echo "  💾 Database: localhost:5432"
echo ""
log_info "Useful commands:"
echo "  📊 View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  🔍 Check status: docker-compose -f docker-compose.prod.yml ps"
echo "  🛑 Stop all:     docker-compose -f docker-compose.prod.yml down"
echo "  🔄 Restart:      docker-compose -f docker-compose.prod.yml restart"
echo ""
log_info "Backup location: $BACKUP_DIR"
echo ""
log_info "To rollback, run: ./rollback.sh $BACKUP_DIR"
echo ""
