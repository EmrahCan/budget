#!/bin/bash

# Production Account Delete Test Script
# Bu script production'da hesap silme işlemini test eder

echo "🔍 Production Account Delete Test"
echo "=================================="
echo ""

# Production URL
PROD_URL="http://98.71.149.168"
API_URL="${PROD_URL}/api"

echo "📍 Testing against: $API_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check..."
HEALTH_RESPONSE=$(curl -s "${PROD_URL}/health")
echo "Response: $HEALTH_RESPONSE"
echo ""

# Test 2: Login to get token
echo "2️⃣ Getting authentication token..."
echo "Please enter your credentials:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtained successfully"
echo ""

# Test 3: Get accounts list
echo "3️⃣ Fetching accounts..."
ACCOUNTS_RESPONSE=$(curl -s -X GET "${API_URL}/accounts" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Accounts Response:"
echo "$ACCOUNTS_RESPONSE" | jq '.' 2>/dev/null || echo "$ACCOUNTS_RESPONSE"
echo ""

# Test 4: Try to delete an account (you'll need to provide the ID)
echo "4️⃣ Account Delete Test"
echo "Enter the account ID you want to test delete (or press Enter to skip):"
read ACCOUNT_ID

if [ ! -z "$ACCOUNT_ID" ]; then
  echo "Testing DELETE request for account ID: $ACCOUNT_ID"
  
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X DELETE "${API_URL}/accounts/${ACCOUNT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")
  
  HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
  RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS/d')
  
  echo "HTTP Status: $HTTP_STATUS"
  echo "Response Body:"
  echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
  echo ""
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Delete request successful!"
  elif [ "$HTTP_STATUS" = "400" ]; then
    echo "❌ Bad Request (400) - Validation error"
    echo "This is the issue we're trying to fix!"
  elif [ "$HTTP_STATUS" = "404" ]; then
    echo "⚠️  Account not found (404)"
  else
    echo "⚠️  Unexpected status code: $HTTP_STATUS"
  fi
else
  echo "Skipping delete test"
fi

echo ""
echo "=================================="
echo "Test completed!"
