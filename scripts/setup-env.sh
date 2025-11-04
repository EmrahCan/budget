#!/bin/bash
# Environment setup and validation script

set -e

ENVIRONMENT=${1:-"development"}
FORCE=${2:-false}

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

# Function to create environment file
create_env_file() {
    local env_type=$1
    local env_file=$2
    
    log_message "📝 Creating $env_file..." $BLUE
    
    case $env_type in
        "development")
            cat > "$env_file" << EOF
# Budget App - Development Environment

# Server Configuration
NODE_ENV=development
PORT=5001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app_dev
DB_USER=postgres
DB_PASSWORD=password123

# JWT Configuration
JWT_SECRET=budget_app_dev_secret_key_$(date +%s)
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3001

# API Configuration
REACT_APP_API_URL=http://localhost:5002/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true

# AI Configuration
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-pro
EOF
            ;;
        "production")
            cat > "$env_file" << EOF
# Budget App - Production Environment

# Server Configuration
NODE_ENV=production
PORT=5001

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=postgres
DB_PASSWORD=password123

# JWT Configuration
JWT_SECRET=budget_app_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://4.210.173.21:3000

# API Configuration
REACT_APP_API_URL=http://4.210.173.21:5001/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false

# AI Configuration
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-pro

# Production Optimizations
GENERATE_SOURCEMAP=false
EOF
            ;;
    esac
    
    log_message "✅ $env_file created" $GREEN
}

# Function to validate environment variables
validate_env_vars() {
    local env_file=$1
    
    log_message "🔍 Validating environment variables in $env_file..." $BLUE
    
    if [ ! -f "$env_file" ]; then
        log_message "❌ Environment file $env_file not found" $RED
        return 1
    fi
    
    # Required variables
    local required_vars=(
        "NODE_ENV"
        "PORT"
        "DB_HOST"
        "DB_NAME"
        "JWT_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_message "❌ Missing required environment variables:" $RED
        for var in "${missing_vars[@]}"; do
            log_message "  - $var" $RED
        done
        return 1
    fi
    
    log_message "✅ Environment validation passed" $GREEN
    return 0
}

# Function to setup directories
setup_directories() {
    log_message "📁 Setting up directories..." $BLUE
    
    local dirs=(
        "budget/logs"
        "budget/database/backups"
        "budget/uploads"
        "budget/temp"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_message "✅ Created directory: $dir" $GREEN
        fi
    done
}

# Function to set permissions
set_permissions() {
    log_message "🔐 Setting permissions..." $BLUE
    
    # Make scripts executable
    find budget/scripts -name "*.sh" -exec chmod +x {} \;
    
    # Set log directory permissions
    chmod 755 budget/logs 2>/dev/null || true
    
    log_message "✅ Permissions set" $GREEN
}

# Function to check system requirements
check_system_requirements() {
    log_message "🔍 Checking system requirements..." $BLUE
    
    local requirements_met=true
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        log_message "✅ Node.js: $node_version" $GREEN
    else
        log_message "❌ Node.js not found" $RED
        requirements_met=false
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_message "✅ Docker: $docker_version" $GREEN
    else
        log_message "❌ Docker not found" $RED
        requirements_met=false
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | cut -d' ' -f3 | sed 's/,//')
        log_message "✅ Docker Compose: $compose_version" $GREEN
    else
        log_message "❌ Docker Compose not found" $RED
        requirements_met=false
    fi
    
    if [ "$requirements_met" = false ]; then
        log_message "❌ System requirements not met" $RED
        return 1
    fi
    
    log_message "✅ System requirements check passed" $GREEN
    return 0
}

# Main setup function
main() {
    log_message "🚀 Setting up Budget App environment: $ENVIRONMENT" $GREEN
    
    # Check system requirements
    if ! check_system_requirements; then
        exit 1
    fi
    
    # Setup directories
    setup_directories
    
    # Set permissions
    set_permissions
    
    # Environment file paths
    local backend_env="budget/backend/.env"
    local frontend_env="budget/frontend/.env"
    
    # Create environment files if they don't exist or force is true
    if [ ! -f "$backend_env" ] || [ "$FORCE" = true ]; then
        create_env_file "$ENVIRONMENT" "$backend_env"
    else
        log_message "⏭️ Backend environment file exists, skipping..." $YELLOW
    fi
    
    if [ ! -f "$frontend_env" ] || [ "$FORCE" = true ]; then
        create_env_file "$ENVIRONMENT" "$frontend_env"
    else
        log_message "⏭️ Frontend environment file exists, skipping..." $YELLOW
    fi
    
    # Validate environment files
    validate_env_vars "$backend_env"
    validate_env_vars "$frontend_env"
    
    log_message "🎉 Environment setup completed successfully!" $GREEN
    log_message "📝 Next steps:" $BLUE
    log_message "  1. Review and customize environment files if needed" $BLUE
    log_message "  2. Run: ./budget/scripts/deploy.sh $ENVIRONMENT" $BLUE
}

# Show usage
if [ "$1" = "--help" ]; then
    echo "Usage: $0 [environment] [force]"
    echo ""
    echo "Arguments:"
    echo "  environment  - development or production (default: development)"
    echo "  force        - true to overwrite existing files (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production true"
    exit 0
fi

# Run main function
main