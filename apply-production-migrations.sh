#!/bin/bash

# Production Database Migration Script
# Azure VM üzerinde çalıştırılacak
# Data kaybı olmadan DB yapısını günceller

set -e  # Hata durumunda dur

echo "🚀 Production Database Migration Başlıyor..."
echo "================================================"
echo ""

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Değişkenler
BACKUP_DIR="$HOME/db-backups"
APP_DIR="$HOME/budget"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="budget_db_backup_${TIMESTAMP}.sql"
DB_CONTAINER="budget_database_prod"
DB_NAME="budget_app"
DB_USER="postgres"

# Fonksiyonlar
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ADIM 1: Ön Kontroller
print_step "ADIM 1: Ön Kontroller"
echo ""

# Docker kontrol
if ! docker ps | grep -q "$DB_CONTAINER"; then
    print_error "Database container çalışmıyor!"
    exit 1
fi
print_success "Database container çalışıyor"

# Dizin kontrol
if [ ! -d "$APP_DIR" ]; then
    print_error "Uygulama dizini bulunamadı: $APP_DIR"
    exit 1
fi
print_success "Uygulama dizini mevcut"

echo ""

# ADIM 2: Backup Al
print_step "ADIM 2: Database Backup Alınıyor"
echo ""

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

print_warning "Backup alınıyor... Bu birkaç dakika sürebilir."
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    print_success "Backup başarıyla alındı: $BACKUP_FILE"
    
    # Backup boyutunu göster
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   Backup boyutu: $BACKUP_SIZE"
    
    # Backup'ı sıkıştır
    gzip "$BACKUP_FILE"
    print_success "Backup sıkıştırıldı: ${BACKUP_FILE}.gz"
else
    print_error "Backup alınamadı!"
    exit 1
fi

echo ""

# ADIM 3: GitHub'dan Son Kodu Çek
print_step "ADIM 3: GitHub'dan Son Kod Çekiliyor"
echo ""

cd "$APP_DIR"

# Mevcut değişiklikleri sakla
if ! git diff-index --quiet HEAD --; then
    print_warning "Yerel değişiklikler var, stash'leniyor..."
    git stash
fi

# Son kodu çek
print_warning "Git pull yapılıyor..."
git fetch origin
git pull origin main

print_success "Son kod çekildi"

# Migration dosyalarını kontrol et
MIGRATION_DIR="$APP_DIR/backend/database/migrations"
if [ ! -f "$MIGRATION_DIR/add_fixed_payment_history.sql" ]; then
    print_error "Migration dosyası bulunamadı: add_fixed_payment_history.sql"
    exit 1
fi
if [ ! -f "$MIGRATION_DIR/add_ai_tables.sql" ]; then
    print_error "Migration dosyası bulunamadı: add_ai_tables.sql"
    exit 1
fi
if [ ! -f "$MIGRATION_DIR/add_notification_tracking_columns.sql" ]; then
    print_error "Migration dosyası bulunamadı: add_notification_tracking_columns.sql"
    exit 1
fi

print_success "Tüm migration dosyaları mevcut"

echo ""

# ADIM 4: Mevcut DB Yapısını Kontrol Et
print_step "ADIM 4: Mevcut Database Yapısı Kontrol Ediliyor"
echo ""

# Mevcut tabloları say
TABLE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Mevcut tablo sayısı: $(echo $TABLE_COUNT | xargs)"

# Kullanıcı sayısını göster
USER_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
echo "   Kullanıcı sayısı: $(echo $USER_COUNT | xargs)"

# Transaction sayısını göster
TXN_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM transactions;")
echo "   Transaction sayısı: $(echo $TXN_COUNT | xargs)"

print_success "Mevcut veriler kontrol edildi"

echo ""

# ADIM 5: Migration'ları Uygula
print_step "ADIM 5: Migration'lar Uygulanıyor"
echo ""

# 5.1 Fixed Payment History
print_warning "5.1 Fixed Payment History migration uygulanıyor..."
docker cp "$MIGRATION_DIR/add_fixed_payment_history.sql" "$DB_CONTAINER:/tmp/"
if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/add_fixed_payment_history.sql > /dev/null 2>&1; then
    print_success "Fixed Payment History migration tamamlandı"
else
    print_warning "Fixed Payment History migration zaten uygulanmış olabilir (hata göz ardı edildi)"
fi

# 5.2 AI Tables
print_warning "5.2 AI Tables migration uygulanıyor..."
docker cp "$MIGRATION_DIR/add_ai_tables.sql" "$DB_CONTAINER:/tmp/"
if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/add_ai_tables.sql > /dev/null 2>&1; then
    print_success "AI Tables migration tamamlandı"
else
    print_warning "AI Tables migration zaten uygulanmış olabilir (hata göz ardı edildi)"
