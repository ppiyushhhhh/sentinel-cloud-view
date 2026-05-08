#!/bin/bash
set -e

APP_DIR="/home/ubuntu/CloudOps-Sentinel"
DB_FILE="$APP_DIR/backend/data/cloudops.db"
BACKUP_DIR="/home/ubuntu/cloudops-db-backups"
LOG_FILE="$BACKUP_DIR/db-backup.log"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting SQLite database backup..." >> "$LOG_FILE"

if [ ! -f "$DB_FILE" ]; then
  echo "[$(date)] ERROR: Database file not found: $DB_FILE" >> "$LOG_FILE"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/cloudops-db-$(date +%F-%H%M%S).db"

sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

gzip "$BACKUP_FILE"

echo "[$(date)] Backup completed: $BACKUP_FILE.gz" >> "$LOG_FILE"

# Keep only last 14 days of backups
find "$BACKUP_DIR" -name "cloudops-db-*.db.gz" -type f -mtime +14 -delete

echo "[$(date)] Old backups cleanup completed." >> "$LOG_FILE"
