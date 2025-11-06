#!/bin/bash
# Azure VM Quick Setup Script for Budget App

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

# Function to install Docker
install_docker() {
    log_message "🐳 Installing Docker..." $BLUE
    
    # Update package index
    sudo apt update
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_message "✅ Docker installed successfully" $GREEN
}

# Function to install Node.js
install_nodejs() {
    log_message "📦 Installing Node.js..." $BLUE
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_message "✅ Node.js installed successfully" $GREEN
}

# Function to install system dependencies
install_system_deps() {
    log_message "🔧 Installing system dependencies..." $BLUE
    
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl wget nginx ufw
    
    log_message "✅ System dependencies installed" $GREEN
}

# Function to configure firewall
configure_firewall() {
    log_message "🔥 Configuring firewall..." $BLUE
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow http
    sudo ufw allow https
    
    # Allow application ports
    sudo ufw allow 3000/tcp  # Frontend
    sudo ufw allow 5001/tcp  # Backend
    
    log_message "✅ Firewall configured" $GREEN
}

# Function to get VM public IP
get_vm_ip() {
    log_message "🌐 Getting VM public IP..." $BLUE
    
    VM_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://ipinfo.io/ip 2>/dev/null)
    
    if [ -n "$VM_IP" ]; then
        log_message "✅ VM Public IP: $VM_IP" $GREEN
        echo "$VM_IP" > /tmp/vm_ip.txt
    else
        log_message "❌ Could not determine VM IP" $RED
        exit 1
    fi
}

# Function to clone repository
clone_repository() {
    log_message "📥 Cloning repository..." $BLUE
    
    if [ ! -d "budget" ]; then
        git clone https://github.com/EmrahCan/budget.git
        log_message "✅ Repository cloned" $GREEN
    else
        log_message "⏭️ Repository already exists, pulling latest changes..." $YELLOW
        cd budget && git pull && cd ..
    fi
}

# Function to setup environment
setup_environment() {
    log_message "⚙️ Setting up environment..." $BLUE
    
    cd budget
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Setup production environment
    ./scripts/setup-env.sh production true
    
    log_message "✅ Environment setup completed" $GREEN
}

# Function to configure nginx
configure_nginx() {
    log_message "🌐 Configuring Nginx..." $BLUE
    
    VM_IP=$(cat /tmp/vm_ip.txt)
    
    sudo tee /etc/nginx/sites-available/budget-app > /dev/null << EOF
server {
    listen 80;
    server_name $VM_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_message "✅ Nginx configured" $GREEN
}

# Function to deploy application
deploy_application() {
    log_message "🚀 Deploying application..." $BLUE
    
    cd budget
    
    # Deploy with production settings
    ./scripts/deploy.sh production --build --clean
    
    log_message "✅ Application deployed" $GREEN
}

# Function to show final status
show_final_status() {
    VM_IP=$(cat /tmp/vm_ip.txt)
    
    log_message "🎉 Azure VM Setup Completed!" $GREEN
    log_message "" $NC
    log_message "📊 Access URLs:" $BLUE
    log_message "  🌐 Frontend: http://$VM_IP" $BLUE
    log_message "  🔧 Backend: http://$VM_IP:5001" $BLUE
    log_message "  🏥 Health: http://$VM_IP/health" $BLUE
    log_message "" $NC
    log_message "🔧 Management Commands:" $BLUE
    log_message "  📊 Status: docker-compose -f docker-compose.prod.yml ps" $BLUE
    log_message "  📝 Logs: docker-compose -f docker-compose.prod.yml logs -f" $BLUE
    log_message "  🔄 Restart: docker-compose -f docker-compose.prod.yml restart" $BLUE
    log_message "" $NC
    log_message "⚠️  Important: You need to logout and login again for Docker group changes to take effect!" $YELLOW
}

# Main function
main() {
    log_message "🚀 Starting Azure VM Setup for Budget App" $GREEN
    log_message "⏱️  This will take approximately 10-15 minutes..." $BLUE
    
    install_system_deps
    install_docker
    install_nodejs
    configure_firewall
    get_vm_ip
    clone_repository
    setup_environment
    configure_nginx
    
    log_message "⚠️  Logging out to apply Docker group changes..." $YELLOW
    log_message "⚠️  After login, run: cd budget && ./scripts/deploy.sh production --build" $YELLOW
    
    # Create a deployment script for after relogin
    cat > ~/deploy-budget.sh << 'EOF'
#!/bin/bash
cd budget
./scripts/deploy.sh production --build --clean

VM_IP=$(cat /tmp/vm_ip.txt)
echo "🎉 Deployment completed!"
echo "🌐 Frontend: http://$VM_IP"
echo "🔧 Backend: http://$VM_IP:5001"
echo "🏥 Health: http://$VM_IP/health"
EOF
    
    chmod +x ~/deploy-budget.sh
    
    show_final_status
    
    log_message "🔄 Logging out now... Run './deploy-budget.sh' after login!" $YELLOW
    logout
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_message "❌ Please don't run this script as root" $RED
    exit 1
fi

# Run main function
main "$@"