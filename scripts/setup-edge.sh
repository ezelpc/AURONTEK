#!/bin/bash

###############################################################################
# EC2 EDGE Setup Script for AURONTEK
# This script prepares the EDGE instance (public-facing) with:
# - Docker + Docker Compose
# - Nginx + Certbot (HTTPS)
# - Swap memory (1.5GB)
# - Application directory
###############################################################################

set -e  # Exit on any error

echo "========================================="
echo "AURONTEK EC2 EDGE Setup Script"
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
    nano \
    nginx \
    certbot \
    python3-certbot-nginx

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

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Create directory for certbot validation
sudo mkdir -p /var/www/certbot

# Display versions
echo ""
echo "========================================="
echo "✅ EDGE Instance Setup Complete!"
echo "========================================="
echo ""
echo "📊 Installed Versions:"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo "  Certbot: $(certbot --version)"
echo ""
echo "💾 System Resources:"
free -h
echo ""
echo "📝 Next Steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Copy nginx/aurontek.conf to /etc/nginx/sites-available/"
echo "3. Create symlink: sudo ln -s /etc/nginx/sites-available/aurontek.conf /etc/nginx/sites-enabled/"
echo "4. Test nginx: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo "6. Setup SSL: sudo certbot --nginx -d your-domain.ddns.net"
echo "7. Copy docker-compose.edge.yml to /opt/aurontek/"
echo "8. Create .env file with production environment variables"
echo "9. Run: docker compose -f docker-compose.edge.yml up -d"
echo ""
echo "🚀 Your EDGE instance is ready for deployment!"
