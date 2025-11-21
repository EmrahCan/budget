# Production Deployment Guide - v2.3.0

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

#### 3. Install Dependencies
```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../frontend
npm install --production
```

#### 4. Database Migration
```bash
psql -d budget_app << 'EOF'
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
EOF
```

#### 5. Build Frontend
```bash
cd /home/azureuser/budget/frontend
npm run build
```

#### 6. Restart Services
```bash
pm2 restart budget-backend
pm2 restart budget-frontend
```

#### 7. Generate Initial Notifications
```bash
cd /home/azureuser/budget/backend
node scripts/generate-notifications.js
```

## ✅ Post-Deployment Verification

### 1. Check Services Status
```bash
pm2 list
pm2 logs budget-backend --lines 50
pm2 logs budget-frontend --lines 50
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
psql -d budget_app -c "\d smart_notifications"
psql -d budget_app -c "SELECT COUNT(*) FROM smart_notifications WHERE is_dismissed = false;"
```

### 4. API Health Check
```bash
curl http://localhost:5001/api/health
curl http://localhost:5001/api/notifications/test
```

## 🔄 Rollback Plan

If issues occur, rollback to previous version:

```bash
# Stop services
pm2 stop budget-backend budget-frontend

# Restore backup
cd /home/azureuser
rm -rf budget
cp -r budget_backup_YYYYMMDD_HHMMSS budget

# Restart services
pm2 restart budget-backend budget-frontend
```

## 📊 Monitoring

### Key Metrics to Watch
- Response times for notification endpoints
- Database query performance
- Memory usage (notifications are cached)
- Error rates in logs

### Log Locations
- Backend: `pm2 logs budget-backend`
- Frontend: `pm2 logs budget-frontend`
- Database: Check PostgreSQL logs

## 🐛 Troubleshooting

### Notifications Not Showing
```bash
# Check if notifications exist
psql -d budget_app -c "SELECT COUNT(*) FROM smart_notifications;"

# Regenerate notifications
cd /home/azureuser/budget/backend
node scripts/generate-notifications.js

# Check API response
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/notifications
```

### Database Migration Issues
```bash
# Check if columns exist
psql -d budget_app -c "\d smart_notifications"

# Manually add if missing
psql -d budget_app << 'EOF'
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
EOF
```

### Service Won't Start
```bash
# Check logs
pm2 logs budget-backend --err
pm2 logs budget-frontend --err

# Restart with fresh logs
pm2 restart budget-backend --update-env
pm2 restart budget-frontend --update-env
```

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs`
2. Verify database: `psql -d budget_app`
3. Check service status: `pm2 list`
4. Review error messages in browser console

## 🎉 Success Criteria

Deployment is successful when:
- ✅ All services are running (pm2 list shows "online")
- ✅ Notification bell appears in header
- ✅ Dashboard widgets display data
- ✅ User delete works in admin panel
- ✅ Payment calendar loads without errors
- ✅ No errors in logs
- ✅ Database has new columns
- ✅ Notifications are generated

---

**Version:** v2.3.0  
**Date:** November 21, 2024  
**Deployed By:** [Your Name]  
**Status:** ⏳ Pending / ✅ Completed / ❌ Failed
