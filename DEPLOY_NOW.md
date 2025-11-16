# Quick Deployment Commands for Azure VM

## 1. Connect to Azure VM
```bash
ssh azureuser@98.71.149.168
```

## 2. Navigate to project directory
```bash
cd ~/budget
```

## 3. Pull latest code
```bash
git pull origin main
```

## 4. Run database migration
```bash
# Copy migration file to database container
docker cp backend/database/migrations/add_fixed_payment_history.sql budget-db:/tmp/migration.sql

# Run migration
docker exec -it budget-db psql -U postgres -d budget_app -f /tmp/migration.sql
```

## 5. Rebuild and restart containers
```bash
# Stop containers
docker-compose down

# Rebuild backend
docker-compose build backend

# Start all containers
docker-compose up -d
```

## 6. Verify deployment
```bash
# Check container status
docker-compose ps

# Check backend logs
docker-compose logs --tail=50 backend

# Test health endpoint
curl http://localhost:5001/health
```

## 7. Test the new feature
```bash
# From your local machine, open browser:
# http://98.71.149.168

# Navigate to Fixed Payments page
# Switch to "List" view
# You should see checkboxes next to each payment
```

## Quick One-Liner (if you're confident)
```bash
ssh azureuser@98.71.149.168 "cd ~/budget && git pull origin main && docker cp backend/database/migrations/add_fixed_payment_history.sql budget-db:/tmp/migration.sql && docker exec budget-db psql -U postgres -d budget_app -f /tmp/migration.sql && docker-compose down && docker-compose build backend && docker-compose up -d && docker-compose ps"
```

## If Migration Fails
If you get "relation already exists" error, it means the table is already created. Just continue with container restart:
```bash
docker-compose down
docker-compose build backend
docker-compose up -d
```
