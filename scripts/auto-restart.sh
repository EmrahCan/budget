#!/bin/bash
# Automated restart policy for unhealthy containers

set -e

COMPOSE_FILE=${1:-"docker-compose.yml"}
MAX_RESTART_ATTEMPTS=${2:-3}
RESTART_DELAY=${3:-30}
LOG_FILE="budget/logs/auto-restart.log"

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to get unhealthy containers
get_unhealthy_containers() {
    docker-compose -f "$COMPOSE_FILE" ps --filter "health=unhealthy" --format "{{.Name}}"
}

# Function to restart container with retry logic
restart_container_with_retry() {
    local container_name=$1
    local attempt=1
    
    while [ $attempt -le $MAX_RESTART_ATTEMPTS ]; do
        log_message "🔄 Attempt $attempt/$MAX_RESTART_ATTEMPTS: Restarting $container_name"
        
        if docker-compose -f "$COMPOSE_FILE" restart "$container_name"; then
            log_message "✅ $container_name restarted successfully"
            
            # Wait for container to be healthy
            log_message "⏳ Waiting ${RESTART_DELAY}s for $container_name to become healthy..."
            sleep "$RESTART_DELAY"
            
            # Check if container is now healthy
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
            
            if [ "$health_status" = "healthy" ]; then
                log_message "🎉 $container_name is now healthy"
                return 0
            else
                log_message "⚠️ $container_name is still unhealthy (status: $health_status)"
            fi
        else
            log_message "❌ Failed to restart $container_name"
        fi
        
        attempt=$((attempt + 1))
        
        if [ $attempt -le $MAX_RESTART_ATTEMPTS ]; then
            log_message "⏳ Waiting ${RESTART_DELAY}s before next attempt..."
            sleep "$RESTART_DELAY"
        fi
    done
    
    log_message "💥 Failed to restart $container_name after $MAX_RESTART_ATTEMPTS attempts"
    return 1
}

# Function to send notification (placeholder)
send_notification() {
    local message="$1"
    local severity=${2:-"warning"}
    
    log_message "📢 NOTIFICATION [$severity]: $message"
    
    # Add your notification logic here (email, Slack, etc.)
    # Example: curl -X POST -H 'Content-type: application/json' --data '{"text":"'$message'"}' YOUR_WEBHOOK_URL
}

# Main execution
log_message "🚀 Auto-restart service started"
log_message "📁 Compose file: $COMPOSE_FILE"
log_message "🔄 Max restart attempts: $MAX_RESTART_ATTEMPTS"
log_message "⏱️ Restart delay: ${RESTART_DELAY}s"

# Get list of unhealthy containers
unhealthy_containers=$(get_unhealthy_containers)

if [ -z "$unhealthy_containers" ]; then
    log_message "✅ All containers are healthy"
    exit 0
fi

log_message "⚠️ Found unhealthy containers:"
echo "$unhealthy_containers" | while read -r container; do
    log_message "  - $container"
done

# Restart each unhealthy container
echo "$unhealthy_containers" | while read -r container; do
    if [ -n "$container" ]; then
        if restart_container_with_retry "$container"; then
            send_notification "✅ Successfully restarted $container" "info"
        else
            send_notification "❌ Failed to restart $container after $MAX_RESTART_ATTEMPTS attempts" "error"
        fi
    fi
done

log_message "🏁 Auto-restart service completed"