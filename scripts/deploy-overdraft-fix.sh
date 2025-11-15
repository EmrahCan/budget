#!/bin/bash
# Deploy Overdraft Update Fix to Production

echo "🔧 Deploying Overdraft Update Fix to Production..."
echo ""

# 1. Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

echo "✅ Code updated"
echo ""

# 2. Copy updated files to backend container
echo "📤 Copying updated files to backend container..."

docker cp backend/models/Account.js budget_backend_prod:/app/models/Account.js
if [ $? -eq 0 ]; then
    echo "✅ Account.js copied"
else
    echo "❌ Failed to copy Account.js"
    exit 1
fi

docker cp backend/controllers/accountController.js budget_backend_prod:/app/controllers/accountController.js
if [ $? -eq 0 ]; then
    echo "✅ accountController.js copied"
else
    echo "❌ Failed to copy accountController.js"
    exit 1
fi

echo ""

# 3. Restart backend container
echo "🔄 Restarting backend container..."
docker restart budget_backend_prod

echo ""
echo "⏳ Waiting for backend to start..."
sleep 10

# 4. Check health
echo "🏥 Checking backend health..."
HEALTH=$(docker exec budget_backend_prod curl -s http://localhost:5001/health 2>/dev/null | grep -o '"status":"OK"')

if [ ! -z "$HEALTH" ]; then
    echo "✅ Backend is healthy!"
else
    echo "⚠️  Backend may not be fully ready yet"
fi

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📝 Changes deployed:"
echo "  • Overdraft account updates now work correctly"
echo "  • currentBalance field mapping fixed"
echo "  • interestRate field added to API response"
echo ""
echo "🌐 Test at: http://98.71.149.168"
echo "📊 Monitor logs: docker logs budget_backend_prod -f"
