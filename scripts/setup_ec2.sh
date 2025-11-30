#!/bin/bash

###############################################################################
# EC2 Ubuntu Setup Script for AURONTEK Application
# This script prepares a fresh Ubuntu EC2 instance for Docker deployment
###############################################################################

set -e  # Exit on any error

echo "=================================="
echo "AURONTEK EC2 Setup Script"
echo "=================================="
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

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# CRITICAL: Create Swap Memory (4GB for t2.micro)
echo "💾 Creating 4GB Swap Memory..."
if [ ! -f /swapfile ]; then
    # Create 4GB swap file
    sudo fallocate -l 4G /swapfile
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
echo "=================================="
echo "✅ Installation Complete!"
echo "=================================="
echo ""
echo "📊 Installed Versions:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"
echo ""
echo "💾 System Resources:"
free -h
echo ""
echo "📝 Next Steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Clone your repository or create docker-compose.prod.yml"
echo "3. Create .env file with production environment variables"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🚀 Your EC2 instance is ready for deployment!"
