#!/bin/bash
set -e

APP_DIR="/home/ubuntu/CloudOps-Sentinel"
DB_FILE="$APP_DIR/backend/data/cloudops.db"
BACKUP_DIR="/home/ubuntu/cloudops-db-backups"
LOG_FILE="$BACKUP_DIR/db-backup.log"
MAIL_SCRIPT="$APP_DIR/backend/send-db-backup-mail.cjs"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/cloudops-db-$(date +%F-%H%M%S).db"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

send_notification() {
  local STATUS="$1"
  local FILE_PATH="$2"
  local MESSAGE="$3"

  if [ -f "$MAIL_SCRIPT" ]; then
    node "$MAIL_SCRIPT" "$STATUS" "$FILE_PATH" "$MESSAGE" >> "$LOG_FILE" 2>&1 || true
  else
    echo "[$(date)] WARNING: Mail script not found: $MAIL_SCRIPT" >> "$LOG_FILE"
  fi
}

on_error() {
  local EXIT_CODE="$?"
  echo "[$(date)] ERROR: SQLite database backup failed with exit code $EXIT_CODE" >> "$LOG_FILE"
  send_notification "FAILED" "N/A" "SQLite database backup failed. Check $LOG_FILE on the server."
  exit "$EXIT_CODE"
}

trap on_error ERR

echo "[$(date)] Starting SQLite database backup..." >> "$LOG_FILE"

if [ ! -f "$DB_FILE" ]; then
  echo "[$(date)] ERROR: Database file not found: $DB_FILE" >> "$LOG_FILE"
  send_notification "FAILED" "N/A" "Database file not found: $DB_FILE"
  exit 1
fi

sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"

gzip "$BACKUP_FILE"

echo "[$(date)] Backup completed: $BACKUP_FILE_GZ" >> "$LOG_FILE"

find "$BACKUP_DIR" -name "cloudops-db-*.db.gz" -type f -mtime +14 -delete

echo "[$(date)] Old backups cleanup completed." >> "$LOG_FILE"

send_notification "SUCCESS" "$BACKUP_FILE_GZ" "SQLite database backup completed successfully."

echo "[$(date)] Backup notification completed." >> "$LOG_FILE"
