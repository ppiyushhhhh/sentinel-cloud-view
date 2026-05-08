const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const status = process.argv[2] || "UNKNOWN";
const backupFile = process.argv[3] || "N/A";
const message = process.argv[4] || "";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO || process.env.REPORT_RECIPIENT || EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
  console.error("Missing EMAIL_USER, EMAIL_PASS, or EMAIL_TO in backend/.env");
  process.exit(1);
}

const backupExists = backupFile !== "N/A" && fs.existsSync(backupFile);
const backupSize = backupExists
  ? `${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`
  : "N/A";

const hostname = require("os").hostname();
const now = new Date().toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata"
});

const isSuccess = status.toUpperCase() === "SUCCESS";

const subject = isSuccess
  ? `CloudOps Sentinel DB Backup SUCCESS - ${now}`
  : `CloudOps Sentinel DB Backup FAILED - ${now}`;

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      color: #111827;
      padding: 24px;
    }
    .container {
      max-width: 760px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .header {
      padding: 20px 24px;
      background: ${isSuccess ? "#065f46" : "#991b1b"};
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
    }
    .content {
      padding: 24px;
    }
    .badge {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: bold;
      color: #ffffff;
      background: ${isSuccess ? "#16a34a" : "#dc2626"};
      margin-bottom: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    td:first-child {
      font-weight: bold;
      color: #374151;
      width: 230px;
    }
    .footer {
      padding: 16px 24px;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CloudOps Sentinel SQLite Backup Report</h1>
    </div>

    <div class="content">
      <div class="badge">${status.toUpperCase()}</div>

      <table>
        <tr>
          <td>Server</td>
          <td>${hostname}</td>
        </tr>
        <tr>
          <td>Status</td>
          <td>${status.toUpperCase()}</td>
        </tr>
        <tr>
          <td>Backup Time</td>
          <td>${now}</td>
        </tr>
        <tr>
          <td>Database Path</td>
          <td><code>/home/ubuntu/CloudOps-Sentinel/backend/data/cloudops.db</code></td>
        </tr>
        <tr>
          <td>Backup File</td>
          <td><code>${backupFile}</code></td>
        </tr>
        <tr>
          <td>Backup Size</td>
          <td>${backupSize}</td>
        </tr>
        <tr>
          <td>Log File</td>
          <td><code>/home/ubuntu/cloudops-db-backups/db-backup.log</code></td>
        </tr>
        <tr>
          <td>Message</td>
          <td>${message || "No additional message."}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      This is an automated database backup notification from CloudOps Sentinel.
    </div>
  </div>
</body>
</html>
`;

async function sendMail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"CloudOps Sentinel" <${EMAIL_USER}>`,
    to: EMAIL_TO,
    subject,
    html
  });

  console.log(`Backup notification email sent to ${EMAIL_TO}`);
}

sendMail().catch((error) => {
  console.error("Failed to send backup notification email:", error.message);
  process.exit(1);
});
