#!/bin/bash
# Budget App Control Script - Enhanced for Docker and PM2

set -e

ENVIRONMENT=${ENVIRONMENT:-"development"}
COMPOSE_FILE=""

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

# Determine compose file based on environment
set_compose_file() {
    case $ENVIRONMENT in
        "development")
            COMPOSE_FILE="docker-compose.dev.yml"
            ;;
        "production")
            COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
}

# Docker commands
docker_start() {
    log_message "🚀 Starting Budget App services (Docker)..." $GREEN
    set_compose_file
    docker-compose -f $COMPOSE_FILE up -d
    log_message "✅ Services started" $GREEN
}

docker_stop() {
    log_message "🛑 Stopping Budget App services (Docker)..." $YELLOW
    set_compose_file
    docker-compose -f $COMPOSE_FILE down
    log_message "✅ Services stopped" $GREEN
}

docker_restart() {
    log_message "🔄 Restarting Budget App services (Docker)..." $YELLOW
    set_compose_file
    docker-compose -f $COMPOSE_FILE restart
    log_message "✅ Services restarted" $GREEN
}

docker_status() {
    log_message "📊 Budget App services status (Docker):" $BLUE
    set_compose_file
    docker-compose -f $COMPOSE_FILE ps
}

docker_logs() {
    log_message "📝 Showing Budget App logs (Docker)..." $BLUE
    set_compose_file
    docker-compose -f $COMPOSE_FILE logs --tail=50 -f
}

# PM2 commands
pm2_start() {
    log_message "🚀 Starting Budget App services (PM2)..." $GREEN
    cd "$(dirname "$0")/.."
    pm2 start ecosystem.config.js
    log_message "✅ Services started" $GREEN
}

pm2_stop() {
    log_message "🛑 Stopping Budget App services (PM2)..." $YELLOW
    pm2 stop budget-backend budget-frontend
    log_message "✅ Services stopped" $GREEN
}

pm2_restart() {
    log_message "🔄 Restarting Budget App services (PM2)..." $YELLOW
    pm2 restart budget-backend budget-frontend
    log_message "✅ Services restarted" $GREEN
}

pm2_status() {
    log_message "📊 Budget App services status (PM2):" $BLUE
    pm2 status budget-backend budget-frontend
}

pm2_logs() {
    log_message "📝 Showing Budget App logs (PM2)..." $BLUE
    pm2 logs budget-backend budget-frontend
}

pm2_monitor() {
    log_message "📈 Opening PM2 monitor..." $BLUE
    pm2 monit
}

# Health check
health_check() {
    log_message "🏥 Performing health check..." $BLUE
    ./budget/scripts/health-check.sh backend http://localhost:5001/health 10
    ./budget/scripts/health-check.sh frontend http://localhost:3000/health 10
}

# Show usage
show_usage() {
    echo "Usage: $0 [MODE] {start|stop|restart|status|logs|monitor|health}"
    echo ""
    echo "Modes:"
    echo "  docker  - Use Docker Compose (default)"
    echo "  pm2     - Use PM2 process manager"
    echo ""
    echo "Commands:"
    echo "  start   - Start Budget App services"
    echo "  stop    - Stop Budget App services"
    echo "  restart - Restart Budget App services"
    echo "  status  - Show services status"
    echo "  logs    - Show services logs"
    echo "  monitor - Open monitoring (PM2 only)"
    echo "  health  - Perform health check"
    echo ""
    echo "Environment Variables:"
    echo "  ENVIRONMENT - development|production (default: development)"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start with Docker"
    echo "  $0 pm2 start               # Start with PM2"
    echo "  ENVIRONMENT=production $0 start"
}

# Parse arguments
MODE="docker"
COMMAND=""

if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

# Check if first argument is a mode
if [ "$1" = "docker" ] || [ "$1" = "pm2" ]; then
    MODE="$1"
    shift
fi

COMMAND="$1"

# Execute command based on mode
case "$MODE" in
    "docker")
        case "$COMMAND" in
            start) docker_start ;;
            stop) docker_stop ;;
            restart) docker_restart ;;
            status) docker_status ;;
            logs) docker_logs ;;
            health) health_check ;;
            *) show_usage; exit 1 ;;
        esac
        ;;
    "pm2")
        case "$COMMAND" in
            start) pm2_start ;;
            stop) pm2_stop ;;
            restart) pm2_restart ;;
            status) pm2_status ;;
            logs) pm2_logs ;;
            monitor) pm2_monitor ;;
            health) health_check ;;
            *) show_usage; exit 1 ;;
        esac
        ;;
    *)
        show_usage
        exit 1
        ;;
esac