#!/bin/bash

echo "🔍 Checking production database users..."
echo ""

# Check users in production database
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "
SELECT 
    id,
    username,
    email,
    is_admin,
    created_at
FROM users
ORDER BY created_at DESC;
"

echo ""
echo "📊 Total user count:"
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "
SELECT COUNT(*) as total_users FROM users;
"

echo ""
echo "👤 Admin users:"
docker exec budget_database_prod psql -U postgres -d budget_app_prod -c "
SELECT username, email FROM users WHERE is_admin = true;
"
