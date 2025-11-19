#!/bin/bash
# Disable GitHub Actions auto-deployment

echo "🛑 Disabling GitHub Actions Auto-Deployment"
echo "==========================================="
echo ""

# Check if workflow file exists
if [ -f ".github/workflows/deploy-to-production.yml" ]; then
    echo "📝 Found workflow file: .github/workflows/deploy-to-production.yml"
    echo ""
    
    # Rename to disable it
    mv .github/workflows/deploy-to-production.yml .github/workflows/deploy-to-production.yml.disabled
    
    echo "✅ Workflow disabled (renamed to .yml.disabled)"
    echo ""
    echo "The workflow will no longer run automatically on push to main."
    echo ""
    echo "To re-enable later, rename it back:"
    echo "  mv .github/workflows/deploy-to-production.yml.disabled .github/workflows/deploy-to-production.yml"
    echo ""
else
    echo "⚠️  Workflow file not found"
    echo ""
fi

echo "📋 Next steps:"
echo "1. Commit this change: git add .github/workflows/"
echo "2. Commit: git commit -m 'Disable auto-deployment, switch to manual'"
echo "3. Push: git push origin main"
echo ""
echo "From now on, use manual-deploy-to-production.sh to deploy"
echo ""
