const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const { syncReportsToDatabase, getReportHistory, getReportHistorySummary } = require("./report-db.cjs");
const { db, DB_PATH, getSetting, setSetting } = require("./db.cjs");
const cors = require("cors");
const os = require("os");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { execSync } = require("child_process");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const REPORT_DIR = path.join(__dirname, "reports");
const TRIVY_CACHE_DIR = path.join(__dirname, "trivy-cache");

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(TRIVY_CACHE_DIR, { recursive: true });

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 1024 * 1024 * 20
    }).trim();
  } catch {
    return "";
  }
}

function readFileSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function getCpuUsage() {
  const cpu = run("top -bn1 | grep 'Cpu(s)' | awk '{print 100 - $8}'");
  return Number(parseFloat(cpu || 0).toFixed(2));
}

function getMemoryUsage() {
  return Number(
    run("free | awk '/Mem:/ {printf \"%.2f\", $3/$2 * 100}'") || 0
  );
}

function getDiskUsage() {
  return Number(
    run("df / | awk 'NR==2 {gsub(\"%\", \"\", $5); print $5}'") || 0
  );
}

function getServerHealth() {
  return {
    status: "online",
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpuCores: os.cpus().length,
    cpuUsage: getCpuUsage(),
    memoryUsage: getMemoryUsage(),
    diskUsage: getDiskUsage(),
    totalMemoryGB: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(2)),
    freeMemoryGB: Number((os.freemem() / 1024 / 1024 / 1024).toFixed(2)),
    uptime: run("uptime -p"),
    publicIp: run("curl -s ifconfig.me"),
    privateIp: run("hostname -I | awk '{print $1}'"),
    nginxStatus: run("systemctl is-active nginx") || "N/A",
    checkedAt: new Date().toISOString()
  };
}

function getDockerContainers() {
  const output = run(
    "timeout 5s docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'"
  );

  if (!output) return [];

  return output.split("\n").map((line) => {
    const [name, image, status, ports] = line.split("|");
    return { name, image, status, ports };
  });
}

function summarizeTrivy(scanOutput) {
  const summary = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    total: 0
  };

  if (!scanOutput) return summary;

  try {
    const parsed = JSON.parse(scanOutput);

    if (!parsed.Results) return summary;

    parsed.Results.forEach((result) => {
      if (!result.Vulnerabilities) return;

      result.Vulnerabilities.forEach((vuln) => {
        const severity = vuln.Severity?.toLowerCase();

        if (summary[severity] !== undefined) {
          summary[severity]++;
          summary.total++;
        }
      });
    });

    return summary;
  } catch {
    return summary;
  }
}

function getTrivySummary() {
  const frontendFile = path.join(TRIVY_CACHE_DIR, "frontend-trivy.json");
  const backendFile = path.join(TRIVY_CACHE_DIR, "backend-trivy.json");
  const lastScanFile = path.join(TRIVY_CACHE_DIR, "last-scan.txt");

  return {
    frontend: summarizeTrivy(readFileSafe(frontendFile)),
    backend: summarizeTrivy(readFileSafe(backendFile)),
    scannedImages: {
      frontend: "cloudops-sentinel-cloudops-frontend:latest",
      backend: "cloudops-sentinel-cloudops-backend:latest"
    },
    scannedAt: readFileSafe(lastScanFile) || "No cached Trivy scan found"
  };
}

function getHealthScore(serverHealth, trivySummary) {
  let score = 100;

  if (serverHealth.diskUsage >= 60) score -= 15;
  if (serverHealth.memoryUsage >= 80) score -= 15;
  if (serverHealth.cpuUsage >= 80) score -= 15;

  const high = trivySummary.frontend.high + trivySummary.backend.high;
  const critical =
    trivySummary.frontend.critical + trivySummary.backend.critical;

  if (high > 0) score -= 15;
  if (critical > 0) score -= 30;

  return Math.max(score, 0);
}

function drawTable(doc, title, headers, rows, startY) {
  const margin = 45;
  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - margin * 2;
  const rowHeight = 26;
  let y = startY;

  function pageBreakIfNeeded(height) {
    if (y + height > doc.page.height - 70) {
      doc.addPage();
      y = 50;
    }
  }

  pageBreakIfNeeded(60);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text(title, margin, y);

  y += 24;

  const colWidth = usableWidth / headers.length;

  doc.rect(margin, y, usableWidth, rowHeight).fill("#111827");

  headers.forEach((header, index) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#FFFFFF")
      .text(header, margin + index * colWidth + 6, y + 8, {
        width: colWidth - 12,
        height: rowHeight - 8,
        ellipsis: true
      });
  });

  y += rowHeight;

  rows.forEach((row, rowIndex) => {
    pageBreakIfNeeded(rowHeight + 10);

    doc
      .rect(margin, y, usableWidth, rowHeight)
      .fillAndStroke(rowIndex % 2 === 0 ? "#FFFFFF" : "#F9FAFB", "#D1D5DB");

    row.forEach((cell, index) => {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#111827")
        .text(String(cell || "N/A"), margin + index * colWidth + 6, y + 8, {
          width: colWidth - 12,
          height: rowHeight - 10,
          ellipsis: true
        });
    });

    y += rowHeight;
  });

  return y + 18;
}

