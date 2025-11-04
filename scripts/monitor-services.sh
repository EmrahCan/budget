#!/bin/bash
# Service monitoring script for Docker Compose

set -e

COMPOSE_FILE=${1:-"docker-compose.yml"}
CHECK_INTERVAL=${2:-30}
LOG_FILE="budget/logs/service-monitor.log"

echo "🔍 Starting service monitoring..."
echo "📁 Compose file: $COMPOSE_FILE"
echo "⏱️  Check interval: ${CHECK_INTERVAL}s"
echo "📝 Log file: $LOG_FILE"

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    
    log_message "🏥 Checking $service_name health..."
    
    if ./budget/scripts/health-check.sh "$service_name" "$health_url" 10; then
        log_message "✅ $service_name is healthy"
        return 0
    else
        log_message "❌ $service_name is unhealthy"
        return 1
    fi
}

# Function to restart unhealthy service
restart_service() {
    local service_name=$1
    
    log_message "🔄 Restarting $service_name..."
    
    if docker-compose -f "$COMPOSE_FILE" restart "$service_name"; then
        log_message "✅ $service_name restarted successfully"
        sleep 10  # Wait for service to start
    else
        log_message "❌ Failed to restart $service_name"
    fi
}

# Function to get service status
get_service_status() {
    docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
}

# Main monitoring loop
log_message "🚀 Service monitoring started"

while true; do
    log_message "📊 Service Status:"
    get_service_status | tee -a "$LOG_FILE"
    
    # Check each service
    services=("backend:http://localhost:5001/health" "frontend:http://localhost:3000/health" "database:tcp://localhost:5432")
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name health_check <<< "$service_info"
        
        if ! check_service_health "$service_name" "$health_check"; then
            log_message "⚠️ $service_name failed health check"
            
            # Optional: Auto-restart (uncomment if needed)
            # restart_service "$service_name"
        fi
    done
    
    log_message "⏳ Waiting ${CHECK_INTERVAL}s for next check..."
    sleep "$CHECK_INTERVAL"
done