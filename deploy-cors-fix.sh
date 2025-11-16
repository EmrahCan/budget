#!/bin/bash

echo "🔧 Deploying CORS fix to production..."

# Copy updated server.js to production
docker cp backend/server.js budget_backend_prod:/app/server.js

# Restart backend
echo "🔄 Restarting backend..."
docker restart budget_backend_prod

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check logs
echo "📋 Backend logs:"
docker logs --tail=20 budget_backend_prod

# Test CORS
echo -e "\n🧪 Testing CORS..."
curl -v -H "Origin: http://98.71.149.168:3000" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:5001/api/auth/login 2>&1 | grep -i "access-control"

echo -e "\n✅ CORS fix deployed!"
