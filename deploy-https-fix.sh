#!/bin/bash

echo "🚀 Deploying HTTPS fix to Azure VM..."
echo ""

# Azure VM details
VM_IP="98.71.149.168"
VM_USER="azureuser"

# 1. Copy fix script to VM
echo "📤 Uploading fix script to VM..."
scp fix-https-production.sh ${VM_USER}@${VM_IP}:~/

# 2. Execute on VM
echo "⚙️ Executing fix on VM..."
ssh ${VM_USER}@${VM_IP} << 'ENDSSH'
cd ~
chmod +x fix-https-production.sh

# Run the fix
./fix-https-production.sh

echo ""
echo "✅ HTTPS fix completed!"
echo ""
echo "🧪 Test now:"
echo "   https://budgetapp.site/login"
ENDSSH

echo ""
echo "✅ Deployment complete!"
