const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "cloudops.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'admin',
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_run_id TEXT UNIQUE,
      repository TEXT,
      workflow_name TEXT,
      run_number INTEGER,
      branch TEXT,
      status TEXT,
      conclusion TEXT,
      commit_sha TEXT,
      commit_message TEXT,
      triggered_by TEXT,
      event_name TEXT,
      html_url TEXT,
      created_at_github TEXT,
      updated_at_github TEXT,
      duration_seconds INTEGER,
      raw_json TEXT,
      synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS report_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL UNIQUE,
      report_type TEXT,
      file_size_kb REAL,
      email_sender TEXT,
      email_recipient TEXT,
      delivery_status TEXT,
      generated_at TEXT,
      last_modified_at TEXT,
      download_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT,
      severity TEXT,
      title TEXT,
      message TEXT,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS incident_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'SEV3',
      status TEXT NOT NULL DEFAULT 'open',
      source TEXT,
      description TEXT,
      root_cause TEXT,
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trivy_scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_type TEXT NOT NULL DEFAULT 'filesystem',
      target TEXT,
      total_vulnerabilities INTEGER DEFAULT 0,
      critical_count INTEGER DEFAULT 0,
      high_count INTEGER DEFAULT 0,
      medium_count INTEGER DEFAULT 0,
      low_count INTEGER DEFAULT 0,
      unknown_count INTEGER DEFAULT 0,
      raw_json TEXT,
      scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDefaults();
}

function seedDefaults() {
  const adminExists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (username, role)
      VALUES (?, ?)
    `).run("admin", "admin");
  }

  const defaults = [
    ["cpu_threshold", "80"],
    ["memory_threshold", "80"],
    ["disk_threshold", "80"],
    ["alert_cooldown_minutes", "30"],
    ["report_page_size", "10"],
    ["pipeline_page_size", "10"]
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO app_settings (setting_key, setting_value)
    VALUES (?, ?)
  `);

  for (const [key, value] of defaults) {
    insertSetting.run(key, value);
  }
}

function getSetting(key, fallbackValue = null) {
  const row = db
    .prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?")
    .get(key);

  return row ? row.setting_value : fallbackValue;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(setting_key)
    DO UPDATE SET
      setting_value = excluded.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `).run(key, String(value));
}

initDatabase();

module.exports = {
  db,
  DB_PATH,
  getSetting,
  setSetting
};
