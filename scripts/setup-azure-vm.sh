#!/bin/bash
set -e

echo "=========================================="
echo "Azure VM Production Environment Setup"
echo "=========================================="

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose standalone (v2)
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
echo "Verifying installations..."
docker --version
docker-compose --version
git --version

# Configure firewall
echo "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status

# Create directory structure
echo "Creating directory structure..."
mkdir -p ~/budget
mkdir -p ~/logs/nginx
mkdir -p ~/logs/backend
mkdir -p ~/logs/frontend
mkdir -p ~/backups
mkdir -p ~/uploads

# Set permissions
chmod 755 ~/budget
chmod 755 ~/logs
chmod 755 ~/backups
chmod 755 ~/uploads

echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo ""
echo "IMPORTANT: You need to log out and log back in for Docker group changes to take effect."
echo "After logging back in, verify with: docker ps"
echo ""