function generatePdfReport(options = {}) {
  const serverHealth = getServerHealth();
  const dockerContainers = getDockerContainers();
  const trivySummary = getTrivySummary();
  const healthScore = getHealthScore(serverHealth, trivySummary);

  const date = new Date();

  const reportMeta = {
    generatedAt: date.toLocaleString(),
    deliveryMode: options.deliveryMode || "Manual PDF Generation",
    emailStatus: options.emailStatus || "Generated only - not emailed",
    emailSender: process.env.EMAIL_USER || "Not configured",
    emailRecipient: process.env.EMAIL_TO || "Not configured",
    triggeredBy: options.triggeredBy || "Dashboard / API",
    serverHostname: serverHealth.hostname || "N/A",
    publicIp: serverHealth.publicIp || "N/A"
  };

  const fileName = `cloudops-report-${date.toISOString().split("T")[0]}-${Date.now()}.pdf`;
  const filePath = path.join(REPORT_DIR, fileName);

  const doc = new PDFDocument({
    size: "A4",
    margin: 45
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const margin = 45;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - margin * 2;

  const risk =
    trivySummary.frontend.critical + trivySummary.backend.critical > 0
      ? "CRITICAL RISK"
      : trivySummary.frontend.high + trivySummary.backend.high > 0
      ? "HIGH RISK"
      : healthScore < 80
      ? "WARNING"
      : "HEALTHY";

  doc.rect(0, 0, pageWidth, 95).fill("#111827");

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#FFFFFF")
    .text("CloudOps Sentinel", margin, 28);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#D1D5DB")
    .text(
      "Daily Infrastructure, Docker, Security, and Server Health Report",
      margin,
      58
    );

  doc
    .roundedRect(pageWidth - margin - 125, 34, 125, 30, 6)
    .fill(
      risk === "HEALTHY"
        ? "#16A34A"
        : risk === "WARNING"
        ? "#D97706"
        : "#DC2626"
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#FFFFFF")
    .text(risk, pageWidth - margin - 125, 44, {
      width: 125,
      align: "center"
    });

  let y = 120;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111827")
    .text("Executive Summary", margin, y);

  y += 26;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#4B5563")
    .text(
      "This report provides a consolidated overview of EC2 health, Docker container status, Trivy security summary, and operational recommendations.",
      margin,
      y,
      {
        width: contentWidth,
        lineGap: 3
      }
    );

  y += 52;

  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;

  const cards = [
    ["Health Score", `${healthScore}/100`, healthScore >= 80 ? "#16A34A" : "#DC2626"],
    ["CPU Usage", `${serverHealth.cpuUsage}%`, serverHealth.cpuUsage >= 80 ? "#DC2626" : "#2563EB"],
    ["Memory Usage", `${serverHealth.memoryUsage}%`, serverHealth.memoryUsage >= 80 ? "#DC2626" : "#16A34A"],
    ["Disk Usage", `${serverHealth.diskUsage}%`, serverHealth.diskUsage >= 60 ? "#D97706" : "#16A34A"]
  ];

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);

    doc
      .roundedRect(x, y, cardWidth, 68, 8)
      .fillAndStroke("#F9FAFB", "#D1D5DB");

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6B7280")
      .text(card[0], x + 10, y + 12, {
        width: cardWidth - 20
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .fillColor(card[2])
      .text(card[1], x + 10, y + 34, {
        width: cardWidth - 20
      });
  });

  y += 95;

  y = drawTable(
    doc,
    "1. Report Delivery Details",
    ["Field", "Value"],
    [
      ["Report Generated At", reportMeta.generatedAt],
      ["Report Type", reportMeta.deliveryMode],
      ["Email Status", reportMeta.emailStatus],
      ["Email Sender", reportMeta.emailSender],
      ["Email Recipient", reportMeta.emailRecipient],
      ["Triggered By", reportMeta.triggeredBy],
      ["Server Hostname", reportMeta.serverHostname],
      ["Public IP", reportMeta.publicIp]
    ],
    y
  );

  y = drawTable(
    doc,
    "2. Server Overview",
    ["Metric", "Value"],
    [
      ["Server Status", serverHealth.status],
      ["Hostname", serverHealth.hostname],
      ["Public IP", serverHealth.publicIp],
      ["Private IP", serverHealth.privateIp],
      ["Platform", serverHealth.platform],
      ["Architecture", serverHealth.architecture],
      ["CPU Cores", serverHealth.cpuCores],
      ["Total Memory", `${serverHealth.totalMemoryGB} GB`],
      ["Free Memory", `${serverHealth.freeMemoryGB} GB`],
      ["Uptime", serverHealth.uptime],
      ["Nginx Status", serverHealth.nginxStatus],
      ["Generated At", date.toLocaleString()]
    ],
    y
  );

  y = drawTable(
    doc,
    "3. Docker Container Status",
    ["Container", "Image", "Status", "Ports"],
    dockerContainers.length
      ? dockerContainers.map((c) => [c.name, c.image, c.status, c.ports || "N/A"])
      : [["No containers found", "N/A", "N/A", "N/A"]],
    y
  );

  y = drawTable(
    doc,
    "4. Trivy Security Summary",
    ["Image", "Critical", "High", "Medium", "Low", "Total"],
    [
      [
        "Frontend",
        trivySummary.frontend.critical,
        trivySummary.frontend.high,
        trivySummary.frontend.medium,
        trivySummary.frontend.low,
        trivySummary.frontend.total
      ],
      [
        "Backend",
        trivySummary.backend.critical,
        trivySummary.backend.high,
        trivySummary.backend.medium,
        trivySummary.backend.low,
        trivySummary.backend.total
      ]
    ],
    y
  );

  if (y > doc.page.height - 180) {
    doc.addPage();
    y = 50;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text("5. Recommendations", margin, y);

  y += 24;

  const recommendations = [];

  recommendations.push(
    serverHealth.diskUsage >= 60
      ? "Disk usage is above 60%. Clean logs, unused Docker images, stopped containers, and old build files."
      : "Disk usage is healthy and below the configured warning threshold."
  );

  recommendations.push(
    serverHealth.memoryUsage >= 80
      ? "Memory usage is high. Review running Node.js processes, containers, and background services."
      : "Memory usage is within the acceptable operating range."
  );

  recommendations.push(
    serverHealth.cpuUsage >= 80
      ? "CPU usage is high. Investigate active processes and container workload."
      : "CPU usage is normal at the time of report generation."
  );

  const high = trivySummary.frontend.high + trivySummary.backend.high;
  const critical =
    trivySummary.frontend.critical + trivySummary.backend.critical;

  recommendations.push(
    high > 0 || critical > 0
      ? "Trivy detected HIGH or CRITICAL vulnerabilities. Review and patch dependencies before production release."
      : "No HIGH or CRITICAL vulnerabilities were detected in the scanned Docker images."
  );

  recommendations.push(
    "Keep daily PDF reports, Trivy scans, and email alerts enabled through cron automation."
  );

  recommendations.push(
    "For production, use Nginx reverse proxy with SSL and expose only ports 80 and 443 publicly."
  );

  recommendations.forEach((item, index) => {
    if (y > doc.page.height - 90) {
      doc.addPage();
      y = 50;
    }

    doc.circle(margin + 8, y + 8, 8).fill("#2563EB");

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#FFFFFF")
      .text(String(index + 1), margin + 5.5, y + 4);

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#111827")
      .text(item, margin + 28, y, {
        width: contentWidth - 28,
        lineGap: 3
      });

    y += 34;
  });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6B7280")
    .text(
      "Generated by CloudOps Sentinel | AWS EC2 DevSecOps Monitoring System",
      margin,
      doc.page.height - 45,
      {
        width: contentWidth,
        align: "center"
      }
    );

  doc.end();

  return {
    fileName,
    filePath,
    generatedAt: date.toISOString(),
    healthScore,
    delivery: reportMeta
  };
}

async function sendReportEmail(report) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"CloudOps Sentinel" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `CloudOps Sentinel Daily Report - ${new Date().toLocaleDateString()}`,
    text: `
CloudOps Sentinel Daily Infrastructure Report

Health Score: ${report.healthScore}/100
Generated At: ${report.generatedAt}

The PDF report is attached.
    `,
    attachments: [
      {
        filename: report.fileName,
        path: report.filePath
      }
    ]
  });
}

