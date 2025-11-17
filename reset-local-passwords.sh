#!/bin/bash

echo "🔐 Resetting local user passwords..."
echo ""

# Generate password hash using backend's bcrypt
echo "📝 Generating password hash..."
cd backend
HASH=$(node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 12, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log(hash);
  process.exit(0);
});
")
cd ..

if [ -z "$HASH" ]; then
    echo "❌ Failed to generate password hash"
    exit 1
fi

echo "✅ Hash generated: ${HASH:0:30}..."
echo ""

# Update all users with the new hash
echo "🔄 Updating user passwords in database..."
psql -U postgres -d budget_app << EOF
-- Update admin@budgetapp.com
UPDATE users 
SET password_hash = '$HASH', 
    is_active = true 
WHERE email = 'admin@budgetapp.com';

-- Update emrahcan@hotmail.com
UPDATE users 
SET password_hash = '$HASH', 
    is_active = true 
WHERE email = 'emrahcan@hotmail.com';

-- Show updated users
SELECT email, is_active, role, substring(password_hash, 1, 30) as hash_preview 
FROM users 
WHERE email IN ('admin@budgetapp.com', 'emrahcan@hotmail.com');
EOF

echo ""
echo "✅ Passwords reset successfully!"
echo ""
echo "📋 Login credentials:"
echo "   Email: admin@budgetapp.com"
echo "   Email: emrahcan@hotmail.com"
echo "   Password: admin123"
echo ""
echo "🧪 Test login:"
echo "   curl -X POST http://localhost:5001/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"emrahcan@hotmail.com\",\"password\":\"admin123\"}'"
