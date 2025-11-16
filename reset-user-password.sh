#!/bin/bash

echo "🔐 Resetting user password in production database..."

# First, let's see existing users
echo "📋 Current users:"
docker exec -it budget_database_prod psql -U budget_user -d budget_app_prod -c "SELECT id, username, email, created_at FROM users;"

echo -e "\n🔑 Generating new password hash for 'password123'..."

# Generate bcrypt hash for 'password123' using Node.js in backend container
NEW_PASSWORD_HASH=$(docker exec budget_backend_prod node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('password123', 10).then(hash => console.log(hash));
")

echo "Generated hash: $NEW_PASSWORD_HASH"

# Update the first user's password
echo -e "\n🔄 Updating password for first user..."
docker exec -it budget_database_prod psql -U budget_user -d budget_app_prod -c "
UPDATE users 
SET password = '$NEW_PASSWORD_HASH' 
WHERE id = (SELECT id FROM users ORDER BY id LIMIT 1);
"

echo -e "\n✅ Password updated!"
echo "📝 You can now login with:"
echo "   Username: (check the username from the list above)"
echo "   Password: password123"

# Show updated user
echo -e "\n📋 Updated user:"
docker exec -it budget_database_prod psql -U budget_user -d budget_app_prod -c "SELECT id, username, email FROM users ORDER BY id LIMIT 1;"
