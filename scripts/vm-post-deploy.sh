#!/bin/bash
# Post-deployment script for Azure VM

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_message() {
    local message="$1"
    local color=${2:-$NC}
    echo -e "${color}$message${NC}"
}

# Function to wait for services
wait_for_services() {
    log_message "⏳ Waiting for services to be ready..." $YELLOW
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_message "🔍 Health check attempt $attempt/$max_attempts" $BLUE
        
        # Check backend
        if curl -s -f http://localhost:5001/health > /dev/null 2>&1; then
            backend_healthy=true
        else
            backend_healthy=false
        fi
        
        # Check frontend
        if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
            frontend_healthy=true
        else
            frontend_healthy=false
        fi
        
        # Check database
        if docker exec budget_database_prod pg_isready -U postgres -d budget_app_prod > /dev/null 2>&1; then
            database_healthy=true
        else
            database_healthy=false
        fi
        
        if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ] && [ "$database_healthy" = true ]; then
            log_message "✅ All services are healthy" $GREEN
            return 0
        fi
        
        log_message "⏳ Services not ready yet (Backend: $backend_healthy, Frontend: $frontend_healthy, DB: $database_healthy)" $YELLOW
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_message "❌ Services failed to become healthy within timeout" $RED
    return 1
}

# Function to show service status
show_service_status() {
    log_message "📊 Service Status:" $BLUE
    
    echo "Docker Containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "Service Health:"
    
    # Backend health
    if curl -s -f http://localhost:5001/health > /dev/null 2>&1; then
        log_message "✅ Backend: Healthy" $GREEN
    else
        log_message "❌ Backend: Unhealthy" $RED
    fi
    
    # Frontend health
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        log_message "✅ Frontend: Healthy" $GREEN
    else
        log_message "❌ Frontend: Unhealthy" $RED
    fi
    
    # Database health
    if docker exec budget_database_prod pg_isready -U postgres -d budget_app_prod > /dev/null 2>&1; then
        log_message "✅ Database: Healthy" $GREEN
    else
        log_message "❌ Database: Unhealthy" $RED
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log_message "📊 Setting up monitoring..." $BLUE
    
    # Create monitoring script
    cat > ~/monitor-budget.sh << 'EOF'
#!/bin/bash
echo "=== Budget App Monitoring ==="
echo "Date: $(date)"
echo ""

echo "=== Docker Containers ==="
docker-compose -f ~/budget/docker-compose.prod.yml ps

echo ""
echo "=== Service Health ==="
curl -s http://localhost:5001/health | jq '.' 2>/dev/null || echo "Backend health check failed"

echo ""
echo "=== System Resources ==="
echo "Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h

echo ""
echo "=== Recent Logs ==="
echo "Backend logs (last 10 lines):"
docker logs budget_backend_prod --tail=10

echo ""
echo "Frontend logs (last 10 lines):"
docker logs budget_frontend_prod --tail=10
EOF

    chmod +x ~/monitor-budget.sh
    
    log_message "✅ Monitoring script created: ~/monitor-budget.sh" $GREEN
}

# Function to setup auto-restart
setup_auto_restart() {
    log_message "🔄 Setting up auto-restart..." $BLUE
    
    # Create restart script
    cat > ~/restart-budget.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Budget App services..."

cd ~/budget

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Wait for services
sleep 30

# Check health
if curl -s -f http://localhost:5001/health > /dev/null 2>&1 && \
   curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Services restarted successfully"
else
    echo "❌ Services failed to restart properly"
    exit 1
fi
EOF

    chmod +x ~/restart-budget.sh
    
    # Add to crontab for daily restart (optional)
    (crontab -l 2>/dev/null; echo "0 4 * * * ~/restart-budget.sh >> ~/budget-restart.log 2>&1") | crontab -
    
    log_message "✅ Auto-restart script created: ~/restart-budget.sh" $GREEN
}

# Function to show final information
show_final_info() {
    VM_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://ipinfo.io/ip 2>/dev/null || echo "YOUR_VM_IP")
    
    log_message "🎉 Azure VM Deployment Completed Successfully!" $GREEN
    log_message "" $NC
    log_message "📊 Access Information:" $BLUE
    log_message "  🌐 Frontend: http://$VM_IP" $BLUE
    log_message "  🔧 Backend: http://$VM_IP:5001" $BLUE
    log_message "  🏥 Health: http://$VM_IP/health" $BLUE
    log_message "  📊 API: http://$VM_IP/api" $BLUE
    log_message "" $NC
    log_message "🔧 Management Commands:" $BLUE
    log_message "  📊 Status: ~/monitor-budget.sh" $BLUE
    log_message "  🔄 Restart: ~/restart-budget.sh" $BLUE
    log_message "  📝 Logs: docker-compose -f ~/budget/docker-compose.prod.yml logs -f" $BLUE
    log_message "  🛑 Stop: docker-compose -f ~/budget/docker-compose.prod.yml down" $BLUE
    log_message "" $NC
    log_message "💰 Estimated Monthly Cost: ~$35" $BLUE
    log_message "🔐 Security: Firewall configured, services isolated" $BLUE
    log_message "" $NC
    log_message "📞 Support: Check logs if any issues occur" $BLUE
}

# Main function
main() {
    log_message "🚀 Running post-deployment setup..." $GREEN
    
    # Wait for services to be ready
    if wait_for_services; then
        show_service_status
        setup_monitoring
        setup_auto_restart
        show_final_info
        
        log_message "✅ Post-deployment setup completed!" $GREEN
    else
        log_message "❌ Services are not healthy, please check logs" $RED
        show_service_status
        exit 1
    fi
}

# Run main function
main "$@"