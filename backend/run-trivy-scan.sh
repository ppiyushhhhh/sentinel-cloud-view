#!/bin/bash
set -e

APP_DIR="/home/ubuntu/CloudOps-Sentinel"
REPORT_DIR="$APP_DIR/backend/reports"
LOG_FILE="$REPORT_DIR/trivy-cron.log"
OUTPUT_FILE="$REPORT_DIR/trivy-results.json"

mkdir -p "$REPORT_DIR"

echo "[$(date)] Starting Trivy filesystem scan..." >> "$LOG_FILE"

if ! command -v trivy >/dev/null 2>&1; then
  echo "[$(date)] ERROR: Trivy is not installed." >> "$LOG_FILE"
  exit 1
fi

cd "$APP_DIR"

trivy fs "$APP_DIR" \
  --format json \
  --output "$OUTPUT_FILE" \
  --scanners vuln,secret,misconfig \
  --skip-dirs node_modules \
  --skip-dirs backend/node_modules \
  --skip-dirs dist \
  --skip-dirs backend/data \
  --skip-dirs backend/trivy-cache \
  >> "$LOG_FILE" 2>&1

echo "[$(date)] Trivy scan completed: $OUTPUT_FILE" >> "$LOG_FILE"

node - <<'NODE' >> "/home/ubuntu/CloudOps-Sentinel/backend/reports/trivy-cron.log" 2>&1
require("dotenv").config({
  path: require("path").join("/home/ubuntu/CloudOps-Sentinel", "backend/.env")
});

const { syncLatestTrivyScanToDatabase } = require("/home/ubuntu/CloudOps-Sentinel/backend/trivy-db.cjs");

const result = syncLatestTrivyScanToDatabase();

console.log(`[${new Date().toISOString()}] SQLite sync result:`);
console.log(JSON.stringify(result, null, 2));
NODE

echo "[$(date)] Trivy SQLite sync completed." >> "$LOG_FILE"
