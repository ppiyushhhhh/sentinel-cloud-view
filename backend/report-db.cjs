const fs = require("fs");
const path = require("path");
const { db } = require("./db.cjs");

function getReportDir() {
  return (
    process.env.REPORT_DIR ||
    path.join(__dirname, "reports")
  );
}

function inferReportType(fileName) {
  const lower = String(fileName).toLowerCase();

  if (lower.includes("daily")) return "Daily Infrastructure Report";
  if (lower.includes("trivy")) return "Trivy Security Report";
  if (lower.includes("security")) return "Security Report";
  if (lower.includes("email")) return "Email Report";
  if (lower.includes("cloudops")) return "CloudOps Infrastructure Report";

  return "Infrastructure Report";
}

function getDeliveryStatus(fileName) {
  const lower = String(fileName).toLowerCase();

  if (lower.includes("email") || lower.includes("sent")) {
    return "Email Sent";
  }

  return "Generated";
}

function syncReportsToDatabase() {
  const reportDir = getReportDir();

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const files = fs
    .readdirSync(reportDir)
    .filter((file) => file.toLowerCase().endsWith(".pdf"));

  const upsert = db.prepare(`
    INSERT INTO report_history (
      file_name,
      report_type,
      file_size_kb,
      email_sender,
      email_recipient,
      delivery_status,
      generated_at,
      last_modified_at,
      download_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(file_name)
    DO UPDATE SET
      report_type = excluded.report_type,
      file_size_kb = excluded.file_size_kb,
      email_sender = excluded.email_sender,
      email_recipient = excluded.email_recipient,
      delivery_status = excluded.delivery_status,
      generated_at = excluded.generated_at,
      last_modified_at = excluded.last_modified_at,
      download_url = excluded.download_url
  `);

  const syncedReports = [];

  for (const fileName of files) {
    const filePath = path.join(reportDir, fileName);
    const stats = fs.statSync(filePath);

    const report = {
      fileName,
      reportType: inferReportType(fileName),
      fileSizeKB: Number((stats.size / 1024).toFixed(2)),
      emailSender: process.env.EMAIL_USER || "Not configured",
      emailRecipient: process.env.EMAIL_TO || "Not configured",
      deliveryStatus: getDeliveryStatus(fileName),
      generatedAt: stats.birthtime.toISOString(),
      lastModifiedAt: stats.mtime.toISOString(),
      downloadUrl: `/api/reports/${encodeURIComponent(fileName)}`
    };

    upsert.run(
      report.fileName,
      report.reportType,
      report.fileSizeKB,
      report.emailSender,
      report.emailRecipient,
      report.deliveryStatus,
      report.generatedAt,
      report.lastModifiedAt,
      report.downloadUrl
    );

    syncedReports.push(report);
  }

  return syncedReports;
}

function getReportHistory({ limit = 100, offset = 0 } = {}) {
  return db
    .prepare(`
      SELECT
        id,
        file_name,
        report_type,
        file_size_kb,
        email_sender,
        email_recipient,
        delivery_status,
        generated_at,
        last_modified_at,
        download_url,
        created_at
      FROM report_history
      ORDER BY datetime(last_modified_at) DESC, id DESC
      LIMIT ? OFFSET ?
    `)
    .all(limit, offset);
}

function getReportHistorySummary() {
  const total = db
    .prepare("SELECT COUNT(*) AS count FROM report_history")
    .get().count;

  const totalSize = db
    .prepare("SELECT COALESCE(SUM(file_size_kb), 0) AS totalSizeKB FROM report_history")
    .get().totalSizeKB;

  const byStatus = db
    .prepare(`
      SELECT delivery_status, COUNT(*) AS count
      FROM report_history
      GROUP BY delivery_status
      ORDER BY count DESC
    `)
    .all();

  const byType = db
    .prepare(`
      SELECT report_type, COUNT(*) AS count
      FROM report_history
      GROUP BY report_type
      ORDER BY count DESC
    `)
    .all();

  return {
    total,
    totalSizeKB: Number(Number(totalSize || 0).toFixed(2)),
    byStatus,
    byType
  };
}

module.exports = {
  syncReportsToDatabase,
  getReportHistory,
  getReportHistorySummary
};