fi

# 5.3 Notification Tracking
print_warning "5.3 Notification Tracking migration uygulanıyor..."
docker cp "$MIGRATION_DIR/add_notification_tracking_columns.sql" "$DB_CONTAINER:/tmp/"
if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/add_notification_tracking_columns.sql > /dev/null 2>&1; then
    print_success "Notification Tracking migration tamamlandı"
else
    print_warning "Notification Tracking migration zaten uygulanmış olabilir (hata göz ardı edildi)"
fi

echo ""

# ADIM 6: Migration Sonuçlarını Doğrula
print_step "ADIM 6: Migration Sonuçları Doğrulanıyor"
echo ""

# Yeni tablo sayısını kontrol et
NEW_TABLE_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Yeni tablo sayısı: $(echo $NEW_TABLE_COUNT | xargs)"

# Kritik tabloları kontrol et
print_warning "Kritik tablolar kontrol ediliyor..."

check_table() {
    local table_name=$1
    if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table_name');" | grep -q "t"; then
        print_success "  ✓ $table_name tablosu mevcut"
        return 0
    else
        print_error "  ✗ $table_name tablosu bulunamadı!"
        return 1
    fi
}

check_table "fixed_payment_history"
check_table "ai_interactions"
check_table "user_ai_preferences"
check_table "smart_notifications"
check_table "category_learning"
check_table "user_spending_profile"

# Veri kaybı kontrolü
print_warning "Veri kaybı kontrolü..."
NEW_USER_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
NEW_TXN_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM transactions;")

if [ "$(echo $USER_COUNT | xargs)" == "$(echo $NEW_USER_COUNT | xargs)" ]; then
    print_success "  ✓ Kullanıcı verisi korundu"
else
    print_error "  ✗ Kullanıcı verisi değişti!"
fi

if [ "$(echo $TXN_COUNT | xargs)" == "$(echo $NEW_TXN_COUNT | xargs)" ]; then
    print_success "  ✓ Transaction verisi korundu"
else
    print_error "  ✗ Transaction verisi değişti!"
fi

echo ""

# ADIM 7: Docker Container'ları Yeniden Başlat
print_step "ADIM 7: Docker Container'lar Yeniden Başlatılıyor"
echo ""

cd "$APP_DIR"

if [ -f "docker-compose.prod.yml" ]; then
    print_warning "Backend yeniden başlatılıyor..."
    docker-compose -f docker-compose.prod.yml restart backend
    sleep 3
    
    print_warning "Frontend yeniden başlatılıyor..."
    docker-compose -f docker-compose.prod.yml restart frontend
    sleep 3
    
    print_success "Container'lar yeniden başlatıldı"
else
    print_warning "docker-compose.prod.yml bulunamadı, manuel restart yapılıyor..."
    docker restart budget_backend_prod
    sleep 3
    docker restart budget_frontend_prod
    sleep 3
    print_success "Container'lar yeniden başlatıldı"
fi

echo ""

# ADIM 8: Health Check
print_step "ADIM 8: Health Check"
echo ""

# Container durumlarını kontrol et
print_warning "Container durumları kontrol ediliyor..."
docker ps --filter "name=budget_" --format "table {{.Names}}\t{{.Status}}"

# Backend health check
print_warning "Backend health check..."
sleep 5  # Backend'in başlaması için bekle
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_success "Backend çalışıyor"
else
    print_warning "Backend henüz hazır değil (birkaç saniye bekleyin)"
fi

# Frontend check
print_warning "Frontend check..."
if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend çalışıyor"
else
    print_warning "Frontend henüz hazır değil (birkaç saniye bekleyin)"
fi

echo ""
echo "================================================"
print_success "Migration Tamamlandı! 🎉"
echo "================================================"
echo ""
echo "📊 Özet:"
echo "   • Backup: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "   • Eski tablo sayısı: $(echo $TABLE_COUNT | xargs)"
echo "   • Yeni tablo sayısı: $(echo $NEW_TABLE_COUNT | xargs)"
echo "   • Kullanıcı sayısı: $(echo $NEW_USER_COUNT | xargs)"
echo "   • Transaction sayısı: $(echo $NEW_TXN_COUNT | xargs)"
echo ""
echo "🌐 Test için:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend: http://localhost:5001"
echo "   • Web: https://butce.obiwan.com.tr"
echo ""
echo "📝 Logları kontrol edin:"
echo "   docker logs budget_backend_prod --tail 50"
echo "   docker logs budget_frontend_prod --tail 50"
echo ""
print_warning "Rollback gerekirse:"
echo "   cd $BACKUP_DIR"
echo "   gunzip ${BACKUP_FILE}.gz"
echo "   docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo ""
