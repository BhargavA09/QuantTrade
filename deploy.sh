#!/bin/bash

# QuantLab One-Click Deployment Script for AWS (Ubuntu)
# This script automates the setup of Node.js, Nginx, PM2, and the App.

echo "🚀 Starting QuantLab Deployment..."

# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (Latest Stable)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PM2 (Process Manager)
echo "🔄 Installing PM2..."
sudo npm install -g pm2

# 4. Install Project Dependencies
echo "📥 Installing project dependencies..."
npm install

# 5. Build the Frontend
echo "🏗️ Building the frontend..."
npm run build

# 6. Setup Nginx as Reverse Proxy
echo "🌐 Configuring Nginx..."
sudo apt install -y nginx

# Create Nginx configuration
sudo bash -c 'cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

# Restart Nginx
sudo systemctl restart nginx

# 7. Start the App with PM2
echo "🚀 Starting the application..."
pm2 delete quantlab 2>/dev/null || true
pm2 start npm --name "quantlab" -- start

# 8. Setup PM2 to start on boot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

echo "✅ Deployment Complete!"
echo "Your app should now be live at http://$(curl -s ifconfig.me)"
