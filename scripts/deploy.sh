#!/bin/bash
# Main deployment script for Budget App

set -e

# Configuration
ENVIRONMENT=${1:-"production"}
COMPOSE_FILE=""
ENV_FILE=""
LOG_FILE="budget/logs/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp and color
log_message() {
    local message="$1"
    local color=${2:-$NC}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color}[$timestamp] $message${NC}" | tee -a "$LOG_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy for local development"
    echo "  production   - Deploy for production (default)"
    echo ""
    echo "Options:"
    echo "  --build      - Force rebuild of images"
    echo "  --clean      - Clean up before deployment"
    echo "  --no-logs    - Don't show logs after deployment"
    echo "  --help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development --build"
    echo "  $0 production --clean"
}

# Function to validate environment
validate_environment() {
    log_message "🔍 Validating environment: $ENVIRONMENT" $BLUE
    
    case $ENVIRONMENT in
        "development")
            COMPOSE_FILE="docker-compose.dev.yml"
            ENV_FILE=".env.development"
            ;;
        "production")
            COMPOSE_FILE="docker-compose.prod.yml"
            ENV_FILE=".env.production"
            ;;
        *)
            log_message "❌ Invalid environment: $ENVIRONMENT" $RED
            show_usage
            exit 1
            ;;
    esac
    
    log_message "📁 Compose file: $COMPOSE_FILE" $BLUE
    log_message "🔧 Environment file: $ENV_FILE" $BLUE
}

# Function to check prerequisites
check_prerequisites() {
    log_message "🔍 Checking prerequisites..." $BLUE
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_message "❌ Docker is not installed" $RED
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_message "❌ Docker Compose is not installed" $RED
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_message "❌ Docker daemon is not running" $RED
        exit 1
    fi
    
    log_message "✅ Prerequisites check passed" $GREEN
}

# Function to clean up
cleanup() {
    if [ "$CLEAN" = true ]; then
        log_message "🧹 Cleaning up..." $YELLOW
        
        # Stop and remove containers
        docker-compose -f $COMPOSE_FILE down --remove-orphans || true
        
        # Remove unused images
        docker image prune -f || true
        
        # Remove unused volumes (be careful with this)
        # docker volume prune -f || true
        
        log_message "✅ Cleanup completed" $GREEN
    fi
}

# Function to build images
build_images() {
    if [ "$BUILD" = true ]; then
        log_message "🔨 Building images..." $YELLOW
        docker-compose -f $COMPOSE_FILE build --no-cache
        log_message "✅ Images built successfully" $GREEN
    fi
}

# Function to deploy services
deploy_services() {
    log_message "🚀 Deploying services..." $YELLOW
    
    # Pull latest images (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        log_message "📥 Pulling latest images..." $BLUE
        docker-compose -f $COMPOSE_FILE pull || true
    fi
    
    # Start services
    log_message "▶️ Starting services..." $BLUE
    docker-compose -f $COMPOSE_FILE up -d
    
    log_message "✅ Services deployed successfully" $GREEN
}

# Function to wait for services
wait_for_services() {
    log_message "⏳ Waiting for services to be ready..." $YELLOW
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_message "🔍 Health check attempt $attempt/$max_attempts" $BLUE
        
        if ./budget/scripts/health-check.sh backend http://localhost:5001/health 10 && \
           ./budget/scripts/health-check.sh frontend http://localhost:3000/health 10; then
            log_message "✅ All services are healthy" $GREEN
            return 0
        fi
        
        log_message "⏳ Services not ready yet, waiting..." $YELLOW
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_message "❌ Services failed to become healthy within timeout" $RED
    return 1
}

# Function to show deployment status
show_status() {
    log_message "📊 Deployment Status:" $BLUE
    docker-compose -f $COMPOSE_FILE ps
    
    log_message "🏥 Health Status:" $BLUE
    ./budget/scripts/health-check.sh backend http://localhost:5001/health 5 || true
    ./budget/scripts/health-check.sh frontend http://localhost:3000/health 5 || true
}

# Function to show logs
show_logs() {
    if [ "$SHOW_LOGS" = true ]; then
        log_message "📝 Showing service logs..." $BLUE
        docker-compose -f $COMPOSE_FILE logs --tail=50
    fi
}

# Parse command line arguments
BUILD=false
CLEAN=false
SHOW_LOGS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --no-logs)
            SHOW_LOGS=false
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            if [ -z "$ENVIRONMENT" ] || [ "$ENVIRONMENT" = "production" ]; then
                ENVIRONMENT="$1"
            fi
            shift
            ;;
    esac
done

# Main deployment flow
main() {
    log_message "🚀 Starting Budget App deployment" $GREEN
    log_message "🌍 Environment: $ENVIRONMENT" $BLUE
    
    validate_environment
    check_prerequisites
    cleanup
    build_images
    deploy_services
    
    if wait_for_services; then
        show_status
        show_logs
        
        log_message "🎉 Deployment completed successfully!" $GREEN
        log_message "🌐 Frontend: http://localhost:3000" $BLUE
        log_message "🔧 Backend: http://localhost:5001" $BLUE
        log_message "🏥 Health: http://localhost:5001/health" $BLUE
    else
        log_message "💥 Deployment failed - services are not healthy" $RED
        show_status
        exit 1
    fi
}

# Run main function
main "$@"