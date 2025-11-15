# Production Deployment Guide - Fixed Payment History

## Overview
This guide explains how to deploy the fixed payment history tracking feature to Azure VM production environment.

## Prerequisites
- SSH access to Azure VM (98.71.149.168)
- Docker and docker-compose running on Azure VM
- PostgreSQL database container running

## Deployment Steps

### Step 1: Connect to Azure VM
```bash
ssh azureuser@98.71.149.168
cd ~/budget
```

### Step 2: Pull Latest Code
```bash
git pull origin main
```

### Step 3: Run Database Migration

**Option A: Using Docker Exec (Recommended)**
```bash
# Copy migration file to database container
docker cp backend/database/migrations/add_fixed_payment_history.sql budget-db:/tmp/

# Run migration
docker exec -it budget-db psql -U postgres -d budget_app -f /tmp/add_fixed_payment_history.sql
```

**Option B: Using psql from Host**
```bash
# If psql is installed on host
PGPASSWORD=your_password psql -h localhost -U postgres -d budget_app -f backend/database/migrations/add_fixed_payment_history.sql
```

**Option C: Manual SQL Execution**
```bash
# Connect to database
docker exec -it budget-db psql -U postgres -d budget_app

# Then paste the SQL from add_fixed_payment_history.sql
# Or run: \i /path/to/add_fixed_payment_history.sql
```

### Step 4: Rebuild and Restart Containers
```bash
# Stop containers
docker-compose down

# Rebuild backend (to get new code)
docker-compose build backend

# Start all containers
docker-compose up -d

# Check status
docker-compose ps
```

### Step 5: Verify Deployment

**Check Container Logs:**
```bash
docker-compose logs -f backend
```

**Test Backend Health:**
```bash
curl http://localhost:5001/health
```

**Test New Endpoint:**
```bash
# Get a valid token first by logging in through frontend
# Then test the endpoint
curl -X GET "http://localhost:5001/api/fixed-payments/history/statistics?month=11&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Verification Checklist

- [ ] Code pulled successfully from GitHub
- [ ] Database migration completed without errors
- [ ] Docker containers rebuilt and running
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Can access fixed payments page
- [ ] Can see payment status checkboxes
- [ ] Can mark payments as paid/unpaid
- [ ] Payment statistics display correctly

## Rollback Plan

If something goes wrong:

### Rollback Code:
```bash
cd ~/budget
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
docker-compose down
docker-compose build backend
docker-compose up -d
```

### Rollback Database:
```bash
# Connect to database
docker exec -it budget-db psql -U postgres -d budget_app

# Drop the table
DROP TABLE IF EXISTS fixed_payment_history CASCADE;
```

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution:** Migration has already been applied. Skip this step.

### Issue: Containers won't start
**Solution:** 
```bash
docker-compose logs backend
docker-compose logs frontend
# Check for errors and fix configuration
```

### Issue: 404 errors on new endpoints
**Solution:**
```bash
# Restart backend container
docker-compose restart backend

# Check if routes are loaded
docker-compose logs backend | grep "fixed-payments"
```

### Issue: Database connection errors
**Solution:**
```bash
# Check database container
docker-compose ps budget-db

# Restart database if needed
docker-compose restart budget-db
```

## Post-Deployment Testing

### Test Scenarios:

1. **View Fixed Payments List:**
   - Navigate to Fixed Payments page
   - Switch to "List" view
   - Verify checkbox column appears

2. **Mark Payment as Paid:**
   - Click checkbox next to a payment
   - Verify success message
   - Verify statistics update

3. **Mark Payment as Unpaid:**
   - Uncheck a paid payment
   - Verify success message
   - Verify statistics update

4. **View Payment Statistics:**
   - Check summary card shows paid/unpaid counts
   - Verify completion rate percentage
   - Switch between months

5. **Check Payment History:**
   - View payment history for specific payment
   - Verify dates and amounts are correct

## Monitoring

### Key Metrics to Monitor:
- API response times for new endpoints
- Database query performance
- Error rates in logs
- User engagement with new feature

### Log Locations:
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f budget-db

# All logs
docker-compose logs -f
```

## Support

If you encounter issues:
1. Check logs first
2. Verify database migration was successful
3. Ensure all containers are running
4. Test API endpoints manually
5. Check browser console for frontend errors

## Feature Documentation

- API Documentation: `backend/FIXED_PAYMENT_HISTORY_API.md`
- Migration README: `backend/database/migrations/README_fixed_payment_history.md`
- Model Documentation: See `backend/models/FixedPaymentHistory.js`
