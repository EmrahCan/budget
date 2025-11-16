#!/bin/bash

echo "🔧 Fixing CORS issue in production..."

# Navigate to project directory
cd ~/budget

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild and restart backend
echo "🔄 Rebuilding backend container..."
docker-compose -f docker-compose.prod.yml up -d --build backend

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check backend health
echo "🏥 Checking backend health..."
curl http://localhost:5001/health

# Test CORS with preflight request
echo ""
echo "🧪 Testing CORS preflight..."
curl -X OPTIONS http://localhost:5001/api/auth/login \
  -H "Origin: http://98.71.149.168" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

echo ""
echo "✅ CORS fix deployed!"
echo ""
echo "🌐 Test login at: http://98.71.149.168"