async function sendAlertEmail(alertType, message) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"CloudOps Sentinel Alerts" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `CloudOps Alert: ${alertType.toString().toUpperCase()}`,
    text: `
CloudOps Sentinel Alert

Alert Type: ${alertType}
Message: ${message}
Time: ${new Date().toLocaleString()}

Please check your EC2 server and CloudOps dashboard.
    `
  });
}


const ALERT_STATE_FILE = path.join(REPORT_DIR, "alert-state.json");
const ALERT_COOLDOWN_MINUTES = 60;

function readAlertState() {
  try {
    if (!fs.existsSync(ALERT_STATE_FILE)) {
      return {};
    }

    return JSON.parse(fs.readFileSync(ALERT_STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeAlertState(state) {
  fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(state, null, 2));
}

function shouldSendAlert(alertType, force = false) {
  if (force) {
    return true;
  }

  const state = readAlertState();
  const current = state[alertType];

  if (!current || current.status !== "active") {
    return true;
  }

  const lastSentAt = new Date(current.lastSentAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastSentAt) / 1000 / 60;

  return diffMinutes >= ALERT_COOLDOWN_MINUTES;
}

function markAlertActive(alertType, message) {
  const state = readAlertState();

  state[alertType] = {
    status: "active",
    message,
    lastSentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  writeAlertState(state);
}

function markAlertResolved(alertType) {
  const state = readAlertState();

  state[alertType] = {
    ...(state[alertType] || {}),
    status: "resolved",
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  writeAlertState(state);
}

function isAlertActive(alertType) {
  const state = readAlertState();
  return state[alertType]?.status === "active";
}


const METRICS_HISTORY_FILE = path.join(REPORT_DIR, "metrics-history.json");

function readMetricsHistory() {
  try {
    if (!fs.existsSync(METRICS_HISTORY_FILE)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(METRICS_HISTORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeMetricsHistory(history) {
  fs.writeFileSync(METRICS_HISTORY_FILE, JSON.stringify(history, null, 2));
}

function collectMetricSnapshot() {
  const serverHealth = getServerHealth();

  const snapshot = {
    timestamp: new Date().toISOString(),
    cpuUsage: serverHealth.cpuUsage,
    memoryUsage: serverHealth.memoryUsage,
    diskUsage: serverHealth.diskUsage,
    uptime: serverHealth.uptime,
    status: serverHealth.status
  };

  const history = readMetricsHistory();

  history.push(snapshot);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const cleanedHistory = history.filter((item) => {
    return new Date(item.timestamp).getTime() >= sevenDaysAgo;
  });

  writeMetricsHistory(cleanedHistory);

  return snapshot;
}


/* =========================
   SQLITE DATABASE ROUTES
========================= */

app.get("/api/db/status", (req, res) => {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);

    const counts = {};

    for (const table of tables) {
      if (table === "sqlite_sequence") continue;

      try {
        counts[table] = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
      } catch {
        counts[table] = null;
      }
    }

    res.json({
      success: true,
      database: DB_PATH,
      tables,
      counts,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to read database status",
      error: error.message
    });
  }
});

app.get("/api/settings", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT setting_key, setting_value, updated_at FROM app_settings ORDER BY setting_key")
      .all();

    const settings = {};

    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

    res.json({
      success: true,
      settings,
      rows,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message
    });
  }
});

app.post("/api/settings", (req, res) => {
  try {
    const settings = req.body || {};

    for (const [key, value] of Object.entries(settings)) {
      setSetting(key, value);
    }

    res.json({
      success: true,
      message: "Settings updated successfully",
      updatedSettings: settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message
    });
  }
});

app.get("/api/incidents", (req, res) => {
  try {
    const status = req.query.status;
    const severity = req.query.severity;

    let query = "SELECT * FROM incident_history WHERE 1 = 1";
    const params = [];

    if (status && status !== "ALL") {
      query += " AND status = ?";
      params.push(status);
    }

    if (severity && severity !== "ALL") {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY created_at DESC";

    const incidents = db.prepare(query).all(...params);

    res.json({
      success: true,
      incidents,
      total: incidents.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
      error: error.message
    });
  }
});

app.post("/api/incidents", (req, res) => {
  try {
    const {
      title,
      severity = "SEV3",
      source = "Manual",
      description = ""
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Incident title is required"
      });
    }

    const incidentNumber = `INC-${Date.now()}`;

    const result = db.prepare(`
      INSERT INTO incident_history (
        incident_number,
        title,
        severity,
        status,
        source,
        description
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      incidentNumber,
      String(title).trim(),
      severity,
      "open",
      source,
      description
    );

    const incident = db
      .prepare("SELECT * FROM incident_history WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Incident created successfully",
      incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create incident",
      error: error.message
    });
  }
});

app.patch("/api/incidents/:id/resolve", (req, res) => {
  try {
    const { rootCause = "", resolution = "" } = req.body || {};
    const id = Number(req.params.id);

    const existing = db
      .prepare("SELECT * FROM incident_history WHERE id = ?")
      .get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Incident not found"
      });
    }

    db.prepare(`
      UPDATE incident_history
      SET
        status = 'resolved',
        root_cause = ?,
        resolution = ?,
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rootCause, resolution, id);

    const incident = db
      .prepare("SELECT * FROM incident_history WHERE id = ?")
      .get(id);

    res.json({
      success: true,
      message: "Incident resolved successfully",
      incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resolve incident",
      error: error.message
    });
  }
});



/* =========================
   REPORT HISTORY DATABASE ROUTES
========================= */

app.post("/api/db/reports/sync", (req, res) => {
  try {
    const syncedReports = syncReportsToDatabase();
    const summary = getReportHistorySummary();

    res.json({
      success: true,
      message: "PDF report metadata synced to SQLite successfully",
      syncedCount: syncedReports.length,
      summary,
      syncedReports,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to sync PDF report metadata to SQLite",
      error: error.message
    });
  }
});

app.get("/api/db/reports/history", (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const reports = getReportHistory({ limit, offset });
    const summary = getReportHistorySummary();

    res.json({
      success: true,
      summary,
      reports,
      limit,
      offset,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch PDF report history from SQLite",
      error: error.message
    });
  }
});


/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "CloudOps Backend API is running",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/server-health", (req, res) => {
  res.json(getServerHealth());
});

app.get("/api/docker-containers", (req, res) => {
  res.json(getDockerContainers());
});

app.get("/api/trivy-summary", (req, res) => {
  res.json(getTrivySummary());
});


app.get("/api/trivy-vulnerabilities", (req, res) => {
  try {
    const frontendFile = path.join(TRIVY_CACHE_DIR, "frontend-trivy.json");
    const backendFile = path.join(TRIVY_CACHE_DIR, "backend-trivy.json");

    const frontendScan = readFileSafe(frontendFile);
    const backendScan = readFileSafe(backendFile);

    function extractVulnerabilities(scanOutput, imageName) {
      if (!scanOutput) {
        return [];
      }

      try {
        const parsed = JSON.parse(scanOutput);
        const vulnerabilities = [];

        if (!parsed.Results) {
          return [];
        }

        parsed.Results.forEach((result) => {
          if (!result.Vulnerabilities) return;

          result.Vulnerabilities.forEach((vuln) => {
            vulnerabilities.push({
              image: imageName,
              target: result.Target || "N/A",
              type: result.Type || "N/A",
              vulnerabilityId: vuln.VulnerabilityID || "N/A",
              severity: vuln.Severity || "UNKNOWN",
              packageName: vuln.PkgName || "N/A",
              installedVersion: vuln.InstalledVersion || "N/A",
              fixedVersion: vuln.FixedVersion || "Not Available",
              title: vuln.Title || "N/A",
              description: vuln.Description || "N/A",
              primaryUrl: vuln.PrimaryURL || "",
              publishedDate: vuln.PublishedDate || "N/A",
              lastModifiedDate: vuln.LastModifiedDate || "N/A"
            });
          });
        });

        return vulnerabilities;
      } catch {
        return [];
      }
    }

    const frontendVulnerabilities = extractVulnerabilities(
      frontendScan,
      "cloudops-sentinel-cloudops-frontend:latest"
    );

    const backendVulnerabilities = extractVulnerabilities(
      backendScan,
      "cloudops-sentinel-cloudops-backend:latest"
    );

    const allVulnerabilities = [
      ...frontendVulnerabilities,
      ...backendVulnerabilities
    ];

    const severityOrder = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
      UNKNOWN: 5
    };

    allVulnerabilities.sort((a, b) => {
      return (
        (severityOrder[a.severity] || 5) -
        (severityOrder[b.severity] || 5)
      );
    });

    res.json({
      total: allVulnerabilities.length,
      summary: {
        critical: allVulnerabilities.filter((v) => v.severity === "CRITICAL").length,
        high: allVulnerabilities.filter((v) => v.severity === "HIGH").length,
        medium: allVulnerabilities.filter((v) => v.severity === "MEDIUM").length,
        low: allVulnerabilities.filter((v) => v.severity === "LOW").length,
        unknown: allVulnerabilities.filter((v) => v.severity === "UNKNOWN").length
      },
      vulnerabilities: allVulnerabilities
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to read Trivy vulnerabilities",
      error: error.message
    });
  }
});

