const { db } = require("./db.cjs");

function createAlert({
  alertType = "system",
  severity = "info",
  title,
  message,
  source = "CloudOps Sentinel",
  status = "open",
  metadata = {}
}) {
  if (!title || !String(title).trim()) {
    throw new Error("Alert title is required");
  }

  const result = db.prepare(`
    INSERT INTO alert_history (
      alert_type,
      severity,
      title,
      message,
      source,
      status,
      metadata_json,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    String(alertType),
    String(severity),
    String(title),
    String(message || ""),
    String(source),
    String(status),
    JSON.stringify(metadata || {})
  );

  return db
    .prepare("SELECT * FROM alert_history WHERE id = ?")
    .get(result.lastInsertRowid);
}

function getAlerts({
  limit = 100,
  offset = 0,
  status = "ALL",
  severity = "ALL",
  alertType = "ALL"
} = {}) {
  let query = `
    SELECT
      id,
      alert_type,
      severity,
      title,
      message,
      source,
      status,
      metadata_json,
      created_at,
      resolved_at
    FROM alert_history
    WHERE 1 = 1
  `;

  const params = [];

  if (status && status !== "ALL") {
    query += " AND status = ?";
    params.push(status);
  }

  if (severity && severity !== "ALL") {
    query += " AND severity = ?";
    params.push(severity);
  }

  if (alertType && alertType !== "ALL") {
    query += " AND alert_type = ?";
    params.push(alertType);
  }

  query += `
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  return db.prepare(query).all(...params).map((alert) => ({
    ...alert,
    metadata: safeParseJson(alert.metadata_json)
  }));
}

function getAlertSummary() {
  const total = db
    .prepare("SELECT COUNT(*) AS count FROM alert_history")
    .get().count;

  const open = db
    .prepare("SELECT COUNT(*) AS count FROM alert_history WHERE status = 'open'")
    .get().count;

  const resolved = db
    .prepare("SELECT COUNT(*) AS count FROM alert_history WHERE status = 'resolved'")
    .get().count;

  const critical = db
    .prepare("SELECT COUNT(*) AS count FROM alert_history WHERE severity = 'critical'")
    .get().count;

  const high = db
    .prepare("SELECT COUNT(*) AS count FROM alert_history WHERE severity = 'high'")
    .get().count;

  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) AS count
    FROM alert_history
    GROUP BY severity
    ORDER BY count DESC
  `).all();

  const byType = db.prepare(`
    SELECT alert_type, COUNT(*) AS count
    FROM alert_history
    GROUP BY alert_type
    ORDER BY count DESC
  `).all();

  return {
    total,
    open,
    resolved,
    critical,
    high,
    bySeverity,
    byType
  };
}

function resolveAlert(id) {
  const existing = db
    .prepare("SELECT * FROM alert_history WHERE id = ?")
    .get(Number(id));

  if (!existing) {
    return null;
  }

  db.prepare(`
    UPDATE alert_history
    SET
      status = 'resolved',
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(Number(id));

  return db
    .prepare("SELECT * FROM alert_history WHERE id = ?")
    .get(Number(id));
}

function safeParseJson(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertSummary,
  resolveAlert
};
