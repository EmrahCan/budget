#!/bin/bash

echo "🧪 Testing CORS configuration..."
echo ""

# Test 1: OPTIONS preflight request
echo "1️⃣ Testing OPTIONS preflight request:"
curl -X OPTIONS http://localhost:5001/api/auth/login \
  -H "Origin: http://98.71.149.168" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -i

echo ""
echo ""

# Test 2: Actual POST request with CORS headers
echo "2️⃣ Testing POST request with CORS:"
curl -X POST http://localhost:5001/api/auth/login \
  -H "Origin: http://98.71.149.168" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -i

echo ""
echo ""

# Test 3: Check backend logs for CORS errors
echo "3️⃣ Recent backend logs:"
docker logs budget_backend_prod --tail 20