app.get("/api/generate-report", (req, res) => {
  const report = generatePdfReport({
    deliveryMode: "Manual PDF Generation",
    emailStatus: "Generated only - not emailed",
    triggeredBy: "/api/generate-report"
  });

  res.json({
    message: "PDF report generated successfully",
    report
  });
});

app.get("/api/generate-and-email-report", async (req, res) => {
  try {
    const report = generatePdfReport({
      deliveryMode: "Email PDF Report",
      emailStatus: "Queued for email delivery",
      triggeredBy: "/api/generate-and-email-report"
    });

    setTimeout(async () => {
      try {
        await sendReportEmail(report);
        console.log("Email report sent successfully");
      } catch (error) {
        console.error("Email sending failed:", error.message);
      }
    }, 2000);

    res.json({
      message: "PDF report generated and email sending started",
      report
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate or email report",
      error: error.message
    });
  }
});


app.get("/api/reports", (req, res) => {
  try {
    const files = fs
      .readdirSync(REPORT_DIR)
      .filter((file) => file.endsWith(".pdf"))
      .map((file) => {
        const filePath = path.join(REPORT_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          fileName: file,
          downloadUrl: `/api/reports/${file}`,
          fullDownloadUrl: `/api/reports/${file}`,
          generatedAt: stats.birthtime,
          generatedAtLocal: stats.birthtime.toLocaleString(),
          lastModifiedAt: stats.mtime,
          sizeKB: Number((stats.size / 1024).toFixed(2)),
          emailSender: process.env.EMAIL_USER || "Not configured",
          emailRecipient: process.env.EMAIL_TO || "Not configured",
          deliveryStatus: "Available report file",
          reportType: file.includes("cloudops-report")
            ? "CloudOps Infrastructure Report"
            : "PDF Report"
        };
      })
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    res.json(files);
  } catch (error) {
    res.status(500).json({
      message: "Failed to list reports",
      error: error.message
    });
  }
});


