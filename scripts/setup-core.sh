#!/bin/bash

###############################################################################
# EC2 CORE Setup Script for AURONTEK
# This script prepares the CORE instance (private, no public IP) with:
# - Docker + Docker Compose
# - Swap memory (1.5GB)
# - Application directory
# NO Nginx - this instance is private
###############################################################################

set -e  # Exit on any error

echo "========================================="
echo "AURONTEK EC2 CORE Setup Script"
echo "========================================="
echo ""

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required dependencies
echo "📦 Installing dependencies..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    wget \
    git \
    htop \
    nano

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
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
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Create Swap Memory (1.5GB)
echo "💾 Creating 1.5GB Swap Memory..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1.5G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Make swap permanent
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Optimize swap usage
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    echo "✅ Swap memory created and configured"
else
    echo "✅ Swap memory already exists"
fi

# Verify swap
echo "📊 Current swap status:"
sudo swapon --show
free -h

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/aurontek
sudo chown $USER:$USER /opt/aurontek
cd /opt/aurontek

# Configure Docker daemon for resource limits
echo "⚙️  Configuring Docker daemon..."
sudo mkdir -p /etc/docker
cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

sudo systemctl restart docker

# Enable Docker to start on boot
echo "⚙️  Enabling Docker service..."
sudo systemctl enable docker

# Display versions
echo ""
echo "========================================="
echo "✅ CORE Instance Setup Complete!"
echo "========================================="
echo ""
echo "📊 Installed Versions:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo ""
echo "💾 System Resources:"
free -h
echo ""
echo "📝 Next Steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Copy docker-compose.core.yml to /opt/aurontek/"
echo "3. Create .env file with production environment variables"
echo "4. Run: docker compose -f docker-compose.core.yml up -d"
echo ""
echo "⚠️  IMPORTANT: This is a PRIVATE instance"
echo "   - No public IP"
echo "   - Access only from EDGE instance"
echo "   - Security Group allows only EDGE SG on ports 22, 3001-3005"
echo ""
echo "🚀 Your CORE instance is ready for deployment!"
