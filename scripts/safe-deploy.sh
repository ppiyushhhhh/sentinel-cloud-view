#!/bin/bash
set -e

APP_DIR="/home/ubuntu/CloudOps-Sentinel"
WEB_DIR="/var/www/html"
BACKEND_NAME="cloudops-backend"

cd "$APP_DIR"

echo "1. Checking Git status..."
git status --short

echo "2. Installing frontend dependencies from lockfile..."
npm install

echo "3. Building frontend..."
npm run build

echo "4. Backing up current web files..."
sudo mkdir -p /var/www/html-backups
sudo tar -czf /var/www/html-backups/frontend-$(date +%F-%H%M).tar.gz -C "$WEB_DIR" . 2>/dev/null || true

echo "5. Deploying frontend..."
sudo rm -rf "$WEB_DIR"/*
sudo cp -r dist/* "$WEB_DIR"/

echo "6. Testing Nginx..."
sudo nginx -t

echo "7. Restarting Nginx..."
sudo systemctl restart nginx

echo "8. Restarting backend..."
pm2 restart "$BACKEND_NAME" --update-env || pm2 start backend/server.cjs --name "$BACKEND_NAME" --update-env
pm2 save

echo "9. Checking backend health..."
sleep 2
curl -f http://localhost:5000/api/server-health >/dev/null

echo "10. Checking frontend..."
curl -I http://localhost | grep -E "200|304"

echo "Deployment completed successfully."
