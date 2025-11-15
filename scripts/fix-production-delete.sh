#!/bin/bash
# Quick Fix for Production Account Delete Issue

echo "🔧 Fixing Account Delete Issue..."
echo ""

# 1. Check current directory
if [ ! -f "backend/middleware/validation.js" ]; then
    echo "❌ Error: Run this from the budget directory"
    echo "   cd ~/budget (or wherever your project is)"
    exit 1
fi

# 2. Backup current file
echo "📦 Creating backup..."
docker exec budget_backend_prod cp /app/middleware/validation.js /app/middleware/validation.js.backup 2>/dev/null || echo "⚠️  Backup skipped (file may not exist)"

# 3. Copy updated file
echo "📤 Copying updated validation.js..."
docker cp backend/middleware/validation.js budget_backend_prod:/app/middleware/validation.js

if [ $? -eq 0 ]; then
    echo "✅ File copied successfully"
else
    echo "❌ Failed to copy file"
    exit 1
fi

# 4. Restart backend
echo "🔄 Restarting backend..."
docker restart budget_backend_prod

# 5. Wait for startup
echo "⏳ Waiting for backend to start..."
sleep 8

# 6. Check health
echo "🏥 Checking health..."
HEALTH=$(docker exec budget_backend_prod curl -s http://localhost:5001/health 2>/dev/null | grep -o '"status":"OK"')

if [ ! -z "$HEALTH" ]; then
    echo "✅ Backend is healthy!"
else
    echo "⚠️  Backend may not be fully ready yet"
fi

echo ""
echo "✨ Fix applied! Please test account deletion now."
echo ""
echo "📊 To monitor logs:"
echo "   docker logs budget_backend_prod -f"
echo ""
echo "🔙 To rollback:"
echo "   docker exec budget_backend_prod cp /app/middleware/validation.js.backup /app/middleware/validation.js"
echo "   docker restart budget_backend_prod"
