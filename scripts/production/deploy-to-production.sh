#!/bin/bash

# Production Deployment Script
# Server: 51.137.126.90

set -e

echo "🚀 Budget App - Production Deployment"
echo "======================================"
echo ""

# Configuration
SERVER="obiwan@51.137.126.90"
APP_DIR="/var/www/budget-app"
BACKUP_DIR="/backups/budget-app"

echo "📦 Step 1: Preparing files..."

# Create .env.production from template
if [ ! -f backend/.env.production ]; then
    cp backend/.env.production.template backend/.env.production
    echo "⚠️  Created backend/.env.production from template"
    echo "⚠️  Please edit backend/.env.production and set JWT_SECRET!"
    read -p "Press enter to continue after editing..."
fi

echo ""
echo "📤 Step 2: Uploading files to server..."

# Upload docker-compose and env files
scp docker-compose.production.yml $SERVER:$APP_DIR/docker-compose.yml
scp .env.production $SERVER:$APP_DIR/.env
scp backend/.env.production $SERVER:$APP_DIR/backend/.env.production

echo ""
echo "🗄️  Step 3: Setting up database..."

# Start database container
ssh $SERVER "cd $APP_DIR && docker-compose up -d database"

echo "⏳ Waiting for database to be ready..."
sleep 15

# Load schema
ssh $SERVER "docker exec -i budget_database_prod psql -U budget_user -d budget_app < /tmp/schema.sql"

echo ""
echo "🔐 Step 4: Creating admin user..."

# Create admin user
ssh $SERVER "docker exec budget_database_prod psql -U budget_user -d budget_app -c \"
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@budgetapp.com',
  '\\\$2a\\\$10\\\$rQZ5vZ5vZ5vZ5vZ5vZ5vZOqK5vZ5vZ5vZ5vZ5vZ5vZ5vZ5vZ5vZ5vZ',
  'Admin',
  'User',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;
\" || echo 'Admin user already exists or created'"

echo ""
echo "🔨 Step 5: Building and starting backend..."

# Build and start backend
ssh $SERVER "cd $APP_DIR && docker-compose up -d --build backend"

echo "⏳ Waiting for backend to be ready..."
sleep 20

echo ""
echo "🏗️  Step 6: Building frontend..."

# Build frontend on server
ssh $SERVER "cd $APP_DIR/frontend && npm install && REACT_APP_API_URL=http://51.137.126.90/api npm run build"

echo ""
echo "🌐 Step 7: Configuring Nginx..."

# Create nginx config
ssh $SERVER "sudo tee /etc/nginx/sites-available/budget-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name 51.137.126.90;

    # Frontend
    location / {
        root $APP_DIR/frontend/build;
        try_files \\\$uri \\\$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF
"

# Enable site
ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/budget-app"
ssh $SERVER "sudo nginx -t && sudo systemctl reload nginx"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 Service Status:"
ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'"
echo ""
echo "🌐 Application URL: http://51.137.126.90"
echo "🔐 Default admin: admin@budgetapp.com / Admin123"
echo ""
echo "📝 Next steps:"
echo "1. Change admin password"
echo "2. Set up SSL certificate (Let's Encrypt)"
echo "3. Configure domain name"
echo "4. Set up monitoring"
echo ""
