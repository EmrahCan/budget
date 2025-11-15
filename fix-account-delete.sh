#!/bin/bash
# Fix Account Delete Issue in Production

echo "=== Fixing Account Delete Issue ==="
echo ""

# Check if we're in the budget directory
if [ ! -d "backend" ]; then
    echo "Error: Please run this script from the budget directory"
    exit 1
fi

echo "1. Checking current backend logs for errors..."
docker logs budget_backend_prod --tail 100 | grep -i "delete\|error\|account"

echo ""
echo "2. Testing account delete endpoint..."
echo "Getting first account ID..."
ACCOUNT_ID=$(docker exec budget_database_prod psql -U postgres -d budget_app_prod -t -c "SELECT id FROM accounts WHERE is_active = true LIMIT 1;" | xargs)

if [ -z "$ACCOUNT_ID" ]; then
    echo "No active accounts found"
else
    echo "Found account ID: $ACCOUNT_ID"
    echo ""
    echo "3. Checking account details..."
    docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT id, name, type, balance, is_active FROM accounts WHERE id = '$ACCOUNT_ID';"
    
    echo ""
    echo "4. Checking transactions for this account..."
    docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT COUNT(*) as transaction_count FROM transactions WHERE account_id = '$ACCOUNT_ID';"
fi

echo ""
echo "5. Checking parameter validation middleware..."
docker exec budget_backend_prod cat /app/middleware/validation.js | grep -A 20 "paramValidation"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Review the logs above"
echo "2. Check if ID format is UUID or INTEGER"
echo "3. Update validation middleware if needed"
echo "4. Restart backend: docker-compose restart backend"
