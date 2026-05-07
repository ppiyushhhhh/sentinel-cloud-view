#!/bin/bash

echo "==== PM2 ===="
pm2 status

echo
echo "==== PORT 5000 ===="
sudo ss -tulpn | grep :5000 || echo "Port 5000 not listening"

echo
echo "==== BACKEND DIRECT ===="
curl -s http://localhost:5000/api/server-health | head -c 500
echo

echo
echo "==== NGINX FRONTEND ===="
curl -I http://localhost

echo
echo "==== NGINX API PROXY ===="
curl -s http://localhost/api/server-health | head -c 500
echo

echo
echo "==== NGINX AUTH CHECK ===="
sudo grep -R "auth_basic" -n /etc/nginx || echo "No Basic Auth found"

echo
echo "==== RECENT BACKEND LOGS ===="
pm2 logs cloudops-backend --lines 20 --nostream
