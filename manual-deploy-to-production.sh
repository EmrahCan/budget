#!/bin/bash
# Manual Production Deployment Script
# Run this locally to deploy to Azure VM

set -e

echo "🚀 Manual Production Deployment"
echo "================================"
echo ""

# Configuration
VM_HOST="98.71.149.168"
VM_USER="obiwan"
VM_PASSWORD="Eben2010++**++"
PROJECT_DIR="~/budget"

echo "📋 Deployment Configuration:"
echo "   Host: $VM_HOST"
echo "   User: $VM_USER"
echo "   Project: $PROJECT_DIR"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting deployment..."
echo ""

# Deploy to Azure VM
sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no $VM_USER@$VM_HOST << 'ENDSSH'
    set -e
    
    echo "📂 Navigating to project directory..."
    cd ~/budget
    
    echo "💾 Backing up current state..."
    # Save current container IDs
    docker ps -a --filter "name=budget" --format "{{.ID}} {{.Names}}" > /tmp/budget_containers_backup.txt
    
    echo "🔍 Checking git status..."
    git status
    
    echo "💾 Stashing any local changes..."
    git stash
    
    echo "📥 Pulling latest changes..."
    git fetch origin
    git pull origin main
    
    echo "🔍 Detecting changes..."
    BACKEND_CHANGED=$(git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "^backend/" && echo "true" || echo "false")
    FRONTEND_CHANGED=$(git diff HEAD@{1} HEAD --name-only 2>/dev/null | grep -q "^frontend/" && echo "true" || echo "false")
    
    echo "   Backend changed: $BACKEND_CHANGED"
    echo "   Frontend changed: $FRONTEND_CHANGED"
    echo ""
    
    # Function to wait for container health
    wait_for_healthy() {
        local container=$1
        local max_attempts=30
        local attempt=1
        
        echo "⏳ Waiting for $container to be healthy..."
        while [ $attempt -le $max_attempts ]; do
            health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-health-check")
            status=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null || echo "not-found")
            
            if [ "$health" = "healthy" ] || ([ "$health" = "no-health-check" ] && [ "$status" = "running" ]); then
                echo "✅ $container is healthy!"
                return 0
            fi
            
            echo "   Attempt $attempt/$max_attempts: Status=$status, Health=$health"
            sleep 2
            attempt=$((attempt + 1))
        done
        
        echo "❌ $container failed to become healthy"
        return 1
    }
    
    # Restart database if needed
    echo "🗄️  Checking database..."
    if docker ps -a | grep -q budget_database_prod; then
        echo "   Database is running"
    else
        echo "   Starting database..."
        docker-compose -f docker-compose.prod.yml up -d database
        wait_for_healthy budget_database_prod
    fi
    echo ""
    
    # Restart backend if changed
    if [ "$BACKEND_CHANGED" = "true" ]; then
        echo "🔄 Backend changes detected - rebuilding..."
        
        # Build new image
        docker-compose -f docker-compose.prod.yml build backend
        
        # Stop old container
        echo "   Stopping old backend container..."
        docker-compose -f docker-compose.prod.yml stop backend
        
        # Start new container
        echo "   Starting new backend container..."
        docker-compose -f docker-compose.prod.yml up -d backend
        
        # Wait for health
        if wait_for_healthy budget_backend_prod; then
            echo "   Testing backend endpoint..."
            sleep 5
            if curl -f http://localhost:5001/health > /dev/null 2>&1; then
                echo "✅ Backend is responding correctly"
            else
                echo "⚠️  Backend health check failed, but container is running"
            fi
        else
            echo "❌ Backend deployment failed"
            exit 1
        fi
    else
        echo "ℹ️  No backend changes - skipping rebuild"
    fi
    echo ""
    
    # Restart frontend if changed
    if [ "$FRONTEND_CHANGED" = "true" ]; then
        echo "🔄 Frontend changes detected - rebuilding..."
        
        # Build new image
        docker-compose -f docker-compose.prod.yml build frontend
        
        # Stop old container
        echo "   Stopping old frontend container..."
        docker-compose -f docker-compose.prod.yml stop frontend
        
        # Start new container
        echo "   Starting new frontend container..."
        docker-compose -f docker-compose.prod.yml up -d frontend
        
        # Wait for health
        if wait_for_healthy budget_frontend_prod; then
            echo "   Testing frontend endpoint..."
            sleep 5
            if curl -f http://localhost:3000 > /dev/null 2>&1; then
                echo "✅ Frontend is responding correctly"
            else
                echo "⚠️  Frontend health check failed, but container is running"
            fi
        else
            echo "❌ Frontend deployment failed"
            exit 1
        fi
    else
        echo "ℹ️  No frontend changes - skipping rebuild"
    fi
    echo ""
    
    # Check and configure Nginx
    echo "🌐 Checking Nginx configuration..."
    if command -v nginx &> /dev/null; then
        echo "✅ Nginx is installed"
        
        # Check if our site config exists
        if [ ! -f /etc/nginx/sites-enabled/budgetapp.site ]; then
            echo "⚠️  Nginx site configuration missing - creating..."
            
            sudo tee /etc/nginx/sites-available/budgetapp.site > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name budgetapp.site www.budgetapp.site 98.71.149.168;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }
}
EOF
            
            sudo ln -sf /etc/nginx/sites-available/budgetapp.site /etc/nginx/sites-enabled/
            sudo rm -f /etc/nginx/sites-enabled/default
        fi
        
        # Test and reload nginx
        if sudo nginx -t 2>&1; then
            echo "   Nginx configuration is valid"
            sudo systemctl reload nginx
            echo "✅ Nginx reloaded successfully"
        else
            echo "❌ Nginx configuration has errors"
        fi
    else
        echo "⚠️  Nginx is not installed - install it manually if needed"
    fi
    echo ""
    
    # Final status check
    echo "📊 Final Status Check"
    echo "===================="
    echo ""
    echo "Docker Containers:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    
    echo "Service Health:"
    echo "   Database: $(docker inspect --format='{{.State.Status}}' budget_database_prod 2>/dev/null || echo 'not running')"
    echo "   Backend:  $(docker inspect --format='{{.State.Status}}' budget_backend_prod 2>/dev/null || echo 'not running')"
    echo "   Frontend: $(docker inspect --format='{{.State.Status}}' budget_frontend_prod 2>/dev/null || echo 'not running')"
    echo ""
    
    echo "Endpoint Tests:"
    curl -s -o /dev/null -w "   Backend (direct):  http://localhost:5001/health → %{http_code}\n" http://localhost:5001/health 2>/dev/null || echo "   Backend (direct):  Failed"
    curl -s -o /dev/null -w "   Frontend (direct): http://localhost:3000 → %{http_code}\n" http://localhost:3000 2>/dev/null || echo "   Frontend (direct): Failed"
    
    if command -v nginx &> /dev/null && systemctl is-active --quiet nginx; then
        curl -s -o /dev/null -w "   Backend (proxy):   http://localhost/api/health → %{http_code}\n" http://localhost/api/health 2>/dev/null || echo "   Backend (proxy):   Failed"
        curl -s -o /dev/null -w "   Frontend (proxy):  http://localhost/ → %{http_code}\n" http://localhost/ 2>/dev/null || echo "   Frontend (proxy):  Failed"
    fi
    echo ""
    
    echo "✅ Deployment completed!"
    echo ""
    echo "🌐 Access your application:"
    echo "   http://98.71.149.168:3000 (direct)"
    echo "   http://budgetapp.site (via nginx)"
    echo ""
ENDSSH

echo ""
echo "================================"
echo "✅ Deployment finished!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Test the application: http://98.71.149.168:3000"
echo "2. Check dark mode is working"
echo "3. Test login functionality"
echo ""