app.get("/api/reports/:fileName", (req, res) => {
  const filePath = path.join(REPORT_DIR, req.params.fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "Report not found"
    });
  }

  res.download(filePath);
});


app.get("/api/send-alert", async (req, res) => {
  try {
    const alertType = String(req.query.type || "general");
    const message = String(req.query.message || "CloudOps Sentinel alert triggered.");
    const force = String(req.query.force || "false") === "true";

    if (!shouldSendAlert(alertType, force)) {
      return res.json({
        message: "Duplicate alert suppressed",
        alertType,
        alertMessage: message,
        cooldownMinutes: ALERT_COOLDOWN_MINUTES
      });
    }

    await sendAlertEmail(alertType, message);
    markAlertActive(alertType, message);

    res.json({
      message: "Alert email sent successfully",
      alertType,
      alertMessage: message
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send alert email",
      error: error.message
    });
  }
});

app.get("/api/resolve-alert", async (req, res) => {
  try {
    const alertType = String(req.query.type || "general");
    const message = String(
      req.query.message || `CloudOps Sentinel alert resolved: ${alertType}`
    );

    if (!isAlertActive(alertType)) {
      return res.json({
        message: "No active alert to resolve",
        alertType
      });
    }

    await sendAlertEmail(`resolved-${alertType}`, message);
    markAlertResolved(alertType);

    res.json({
      message: "Resolved alert email sent successfully",
      alertType,
      alertMessage: message
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to resolve alert",
      error: error.message
    });
  }
});


app.get("/api/alerts-history", (req, res) => {
  const alertLogPath = path.join(REPORT_DIR, "alert.log");

  if (!fs.existsSync(alertLogPath)) {
    return res.json([]);
  }

  const logContent = fs.readFileSync(alertLogPath, "utf8");

  const lines = logContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-100)
    .reverse();

  res.json(
    lines.map((line, index) => ({
      id: index + 1,
      message: line,
      timestamp: new Date().toISOString()
    }))
  );
});


app.get("/api/metrics-history", (req, res) => {
  const history = readMetricsHistory();

  res.json({
    total: history.length,
    history
  });
});

app.get("/api/collect-metrics", (req, res) => {
  const snapshot = collectMetricSnapshot();

  res.json({
    message: "Metric snapshot collected successfully",
    snapshot
  });
});



