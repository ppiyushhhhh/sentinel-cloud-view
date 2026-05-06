#!/bin/bash

BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost"
LOG_FILE="/home/ubuntu/CloudOps-Sentinel/backend/reports/alert.log"

DISK_LIMIT=60
CPU_LIMIT=80
MEMORY_LIMIT=80

DATE=$(date)

echo "----- Alert Check Started: $DATE -----" >> "$LOG_FILE"

send_alert() {
  TYPE="$1"
  MESSAGE="$2"

  curl -s -G "$BACKEND_URL/api/send-alert" \
    --data-urlencode "type=$TYPE" \
    --data-urlencode "message=$MESSAGE" >> "$LOG_FILE"

  echo "" >> "$LOG_FILE"
}

resolve_alert() {
  TYPE="$1"
  MESSAGE="$2"

  curl -s -G "$BACKEND_URL/api/resolve-alert" \
    --data-urlencode "type=$TYPE" \
    --data-urlencode "message=$MESSAGE" >> "$LOG_FILE"

  echo "" >> "$LOG_FILE"
}

# Disk usage
DISK_USAGE=$(df / | awk 'NR==2 {gsub("%","",$5); print $5}')

if [ "$DISK_USAGE" -ge "$DISK_LIMIT" ]; then
  send_alert "disk" "Disk usage is ${DISK_USAGE}%. Limit is ${DISK_LIMIT}%."
else
  resolve_alert "disk" "Disk usage is back to normal at ${DISK_USAGE}%."
fi

# Memory usage
MEMORY_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

if [ "$MEMORY_USAGE" -ge "$MEMORY_LIMIT" ]; then
  send_alert "memory" "Memory usage is ${MEMORY_USAGE}%. Limit is ${MEMORY_LIMIT}%."
else
  resolve_alert "memory" "Memory usage is back to normal at ${MEMORY_USAGE}%."
fi

# CPU usage
CPU_USAGE=$(top -bn1 | grep 'Cpu(s)' | awk '{printf "%.0f", 100 - $8}')

if [ "$CPU_USAGE" -ge "$CPU_LIMIT" ]; then
  send_alert "cpu" "CPU usage is ${CPU_USAGE}%. Limit is ${CPU_LIMIT}%."
else
  resolve_alert "cpu" "CPU usage is back to normal at ${CPU_USAGE}%."
fi

# Backend status
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/")

if [ "$BACKEND_STATUS" != "200" ]; then
  send_alert "backend" "Backend API is down. HTTP status: $BACKEND_STATUS"
else
  resolve_alert "backend" "Backend API is healthy. HTTP status: $BACKEND_STATUS"
fi

# Frontend status through Nginx
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" != "200" ]; then
  send_alert "frontend" "Frontend site is down. HTTP status: $FRONTEND_STATUS"
else
  resolve_alert "frontend" "Frontend site is healthy. HTTP status: $FRONTEND_STATUS"
fi

# Docker stopped containers
STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}")

if [ ! -z "$STOPPED_CONTAINERS" ]; then
  send_alert "docker" "Stopped Docker containers detected: $STOPPED_CONTAINERS"
else
  resolve_alert "docker" "No stopped Docker containers detected."
fi

echo "----- Alert Check Completed -----" >> "$LOG_FILE"
