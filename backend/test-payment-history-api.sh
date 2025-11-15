#!/bin/bash

# Test script for Fixed Payment History API
# Make sure the server is running on port 5001

BASE_URL="http://localhost:5001/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJlbXJhaEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzMxNzA4NTI3LCJleHAiOjE3MzIzMTMzMjd9.Ql5aBqYqQqYqQqYqQqYqQqYqQqYqQqYqQqYqQqYqQqY"

echo "🧪 Testing Fixed Payment History API"
echo "===================================="
echo ""

# Test 1: Get monthly status with history
echo "Test 1: Get monthly status with history (January 2024)"
curl -s -X GET "$BASE_URL/fixed-payments/history/monthly-status?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Get payment statistics
echo "Test 2: Get payment statistics (January 2024)"
curl -s -X GET "$BASE_URL/fixed-payments/history/statistics?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Get unpaid payments
echo "Test 3: Get unpaid payments (January 2024)"
curl -s -X GET "$BASE_URL/fixed-payments/history/unpaid?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Test 4: Mark payment as paid (payment ID 21)
echo "Test 4: Mark payment as paid (ID: 21)"
curl -s -X POST "$BASE_URL/fixed-payments/21/mark-paid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 1,
    "year": 2024,
    "paidAmount": 32323424,
    "notes": "Paid via API test"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 5: Get paid payments
echo "Test 5: Get paid payments (January 2024)"
curl -s -X GET "$BASE_URL/fixed-payments/history/paid?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Test 6: Get payment history for specific payment
echo "Test 6: Get payment history for payment ID 21"
curl -s -X GET "$BASE_URL/fixed-payments/21/history" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Test 7: Mark payment as unpaid
echo "Test 7: Mark payment as unpaid (ID: 21)"
curl -s -X POST "$BASE_URL/fixed-payments/21/mark-unpaid" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 1,
    "year": 2024
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 8: Get overdue payments
echo "Test 8: Get overdue payments (January 2024)"
curl -s -X GET "$BASE_URL/fixed-payments/history/overdue?month=1&year=2024" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "✅ All API tests completed!"
