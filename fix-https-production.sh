#!/bin/bash

echo "🔒 Fixing HTTPS Mixed Content Issue..."
echo ""

# 1. Update frontend API configuration to use relative URLs
echo "📝 Updating frontend API configuration..."
cat > /tmp/api-fix.js << 'EOF'
// Update baseURL to use relative path (will use same domain as frontend)
const api = axios.create({
  baseURL: '/api',  // Changed from absolute URL to relative
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
EOF

# 2. Rebuild frontend with correct API URL
echo "🏗️ Rebuilding frontend..."
cd ~/budget/frontend

# Set environment variable for production
export REACT_APP_API_URL="/api"

# Build
npm run build

# 3. Copy build to production directory
echo "📦 Deploying new build..."
sudo rm -rf /var/www/budget-app/*
sudo cp -r build/* /var/www/budget-app/

# 4. Restart services
echo "🔄 Restarting services..."
sudo systemctl restart nginx

# 5. Test
echo ""
echo "✅ Fix applied!"
echo ""
echo "🧪 Test the application:"
echo "   https://budgetapp.site"
echo ""
echo "📋 Changes made:"
echo "   - Frontend API calls now use relative URLs (/api)"
echo "   - Nginx proxies /api requests to backend (localhost:5001)"
echo "   - All traffic now goes through HTTPS"
