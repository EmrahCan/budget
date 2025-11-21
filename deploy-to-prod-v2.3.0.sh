#!/bin/bash

# Quick deployment script to copy and run deployment on production

echo "🚀 Deploying v2.3.0 to production..."
echo ""

# Copy deployment script to production
echo "📤 Copying deployment script to production..."
scp deploy-v2.3.0-to-production.sh obiwan@98.71.149.168:/home/azureuser/budget/

# SSH to production and run deployment
echo "🔗 Connecting to production and running deployment..."
ssh obiwan@98.71.149.168 << 'ENDSSH'
cd /home/azureuser/budget
chmod +x deploy-v2.3.0-to-production.sh
./deploy-v2.3.0-to-production.sh
ENDSSH

echo ""
echo "✅ Deployment completed!"
