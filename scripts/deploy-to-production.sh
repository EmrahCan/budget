#!/bin/bash

# Production Deployment Script
# Usage: ./deploy-to-production.sh

set -e

PROD_SERVER="obiwan@51.137.126.90"
PROD_PATH="~/budget-app"

echo "🚀 Starting deployment to production..."

# 1. Build frontend locally
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# 2. Sync files to production
echo "📤 Uploading files to production..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  --exclude '.env.development' \
  ./ ${PROD_SERVER}:${PROD_PATH}/

# 3. Deploy on production server
echo "🔧 Deploying on production server..."
ssh ${PROD_SERVER} << 'ENDSSH'
cd ~/budget-app

# Copy frontend build to nginx directory
sudo rm -rf /var/www/budget-app/frontend/build
sudo cp -r frontend/build /var/www/budget-app/frontend/
sudo chown -R www-data:www-data /var/www/budget-app/frontend/build

# Restart backend if needed
cd ~/budget-app
docker-compose -f docker-compose.azure-prod.yml restart backend

echo "✅ Deployment complete!"
ENDSSH

echo "✅ Production deployment finished!"
echo "🌐 Visit: https://budgetapp.site"
