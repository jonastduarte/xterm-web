#!/bin/bash
set -e

echo "Starting deployment setup for XTermWeb Web Clone..."

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git certbot python3-certbot-nginx nginx

# Clone or pull standard updates
if [ ! -d "/opt/projetos/xterm-web" ]; then
    sudo git clone https://github.com/SEU_USUARIO/xterm-web.git /opt/projetos/xterm-web
fi

cd /opt/projetos/xterm-web

# Env File setup
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
    echo "VITE_WS_URL=wss://seu-dominio.com/ws" >> .env
fi

# Run Docker Compose
sudo docker-compose pull
sudo docker-compose up -d

echo "Configuring NGINX & SSL..."
read -p "Enter your domain name (e.g. xterm.yourdomain.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

cat <<EOF > /etc/nginx/sites-available/xterm-web
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:80; # Frontend container
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://localhost:3000; # Backend WS container
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/xterm-web /etc/nginx/sites-enabled/
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

systemctl restart nginx

echo "Deployment complete! Access https://$DOMAIN"