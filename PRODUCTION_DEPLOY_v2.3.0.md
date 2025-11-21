# Production Deployment Guide - v2.3.0 (Docker)

## 🎯 Quick Deploy

### Option 1: Automated Script (Recommended)
```bash
# SSH to production server
ssh azureuser@your-server-ip

# Download and run deployment script
cd /home/azureuser/budget
git pull origin main
chmod +x deploy-v2.3.0-to-production.sh
./deploy-v2.3.0-to-production.sh
```

### Option 2: Manual Deployment

#### 1. Backup Current Version
```bash
cd /home/azureuser
cp -r budget budget_backup_$(date +%Y%m%d_%H%M%S)
```

#### 2. Pull Latest Code
```bash
cd /home/azureuser/budget
git fetch --all --tags
git checkout tags/v2.3.0
```

#### 3. Database Migration
```bash
# Run migration inside the database container
docker-compose exec -T db psql -U postgres -d budget_app << 'EOF'
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
EOF
```

#### 4. Rebuild and Restart Containers
```bash
cd /home/azureuser/budget

# Stop containers
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Start containers
docker-compose up -d
```

#### 5. Wait for Services
```bash
# Wait for backend to be ready
sleep 10
docker-compose exec backend curl http://localhost:5001/api/health
```

#### 6. Generate Initial Notifications
```bash
docker-compose exec backend node scripts/generate-notifications.js
```

## ✅ Post-Deployment Verification

### 1. Check Services Status
```bash
docker-compose ps
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

### 2. Test New Features

#### Notification System
- [ ] Open application and check notification bell in header
- [ ] Verify badge counter shows correct number
- [ ] Click bell and check notifications dropdown
- [ ] Test mark as read functionality
- [ ] Test dismiss notification

#### Dashboard Widgets
- [ ] Check "Gecikmiş Ödemeler" widget appears
- [ ] Verify overdue payment data is correct
- [ ] Check "Yaklaşan Ödemeler ve Uyarılar" widget
- [ ] Verify upcoming payments show correctly

#### User Management
- [ ] Login as admin
- [ ] Go to User Management page
- [ ] Verify delete button appears for users
- [ ] Test delete confirmation dialog
- [ ] Verify user cannot delete themselves

#### Payment Calendar
- [ ] Navigate to /payment-calendar
- [ ] Verify calendar loads without errors
- [ ] Check data displays correctly
- [ ] Test month/year selection

### 3. Database Verification
```bash
docker-compose exec db psql -U postgres -d budget_app -c "\d smart_notifications"
docker-compose exec db psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM smart_notifications WHERE is_dismissed = false;"
```

### 4. API Health Check
```bash
docker-compose exec backend curl http://localhost:5001/api/health
docker-compose exec backend curl http://localhost:5001/api/notifications/test
```

## 🔄 Rollback Plan

If issues occur, rollback to previous version:

```bash
# Stop containers
cd /home/azureuser/budget
docker-compose down

# Restore backup
cd /home/azureuser
rm -rf budget
cp -r budget_backup_YYYYMMDD_HHMMSS budget

# Restart containers
cd budget
docker-compose up -d
```

## 📊 Monitoring

### Key Metrics to Watch
- Response times for notification endpoints
- Database query performance
- Memory usage (notifications are cached)
- Error rates in logs

### Log Locations
- Backend: `docker-compose logs -f backend`
- Frontend: `docker-compose logs -f frontend`
- Database: `docker-compose logs -f db`
- All services: `docker-compose logs -f`

## 🐛 Troubleshooting

### Notifications Not Showing
```bash
# Check if notifications exist
docker-compose exec db psql -U postgres -d budget_app -c "SELECT COUNT(*) FROM smart_notifications;"

# Regenerate notifications
docker-compose exec backend node scripts/generate-notifications.js

# Check API response
docker-compose exec backend curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/notifications
```

### Database Migration Issues
```bash
# Check if columns exist
docker-compose exec db psql -U postgres -d budget_app -c "\d smart_notifications"

# Manually add if missing
docker-compose exec -T db psql -U postgres -d budget_app << 'EOF'
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
EOF
```

### Service Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart containers
docker-compose restart backend
docker-compose restart frontend

# Full restart if needed
docker-compose down
docker-compose up -d
```

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify database: `docker-compose exec db psql -U postgres -d budget_app`
3. Check service status: `docker-compose ps`
4. Review error messages in browser console

## 🎉 Success Criteria

Deployment is successful when:
- ✅ All containers are running (`docker-compose ps` shows "Up")
- ✅ Notification bell appears in header
- ✅ Dashboard widgets display data
- ✅ User delete works in admin panel
- ✅ Payment calendar loads without errors
- ✅ No errors in logs
- ✅ Database has new columns
- ✅ Notifications are generated

## 🐳 Docker-Specific Commands

### View Container Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Execute Commands in Containers
```bash
# Backend
docker-compose exec backend npm run <command>

# Database
docker-compose exec db psql -U postgres -d budget_app

# Shell access
docker-compose exec backend sh
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Clean Rebuild
```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

---

**Version:** v2.3.0  
**Date:** November 21, 2024  
**Deployed By:** [Your Name]  
**Status:** ⏳ Pending / ✅ Completed / ❌ Failed