app.get("/api/github-actions", async (req, res) => {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo) {
      return res.status(500).json({
        success: false,
        message: "GITHUB_OWNER or GITHUB_REPO is missing in backend/.env",
        fetchedAt: new Date().toISOString()
      });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100`;

    const headers = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "CloudOps-Sentinel",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    if (token && token.trim() !== "") {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers
    });

    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(response.status).json({
        success: false,
        message: "Failed to fetch GitHub Actions data",
        status: response.status,
        error: errorText,
        repository: `${owner}/${repo}`,
        rateLimitRemaining,
        rateLimitReset,
        fetchedAt: new Date().toISOString()
      });
    }

    const data = await response.json();
    const workflowRuns = Array.isArray(data.workflow_runs) ? data.workflow_runs : [];

    function secondsBetween(start, end) {
      if (!start || !end) return null;
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      if (Number.isNaN(diffMs) || diffMs < 0) return null;
      return Math.round(diffMs / 1000);
    }

    function normalizeRun(run) {
      const conclusion = run.conclusion || null;
      const status = run.status || "unknown";

      let displayStatus = "IN_PROGRESS";

      if (conclusion === "success") displayStatus = "SUCCESS";
      else if (conclusion === "failure") displayStatus = "FAILED";
      else if (conclusion === "cancelled") displayStatus = "CANCELLED";
      else if (status === "queued") displayStatus = "QUEUED";
      else if (status === "in_progress") displayStatus = "IN_PROGRESS";

      return {
        id: run.id,
        repository: `${owner}/${repo}`,
        name: run.name || "GitHub Actions Workflow",
        workflow: run.name || "GitHub Actions Workflow",
        workflowName: run.name || "GitHub Actions Workflow",
        workflow_name: run.name || "GitHub Actions Workflow",
        runNumber: run.run_number,
        runAttempt: run.run_attempt,
        branch: run.head_branch,
        status,
        conclusion,
        displayStatus,
        commitSha: run.head_sha ? run.head_sha.substring(0, 7) : "N/A",
        fullCommitSha: run.head_sha || "N/A",
        commitMessage: run.head_commit?.message || "N/A",
        triggeredBy: run.actor?.login || "N/A",
        triggered_by: run.actor?.login || "N/A",
        actor: run.actor?.login || "N/A",
        actorLogin: run.actor?.login || "N/A",
        event: run.event || "N/A",
        htmlUrl: run.html_url,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        durationSeconds: secondsBetween(run.created_at, run.updated_at)
      };
    }

    const runs = workflowRuns.map(normalizeRun);
    const latestRun = runs[0] || null;

    const successful = runs.filter((run) => run.conclusion === "success").length;
    const failed = runs.filter((run) => run.conclusion === "failure").length;
    const cancelled = runs.filter((run) => run.conclusion === "cancelled").length;
    const inProgress = runs.filter((run) => {
      return run.status === "queued" || run.status === "in_progress" || run.status === "waiting";
    }).length;

    const totalRuns = typeof data.total_count === "number" ? data.total_count : runs.length;

    const successfulRuns = successful;
    const failedRuns = failed;
    const inProgressRuns = inProgress;
    const cancelledRuns = cancelled;

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.json({
      success: true,
      repository: `${owner}/${repo}`,

      totalRuns,
      successful,
      successfulRuns,
      success: successful,

      failed,
      failedRuns,

      inProgress,
      inProgressRuns,

      cancelled,
      cancelledRuns,

      summary: {
        totalRuns,

        successful,
        successfulRuns,
        success: successful,

        failed,
        failedRuns,

        inProgress,
        inProgressRuns,

        cancelled,
        cancelledRuns
      },

      stats: {
        totalRuns,

        successful,
        successfulRuns,
        success: successful,

        failed,
        failedRuns,

        inProgress,
        inProgressRuns,

        cancelled,
        cancelledRuns
      },

      latestDeployment: latestRun,
      latestRun,
      runs,

      github: {
        totalCount: data.total_count,
        returnedRuns: runs.length,
        rateLimitRemaining,
        rateLimitReset
      },

      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "GitHub Actions API route failed",
      error: error.message,
      fetchedAt: new Date().toISOString()
    });
  }
});


app.get("/api/nginx-logs", (req, res) => {
  try {
    const accessLogPath = "/var/log/nginx/access.log";
    const errorLogPath = "/var/log/nginx/error.log";

    function readLastLines(filePath, maxLines = 500) {
      try {
        if (!fs.existsSync(filePath)) {
          return [];
        }

        const content = fs.readFileSync(filePath, "utf8");

        return content
          .split("\n")
          .filter((line) => line.trim() !== "")
          .slice(-maxLines);
      } catch {
        return [];
      }
    }

    const accessLines = readLastLines(accessLogPath, 700);
    const errorLines = readLastLines(errorLogPath, 100);

    const requests = accessLines.map((line) => {
      const ip = line.split(" ")[0] || "N/A";

      const statusMatch = line.match(/" (\d{3}) /);
      const status = statusMatch ? statusMatch[1] : "N/A";

      const requestMatch = line.match(/"([A-Z]+) ([^ ]+) HTTP/);
      const method = requestMatch ? requestMatch[1] : "N/A";
      const route = requestMatch ? requestMatch[2] : "N/A";

      const timeMatch = line.match(/\[(.*?)\]/);
      const time = timeMatch ? timeMatch[1] : "N/A";

      return {
        ip,
        method,
        route,
        status,
        time,
        raw: line
      };
    });

    const totalRequests = requests.length;
    const successRequests = requests.filter((r) => r.status.startsWith("2")).length;
    const redirectRequests = requests.filter((r) => r.status.startsWith("3")).length;
    const clientErrors = requests.filter((r) => r.status.startsWith("4")).length;
    const serverErrors = requests.filter((r) => r.status.startsWith("5")).length;

    const topIpsMap = {};
    const topRoutesMap = {};
    const statusMap = {};

    requests.forEach((request) => {
      topIpsMap[request.ip] = (topIpsMap[request.ip] || 0) + 1;
      topRoutesMap[request.route] = (topRoutesMap[request.route] || 0) + 1;
      statusMap[request.status] = (statusMap[request.status] || 0) + 1;
    });

    const topIps = Object.entries(topIpsMap)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topRoutes = Object.entries(topRoutesMap)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statusCodes = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      summary: {
        totalRequests,
        successRequests,
        redirectRequests,
        clientErrors,
        serverErrors,
        errorLogCount: errorLines.length
      },
      topIps,
      topRoutes,
      statusCodes,
      latestRequests: requests.reverse().slice(0, 50),
      latestErrors: errorLines.reverse().slice(0, 30),
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to read Nginx logs",
      error: error.message
    });
  }
});


app.get("/api/cleanup-summary", (req, res) => {
  try {
    const diskUsage = getDiskUsage();

    const largestFoldersRaw = run(
      "du -h /home/ubuntu/CloudOps-Sentinel /var/log /var/www 2>/dev/null | sort -hr | head -10"
    );

    const dockerDiskRaw = run("docker system df 2>/dev/null");

    const oldReportsRaw = run(
      "find /home/ubuntu/CloudOps-Sentinel/backend/reports -name '*.pdf' -mtime +7 2>/dev/null | wc -l"
    );

    const oldLogsRaw = run(
      "find /home/ubuntu/CloudOps-Sentinel/backend/reports -name '*.log' -mtime +7 2>/dev/null | wc -l"
    );

    const stoppedContainersRaw = run(
      "docker ps -a --filter status=exited --format '{{.Names}}' 2>/dev/null | wc -l"
    );

    const danglingImagesRaw = run(
      "docker images -f dangling=true -q 2>/dev/null | wc -l"
    );

    res.json({
      diskUsage,
      largestFolders: largestFoldersRaw
        ? largestFoldersRaw.split("\n").map((line) => {
            const parts = line.trim().split(/\s+/);
            return {
              size: parts[0],
              path: parts.slice(1).join(" ")
            };
          })
        : [],
      dockerDiskUsage: dockerDiskRaw || "Docker data not available",
      cleanupCandidates: {
        oldPdfReports: Number(oldReportsRaw || 0),
        oldLogFiles: Number(oldLogsRaw || 0),
        stoppedContainers: Number(stoppedContainersRaw || 0),
        danglingImages: Number(danglingImagesRaw || 0)
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate cleanup summary",
      error: error.message
    });
  }
});

app.get("/api/run-cleanup", (req, res) => {
  try {
    const type = String(req.query.type || "preview");

    const allowedTypes = [
      "old-reports",
      "old-logs",
      "stopped-containers",
      "dangling-images",
      "npm-cache",
      "safe-all"
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid cleanup type",
        allowedTypes
      });
    }

    const actions = [];

    if (type === "old-reports" || type === "safe-all") {
      const result = run(
        "find /home/ubuntu/CloudOps-Sentinel/backend/reports -name '*.pdf' -mtime +7 -delete -print 2>/dev/null"
      );
      actions.push({
        action: "Deleted PDF reports older than 7 days",
        result: result || "No old PDF reports found"
      });
    }

    if (type === "old-logs" || type === "safe-all") {
      const result = run(
        "find /home/ubuntu/CloudOps-Sentinel/backend/reports -name '*.log' -mtime +7 -delete -print 2>/dev/null"
      );
      actions.push({
        action: "Deleted log files older than 7 days",
        result: result || "No old log files found"
      });
    }

    if (type === "stopped-containers" || type === "safe-all") {
      const result = run("docker container prune -f 2>/dev/null");
      actions.push({
        action: "Removed stopped Docker containers",
        result: result || "No stopped containers removed"
      });
    }

    if (type === "dangling-images" || type === "safe-all") {
      const result = run("docker image prune -f 2>/dev/null");
      actions.push({
        action: "Removed dangling Docker images",
        result: result || "No dangling images removed"
      });
    }

    if (type === "npm-cache") {
      const result = run("npm cache clean --force 2>/dev/null");
      actions.push({
        action: "Cleaned npm cache",
        result: result || "NPM cache cleanup completed"
      });
    }

    res.json({
      message: "Cleanup completed",
      type,
      actions,
      cleanedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Cleanup failed",
      error: error.message
    });
  }
});


app.get("/api/activity-log", (req, res) => {
  try {
    const events = [];

    function addEvent(type, severity, message, source, timestamp, metadata = {}) {
      events.push({
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type,
        severity,
        message,
        source,
        timestamp: timestamp || new Date().toISOString(),
        metadata
      });
    }

    function safeStat(filePath) {
      try {
        if (!fs.existsSync(filePath)) return null;
        return fs.statSync(filePath);
      } catch {
        return null;
      }
    }

    function readSafe(filePath) {
      try {
        if (!fs.existsSync(filePath)) return "";
        return fs.readFileSync(filePath, "utf8");
      } catch {
        return "";
      }
    }

    /* =========================
       BACKEND STATUS EVENT
    ========================= */
    addEvent(
      "Backend",
      "success",
      "CloudOps backend API is running",
      "PM2 / Node.js",
      new Date().toISOString(),
      {
        port: PORT,
        status: "online"
      }
    );

    /* =========================
       SERVER HEALTH EVENT
    ========================= */
    try {
      const health = getServerHealth();

      let severity = "success";

      if (Number(health.diskUsage) >= 80 || Number(health.memoryUsage) >= 90) {
        severity = "critical";
      } else if (Number(health.diskUsage) >= 60 || Number(health.memoryUsage) >= 75) {
        severity = "warning";
      }

      addEvent(
        "Server Health",
        severity,
        `Server is ${health.status}. CPU: ${health.cpuUsage}%, Memory: ${health.memoryUsage}%, Disk: ${health.diskUsage}%`,
        "Server Monitor",
        health.checkedAt || new Date().toISOString(),
        health
      );
    } catch {
      addEvent(
        "Server Health",
        "warning",
        "Unable to collect server health snapshot",
        "Server Monitor",
        new Date().toISOString()
      );
    }

    /* =========================
       DOCKER EVENTS
    ========================= */
    try {
      const containers = getDockerContainers();

      if (containers.length === 0) {
        addEvent(
          "Docker",
          "warning",
          "No Docker containers found",
          "Docker",
          new Date().toISOString()
        );
      } else {
        containers.forEach((container) => {
          const isRunning = String(container.status || "").toLowerCase().includes("up");

          addEvent(
            "Docker",
            isRunning ? "success" : "warning",
            `Container ${container.name} is ${container.status}`,
            "Docker",
            new Date().toISOString(),
            container
          );
        });
      }
    } catch {
      addEvent(
        "Docker",
        "warning",
        "Unable to read Docker container status",
        "Docker",
        new Date().toISOString()
      );
    }

    /* =========================
       TRIVY SCAN EVENT
    ========================= */
    try {
      const trivySummary = getTrivySummary();
      const frontend = trivySummary.frontend || {};
      const backend = trivySummary.backend || {};

      const totalCritical = Number(frontend.critical || 0) + Number(backend.critical || 0);
      const totalHigh = Number(frontend.high || 0) + Number(backend.high || 0);
      const totalVulnerabilities = Number(frontend.total || 0) + Number(backend.total || 0);

      let severity = "success";

      if (totalCritical > 0) {
        severity = "critical";
      } else if (totalHigh > 0) {
        severity = "warning";
      }

      addEvent(
        "Trivy Security",
        severity,
        `Trivy scan detected ${totalVulnerabilities} vulnerabilities. Critical: ${totalCritical}, High: ${totalHigh}`,
        "Trivy",
        trivySummary.scannedAt || new Date().toISOString(),
        trivySummary
      );
    } catch {
      addEvent(
        "Trivy Security",
        "warning",
        "Unable to read Trivy scan summary",
        "Trivy",
        new Date().toISOString()
      );
    }

    /* =========================
       PDF REPORT EVENTS
    ========================= */
    try {
      const reportFiles = fs
        .readdirSync(REPORT_DIR)
        .filter((file) => file.endsWith(".pdf"))
        .map((file) => {
          const filePath = path.join(REPORT_DIR, file);
          const stats = safeStat(filePath);

          return {
            file,
            filePath,
            stats
          };
        })
        .filter((item) => item.stats)
        .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)
        .slice(0, 10);

      reportFiles.forEach((report) => {
        addEvent(
          "PDF Report",
          "info",
          `PDF report generated: ${report.file}`,
          "Report Engine",
          report.stats.mtime.toISOString(),
          {
            fileName: report.file,
            sizeKB: Number((report.stats.size / 1024).toFixed(2)),
            emailSender: process.env.EMAIL_USER || "Not configured",
            emailRecipient: process.env.EMAIL_TO || "Not configured"
          }
        );
      });
    } catch {
      addEvent(
        "PDF Report",
        "warning",
        "Unable to read PDF report history",
        "Report Engine",
        new Date().toISOString()
      );
    }

    /* =========================
       ALERT LOG EVENTS
    ========================= */
    try {
      const alertLogPath = path.join(REPORT_DIR, "alert.log");
      const alertContent = readSafe(alertLogPath);

      alertContent
        .split("\n")
        .filter((line) => line.trim() !== "")
        .slice(-30)
        .forEach((line) => {
          let severity = "info";

          if (line.toLowerCase().includes("critical") || line.toLowerCase().includes("failed") || line.toLowerCase().includes("down")) {
            severity = "critical";
          } else if (line.toLowerCase().includes("warning") || line.toLowerCase().includes("high")) {
            severity = "warning";
          } else if (line.toLowerCase().includes("resolved") || line.toLowerCase().includes("healthy")) {
            severity = "success";
          }

          addEvent(
            "Alert",
            severity,
            line.slice(0, 250),
            "Alert Engine",
            new Date().toISOString()
          );
        });
    } catch {
      addEvent(
        "Alert",
        "warning",
        "Unable to read alert log",
        "Alert Engine",
        new Date().toISOString()
      );
    }

    /* =========================
       CLEANUP EVENTS
    ========================= */
    try {
      const cleanupLogPath = path.join(REPORT_DIR, "cleanup.log");
      const cleanupContent = readSafe(cleanupLogPath);

      cleanupContent
        .split("\n")
        .filter((line) => line.trim() !== "")
        .slice(-20)
        .forEach((line) => {
          addEvent(
            "Cleanup",
            "info",
            line.slice(0, 250),
            "Cleanup Module",
            new Date().toISOString()
          );
        });
    } catch {
      // cleanup log is optional
    }

    const sortedEvents = events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);

    const summary = {
      totalEvents: sortedEvents.length,
      critical: sortedEvents.filter((event) => event.severity === "critical").length,
      warning: sortedEvents.filter((event) => event.severity === "warning").length,
      success: sortedEvents.filter((event) => event.severity === "success").length,
      info: sortedEvents.filter((event) => event.severity === "info").length
    };

    res.json({
      summary,
      events: sortedEvents,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate activity log",
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CloudOps Backend Running On Port ${PORT}`);
});
