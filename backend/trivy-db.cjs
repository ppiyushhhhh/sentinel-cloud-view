const fs = require("fs");
const path = require("path");
const { db } = require("./db.cjs");

function getTrivyResultPath() {
  return (
    process.env.TRIVY_RESULTS_FILE ||
    path.join(__dirname, "reports", "trivy-results.json")
  );
}

function countVulnerabilities(trivyJson) {
  const counts = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0
  };

  const results = Array.isArray(trivyJson.Results) ? trivyJson.Results : [];

  for (const result of results) {
    const vulnerabilities = Array.isArray(result.Vulnerabilities)
      ? result.Vulnerabilities
      : [];

    for (const vulnerability of vulnerabilities) {
      counts.total += 1;

      const severity = String(vulnerability.Severity || "UNKNOWN").toUpperCase();

      if (severity === "CRITICAL") counts.critical += 1;
      else if (severity === "HIGH") counts.high += 1;
      else if (severity === "MEDIUM") counts.medium += 1;
      else if (severity === "LOW") counts.low += 1;
      else counts.unknown += 1;
    }
  }

  return counts;
}

function syncLatestTrivyScanToDatabase() {
  const resultPath = getTrivyResultPath();

  if (!fs.existsSync(resultPath)) {
    return {
      success: false,
      message: `Trivy result file not found: ${resultPath}`,
      resultPath,
      inserted: false
    };
  }

  const rawText = fs.readFileSync(resultPath, "utf8");
  const trivyJson = JSON.parse(rawText);

  const counts = countVulnerabilities(trivyJson);

  const target =
    trivyJson.ArtifactName ||
    trivyJson.Metadata?.ImageID ||
    process.env.PROJECT_ROOT ||
    "/home/ubuntu/CloudOps-Sentinel";

  const result = db.prepare(`
    INSERT INTO trivy_scan_history (
      scan_type,
      target,
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      unknown_count,
      raw_json,
      scanned_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    "filesystem",
    String(target),
    counts.total,
    counts.critical,
    counts.high,
    counts.medium,
    counts.low,
    counts.unknown,
    rawText
  );

  const insertedRow = db
    .prepare("SELECT * FROM trivy_scan_history WHERE id = ?")
    .get(result.lastInsertRowid);

  return {
    success: true,
    message: "Latest Trivy scan saved to SQLite successfully",
    resultPath,
    inserted: true,
    scan: insertedRow
  };
}

function getTrivyScanHistory({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT
      id,
      scan_type,
      target,
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      unknown_count,
      scanned_at
    FROM trivy_scan_history
    ORDER BY datetime(scanned_at) DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function getTrivyScanSummary() {
  const latest = db.prepare(`
    SELECT
      id,
      scan_type,
      target,
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      unknown_count,
      scanned_at
    FROM trivy_scan_history
    ORDER BY datetime(scanned_at) DESC, id DESC
    LIMIT 1
  `).get();

  const totalScans = db
    .prepare("SELECT COUNT(*) AS count FROM trivy_scan_history")
    .get().count;

  const trend = db.prepare(`
    SELECT
      id,
      total_vulnerabilities,
      critical_count,
      high_count,
      medium_count,
      low_count,
      unknown_count,
      scanned_at
    FROM trivy_scan_history
    ORDER BY datetime(scanned_at) DESC, id DESC
    LIMIT 10
  `).all();

  return {
    totalScans,
    latest: latest || null,
    trend
  };
}

module.exports = {
  syncLatestTrivyScanToDatabase,
  getTrivyScanHistory,
  getTrivyScanSummary
};
