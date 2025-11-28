#!/bin/bash

# Quick deployment - just push changes and deploy
# Usage: ./quick-deploy.sh "commit message"

set -e

COMMIT_MSG="${1:-Quick update}"
PROD_SERVER="obiwan@51.137.126.90"

echo "📝 Committing changes..."
git add .
git commit -m "$COMMIT_MSG" || echo "No changes to commit"
git push origin main

echo "🚀 Deploying to production..."
ssh ${PROD_SERVER} << 'ENDSSH'
cd ~/budget-app
git pull origin main

# Build frontend
cd frontend
npm install
npm run build

# Copy to nginx
sudo rm -rf /var/www/budget-app/frontend/build
sudo cp -r build /var/www/budget-app/frontend/
sudo chown -R www-data:www-data /var/www/budget-app/frontend/build

# Restart services
cd ~/budget-app
docker-compose -f docker-compose.azure-prod.yml restart backend

echo "✅ Deployment complete!"
ENDSSH

echo "✅ Done! Visit: https://budgetapp.site"
