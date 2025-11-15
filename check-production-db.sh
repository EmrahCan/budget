#!/bin/bash
# Check Production Database Schema

echo "=== Checking Production Database ==="
echo ""

echo "1. Database connection test..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT version();"

echo ""
echo "2. Accounts table structure..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "\d accounts"

echo ""
echo "3. Sample account data (first 5 accounts)..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT id, name, type, balance, overdraft_limit, overdraft_used, is_active FROM accounts LIMIT 5;"

echo ""
echo "4. Checking for UUID extension..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';"

echo ""
echo "5. Checking ID data type..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'id';"

echo ""
echo "6. Count of accounts by type..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT type, COUNT(*) as count, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count FROM accounts GROUP BY type;"

echo ""
echo "7. Checking transactions linked to accounts..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT a.id, a.name, COUNT(t.id) as transaction_count FROM accounts a LEFT JOIN transactions t ON a.id = t.account_id GROUP BY a.id, a.name ORDER BY transaction_count DESC LIMIT 5;"

echo ""
echo "=== Check Complete ==="
