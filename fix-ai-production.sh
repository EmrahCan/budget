#!/bin/bash
# Fix AI Analysis in Production
# Run this on Azure VM

echo "🤖 Fixing AI Analysis in Production"
echo "===================================="
echo ""

cd ~/budget

echo "1️⃣ Checking current .env.production..."
echo "----------------------------------------"
grep "GEMINI_API_KEY" backend/.env.production || echo "❌ GEMINI_API_KEY not found!"
echo ""

echo "2️⃣ Updating GEMINI_API_KEY..."
echo "----------------------------------------"
# Backup current .env
cp backend/.env.production backend/.env.production.backup

# Update or add GEMINI_API_KEY
if grep -q "GEMINI_API_KEY" backend/.env.production; then
    sed -i 's/GEMINI_API_KEY=.*/GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g/' backend/.env.production
    echo "✅ GEMINI_API_KEY updated"
else
    echo "GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g" >> backend/.env.production
    echo "✅ GEMINI_API_KEY added"
fi

# Ensure model is set correctly
if grep -q "GEMINI_MODEL" backend/.env.production; then
    sed -i 's/GEMINI_MODEL=.*/GEMINI_MODEL=gemini-1.5-pro/' backend/.env.production
else
    echo "GEMINI_MODEL=gemini-1.5-pro" >> backend/.env.production
fi

echo ""
echo "3️⃣ Verifying .env.production..."
echo "----------------------------------------"
grep "GEMINI" backend/.env.production
echo ""

echo "4️⃣ Restarting backend container..."
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml restart backend

echo ""
echo "⏳ Waiting for backend to start..."
sleep 15

echo ""
echo "5️⃣ Checking backend logs..."
echo "----------------------------------------"
docker logs budget_backend_prod --tail 30 | grep -i "gemini\|ai\|error" || echo "No AI-related logs found"

echo ""
echo "6️⃣ Testing AI health endpoint..."
echo "----------------------------------------"
curl -s http://localhost:5001/api/ai/health | jq '.' || echo "❌ AI health check failed"

echo ""
echo "7️⃣ Testing backend health..."
echo "----------------------------------------"
curl -s http://localhost:5001/health | jq '.' || echo "❌ Backend health check failed"

echo ""
echo "=================================="
echo "✅ AI Fix Completed!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Login to http://98.71.149.168:3000"
echo "2. Go to Reports page"
echo "3. Click on 'AI Analizi' tab"
echo "4. Check if AI analysis is working"
echo ""
echo "If still not working, check:"
echo "  - Backend logs: docker logs budget_backend_prod -f"
echo "  - Browser console for errors"
echo "  - Network tab in browser DevTools"
echo ""
