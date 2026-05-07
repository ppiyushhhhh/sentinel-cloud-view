require("dotenv").config();

const express = require("express");
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
  const files = fs
    .readdirSync(REPORT_DIR)
    .filter((file) => file.endsWith(".pdf"))
    .map((file) => ({
      fileName: file,
      downloadUrl: `/api/reports/${file}`,
      fullDownloadUrl: `/api/reports/${file}`
    }));

  res.json(files);
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
    const owner = "ppiyushhhhh";
    const repo = "sentinel-cloud-view";

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=20`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "CloudOps-Sentinel"
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Failed to fetch GitHub Actions data",
        status: response.status
      });
    }

    const data = await response.json();

    function calculateDuration(createdAt, updatedAt) {
      if (!createdAt || !updatedAt) return "N/A";

      const start = new Date(createdAt).getTime();
      const end = new Date(updatedAt).getTime();

      if (Number.isNaN(start) || Number.isNaN(end)) return "N/A";

      const totalSeconds = Math.floor((end - start) / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return `${minutes}m ${seconds}s`;
    }

    const runs = data.workflow_runs.map((run) => ({
      id: run.id,
      runNumber: run.run_number,
      name: run.name,
      displayTitle: run.display_title || run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      commitMessage: run.head_commit?.message || "N/A",
      commitSha: run.head_sha?.substring(0, 7),
      fullCommitSha: run.head_sha,
      actor: run.actor?.login || "N/A",
      event: run.event,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      duration: calculateDuration(run.created_at, run.updated_at),
      htmlUrl: run.html_url,
      workflowId: run.workflow_id,
      runAttempt: run.run_attempt,
      repository: run.repository?.full_name || `${owner}/${repo}`
    }));

    const summary = {
      totalRuns: runs.length,
      successfulRuns: runs.filter(
        (run) => run.status === "completed" && run.conclusion === "success"
      ).length,
      failedRuns: runs.filter(
        (run) => run.status === "completed" && run.conclusion === "failure"
      ).length,
      inProgressRuns: runs.filter((run) => run.status === "in_progress").length,
      cancelledRuns: runs.filter(
        (run) => run.status === "completed" && run.conclusion === "cancelled"
      ).length
    };

    res.json({
      repository: `${owner}/${repo}`,
      latestRun: runs[0] || null,
      summary,
      runs
    });
  } catch (error) {
    res.status(500).json({
      message: "GitHub Actions API error",
      error: error.message
    });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`CloudOps Backend Running On Port ${PORT}`);
});
