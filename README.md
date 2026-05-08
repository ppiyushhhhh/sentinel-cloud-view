# CloudOps Sentinel

[![GitHub Stars](https://img.shields.io/badge/⭐-Stars-blue?style=flat-square)](https://github.com/ppiyushhhhh/sentinel-cloud-view)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)](#current-capabilities)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-brightgreen?style=flat-square)](#tech-stack)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)](#tech-stack)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square)](#database)

> **Production-Style DevOps Monitoring and Operations Dashboard with Login Protection, SQLite Persistence, and Automated Reporting**

CloudOps Sentinel is a full-stack DevOps operations dashboard deployed on AWS EC2 that provides live infrastructure visibility, CI/CD deployment tracking, security vulnerability monitoring, incident management, PDF report automation, activity logging, and persistent data storage—all protected behind a login gate.

🔗 **Live Demo:** [http://3.110.173.200](http://3.110.173.200)  
👤 **Test Credentials:** Protected by frontend login gate

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Live Application](#live-application)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Security](#security)
- [Deployment](#deployment)
- [Backup & Restore](#backup--restore)
- [Current Status](#current-capabilities)
- [Future Improvements](#future-improvements)
- [Author](#author)

## 📖 Overview

CloudOps Sentinel is a production-style DevOps monitoring and operations dashboard built for Linux server environments. It demonstrates practical DevOps, CloudOps, and SRE workflows on an AWS EC2 instance using:

- **Frontend:** React-based SPA with TypeScript
- **Backend:** Node.js Express API with SQLite persistence
- **Infrastructure:** Nginx reverse proxy, PM2 process management
- **Automation:** GitHub Actions CI/CD, Cron jobs, Trivy security scanning
- **Monitoring:** Real-time server metrics, Docker status, CI/CD tracking
- **Operations:** Incident management, activity logs, alert tracking, automated backups

The dashboard provides a single pane of glass for cloud infrastructure operations with role-based access control through a frontend login gate.

## ✨ Key Features

### 🔐 1. Login-Protected Dashboard
- Frontend login gate protecting all dashboard routes
- Session-based authentication
- Automatic redirect to login page for unauthenticated users
- Protected routes: `/`, `/server`, `/docker`, `/pipeline`, `/trivy`, `/reports`, `/activity`, `/alerts`, `/incidents`, `/nginx-logs`, `/cleanup`, `/database`, `/settings`

### 📊 2. Dashboard Overview Page
- High-level server and operational status
- System health summary
- Key operational indicators
- Quick navigation to monitoring pages

### 🖥️ 3. Live Server Health Monitoring
Real-time EC2 metrics:
- CPU usage and threshold alerts
- Memory usage and threshold alerts
- Disk usage and threshold alerts
- Server uptime and availability
- IP address information (public & private)
- Backend API health status
- Last metric check timestamp

**Endpoint:** `GET /api/server-health`

### 🐳 4. Docker Container Monitoring
- Docker daemon availability status
- Container listing with status
- Runtime container information
- Container port exposure details
- Real-time container state tracking

**Endpoint:** `GET /api/docker-containers`

### 🚀 5. GitHub Actions CI/CD Pipeline Tracking
Track deployment history with:
- Total workflow runs
- Successful, failed, in-progress, cancelled runs
- Latest deployment information
- Repository and workflow metadata
- Run details: commit SHA, message, triggering actor
- Deployment history with pagination
- Status and search filters
- SQLite-backed pipeline history

**Features:**
- Authenticated GitHub API calls (no rate limits)
- Pipeline data stored in `pipeline_runs` table
- Search and filter by status

### 🔍 6. Trivy Security Vulnerability Monitoring
- Filesystem vulnerability scanning
- Severity-based categorization: Critical, High, Medium, Low
- Vulnerability trend tracking over time
- Scan history stored in SQLite
- Scheduled scans via cron jobs
- JSON result generation and caching

**Endpoint:** `GET /api/trivy-summary`

**Storage:**
- Results: `backend/reports/trivy-results.json`
- History table: `trivy_scan_history`

### 📄 7. PDF Infrastructure Reports
- PDF report listing and management
- Report metadata (name, type, size, date)
- Email delivery tracking
- Search and filter capabilities
- Pagination support
- Download links
- Report metadata persistence in SQLite

**Endpoints:**
- `GET /api/generate-report` - Generate new report
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get specific report

**Storage:**
- Reports: `backend/reports/`
- Metadata: `report_history` table

### 📋 8. Activity Log
Operational event tracking:
- Backend events
- System-level events
- User-triggered actions
- Automation activity
- Audit trail for compliance

### 🚨 9. Alert Management
SQLite-backed alert system with:
- Alert type and severity classification
- Alert title and detailed messages
- Source tracking (system, user, automation)
- Status management (active, resolved, acknowledged)
- Metadata storage in JSON format
- Created and resolved timestamps
- Alert history persistence through server restarts

**Storage:** `alert_history` table

### 🔧 10. Incident Management
Database-backed incident workflow:
- Create, view, and manage incidents
- Status tracking (open, in-progress, resolved)
- Severity levels (critical, high, medium, low)
- Root cause analysis
- Resolution documentation
- Searchable incident history
- Pagination support
- Filtering by status and severity

**Example Incidents:**
- Backend API down
- Daily email report failed
- Trivy scan failed
- GitHub Actions deployment failed
- High disk usage alert
- Nginx error spike

**Storage:** `incident_history` table

### 📊 11. Nginx Log Monitoring
Visibility into Nginx operations:
- Access log analysis
- Error log monitoring
- Reverse proxy problem detection
- Failed upstream connections
- HTTP-level troubleshooting
- Real-time log streaming

### 🧹 12. Server Cleanup Utilities
Maintenance and disk management:
- Temporary file cleanup
- Old log removal
- Runtime cleanup operations
- Disk space management
- Maintenance task visibility

### 💾 13. Database Status Page
SQLite database health and analytics:
- Database file path and type
- Table listing with row counts
- Persistence coverage overview
- Database file size
- Last backup timestamp

**Core Tables:**
- `users` - User accounts and roles
- `app_settings` - Persistent dashboard settings
- `incident_history` - Incidents and resolutions
- `report_history` - PDF report metadata
- `trivy_scan_history` - Vulnerability scans
- `pipeline_runs` - GitHub Actions runs
- `alert_history` - Alert events

**Database Path:** `backend/data/cloudops.db`

### ⚙️ 14. Settings Page with SQLite Persistence
Persistent dashboard configuration:
- CPU threshold (%)
- Memory threshold (%)
- Disk threshold (%)
- Alert cooldown period
- Report page size
- Pipeline page size
- Trivy scan schedule reference
- Report email schedule reference
- Email notification preferences

Settings survive:
- Browser refresh
- PM2 restart
- Nginx restart
- Server reboot

**Storage:** `app_settings` table

### 🔄 15. Automatic SQLite Database Backup
Automated backup system with:
- Scheduled backup script execution
- Compressed backup files (.db.gz)
- Timestamped backup naming
- Retention policy (configurable)
- Backup logs
- Email notifications (success/failure)
- One-click restore capability

**Backup Location:** `/home/ubuntu/cloudops-db-backups/`  
**Backup Script:** `scripts/backup-sqlite-db.sh`  
**Notification Script:** `backend/send-db-backup-mail.cjs`

**Example Cron Job:**
```bash
30 2 * * * cd /home/ubuntu/CloudOps-Sentinel && /bin/bash scripts/backup-sqlite-db.sh
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express.js (CommonJS) |
| **Database** | SQLite (better-sqlite3) |
| **Process Manager** | PM2 |
| **Web Server** | Nginx |
| **Cloud Platform** | AWS EC2 |
| **OS** | Ubuntu Linux |
| **Containerization** | Docker, Docker Compose |
| **Security Scanning** | Trivy |
| **Email Service** | Nodemailer + Gmail App Password |
| **CI/CD** | GitHub Actions |
| **Automation** | Cron Jobs |
| **Version Control** | Git, GitHub |

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│          User Browser                   │
│     (Frontend Login Gate)                │
└────────────────┬────────────────────────┘
                 │ HTTP Request
                 ▼
    ┌────────────────────────────┐
    │  Nginx Reverse Proxy :80   │
    └─────────┬──────────┬───────┘
              │          │
    ┌─────────▼┐  ┌─────▼──────────────┐
    │ Frontend │  │   /api Route       │
    │ (React)  │  │                    │
    │  Static  │  │ Node.js Express    │
    │  Files   │  │   Backend          │
    └──────────┘  │ PM2 Managed        │
                  └────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐      ┌──────▼────┐     ┌──────▼─────┐
    │ SQLite │      │  Docker   │     │   Trivy    │
    │   DB   │      │    CLI    │     │   Cache    │
    └────────┘      └───────────┘     └────────────┘
        │                              
        ▼                              
   Cron Jobs → Email, Backups, Reports
```

## 🌐 Live Application

| Component | URL | Type |
|---|---|---|
| **Dashboard** | `http://3.110.173.200` | Frontend (Login Protected) |
| **Server Health** | `/api/server-health` | GET API |
| **Docker Status** | `/api/docker-containers` | GET API |
| **Trivy Summary** | `/api/trivy-summary` | GET API |
| **PDF Reports** | `/api/reports` | GET API |
| **Database Status** | `/api/database-status` | GET API |
| **Health Check** | `/api/health` | GET API |

> **Note:** Domain and SSL will be added later. Currently served via EC2 public IP.

## 🚀 Getting Started

### Prerequisites
- AWS EC2 instance (Ubuntu 22.04+)
- Node.js v18+ and npm
- Docker and Docker Compose installed
- Git
- GitHub account
- Gmail account (for email notifications)

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/ppiyushhhhh/sentinel-cloud-view.git
cd CloudOps-Sentinel
```

2. **Install Frontend Dependencies**
```bash
npm install
```

3. **Build Frontend**
```bash
npm run build
```

4. **Install Backend Dependencies**
```bash
cd backend
npm install
cd ..
```

5. **Setup Environment Variables**
```bash
# Create backend/.env file
cat > backend/.env << 'EOF'
# Backend Server
PORT=5000
FRONTEND_ORIGIN=http://3.110.173.200

# GitHub Actions
GITHUB_OWNER=ppiyushhhhh
GITHUB_REPO=sentinel-cloud-view
GITHUB_TOKEN=your_github_token_here

# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=receiver@gmail.com

# API Security
API_KEY=your_secure_api_key_here
EOF
```

6. **Initialize SQLite Database**
```bash
cd backend
node init-db.cjs
cd ..
```

7. **Deploy Frontend to Nginx**
```bash
sudo rm -rf /var/www/cloudops-sentinel/*
sudo cp -r dist/* /var/www/cloudops-sentinel/
sudo chown -R www-data:www-data /var/www/cloudops-sentinel
```

8. **Start Backend with PM2**
```bash
cd backend
pm2 start server.cjs --name cloudops-backend --update-env
pm2 save
cd ..
```

9. **Configure Nginx**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

10. **Setup Cron Jobs**
```bash
crontab -e

# Add these lines:
30 7 * * * cd /home/ubuntu/CloudOps-Sentinel && npm run trivy-scan >> /home/ubuntu/logs/trivy-cron.log 2>&1
0 8 * * * cd /home/ubuntu/CloudOps-Sentinel && npm run send-report >> /home/ubuntu/logs/report-cron.log 2>&1
30 2 * * * cd /home/ubuntu/CloudOps-Sentinel && /bin/bash scripts/backup-sqlite-db.sh >> /home/ubuntu/cloudops-db-backups/db-backup.log 2>&1
*/10 * * * * cd /home/ubuntu/CloudOps-Sentinel && npm run sync-pipeline >> /home/ubuntu/logs/pipeline-sync.log 2>&1
```

## 💾 Database Schema

CloudOps Sentinel uses SQLite for persistent storage at `backend/data/cloudops.db`.

### Tables

#### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### app_settings
```sql
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Example Settings:**
- `cpu_threshold` - CPU usage alert threshold (%)
- `memory_threshold` - Memory usage alert threshold (%)
- `disk_threshold` - Disk usage alert threshold (%)
- `alert_cooldown` - Alert cooldown period (seconds)
- `report_page_size` - Items per page for reports
- `pipeline_page_size` - Items per page for CI/CD

#### pipeline_runs
```sql
CREATE TABLE pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL UNIQUE,
  run_number INTEGER,
  status TEXT,
  conclusion TEXT,
  branch TEXT,
  commit_sha TEXT,
  commit_message TEXT,
  actor TEXT,
  created_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### report_history
```sql
CREATE TABLE report_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  report_type TEXT,
  file_size INTEGER,
  email_from TEXT,
  email_to TEXT,
  delivery_status TEXT,
  generated_at DATETIME,
  last_modified DATETIME,
  download_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### alert_history
```sql
CREATE TABLE alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  severity TEXT,
  title TEXT,
  message TEXT,
  source TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

#### incident_history
```sql
CREATE TABLE incident_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  severity TEXT,
  root_cause TEXT,
  resolution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### trivy_scan_history
```sql
CREATE TABLE trivy_scan_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_target TEXT,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  scan_timestamp DATETIME,
  results_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Database Persistence Benefits

- **Settings Survive Restarts:** Dashboard settings persisted across PM2/Nginx restarts
- **Operational History:** Maintain incident, alert, and deployment records
- **Trend Analysis:** Track vulnerability, performance, and deployment trends
- **Audit Trail:** Complete operational audit for compliance
- **No External Dependencies:** SQLite requires no separate database server

## 📚 API Documentation

### Server Health
```bash
curl http://3.110.173.200/api/server-health
```
**Response:**
```json
{
  "status": "online",
  "hostname": "ip-162-61-0-1",
  "publicIp": "8.510.193.700",
  "privateIp": "162.31.0.4",
  "cpuUsage": 25.5,
  "memoryUsage": 45.2,
  "diskUsage": 38.7,
  "totalMemory": 8589934592,
  "freeMemory": 4294967296,
  "uptime": 432000,
  "lastChecked": "2024-01-15T10:30:00Z"
}
```

### Docker Containers
```bash
curl http://3.110.173.200/api/docker-containers
```
**Response:**
```json
{
  "containers": [
    {
      "id": "abc123",
      "name": "cloudops-frontend",
      "image": "cloudops-frontend:latest",
      "status": "running",
      "ports": "80/tcp"
    }
  ]
}
```

### Trivy Summary
```bash
curl http://3.110.173.200/api/trivy-summary
```
**Response:**
```json
{
  "critical": 2,
  "high": 5,
  "medium": 12,
  "low": 18,
  "total": 37,
  "lastScan": "2024-01-15T07:30:00Z"
}
```

### Database Status
```bash
curl http://3.110.173.200/api/database-status
```

### Health Check
```bash
curl http://3.110.173.200/api/health
```

## ⚙️ Configuration

### Environment Variables

Create `backend/.env`:

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `FRONTEND_ORIGIN` | Frontend origin URL | `http://3.110.173.200` |
| `GITHUB_OWNER` | GitHub repo owner | `ppiyushhhhh` |
| `GITHUB_REPO` | GitHub repo name | `sentinel-cloud-view` |
| `GITHUB_TOKEN` | GitHub API token | `ghp_xxxxx` |
| `EMAIL_USER` | Gmail sender account | `your_email@gmail.com` |
| `EMAIL_PASS` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_TO` | Report recipient email | `recipient@gmail.com` |
| `API_KEY` | Internal API key | `your_secure_key` |

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name 3.110.173.200;

    root /var/www/cloudops-sentinel;
    index index.html;

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Gmail App Password Setup

1. Enable 2-Step Verification on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail" and "Windows Computer"
4. Use the 16-character password in `EMAIL_PASS`

### GitHub Token Setup

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (limited to selected repository), `actions:read`, `metadata:read`
4. Store token in `backend/.env` as `GITHUB_TOKEN`

## 🔐 Security

### Current Security Measures

✅ **Frontend Login Gate**
- Protects all dashboard routes
- Session-based authentication
- Automatic redirect to login

✅ **Backend API Protection**
- Served behind Nginx reverse proxy at `/api` route
- Backend port 5000 not exposed publicly
- Environment variables for sensitive credentials
- API key for automation routes

✅ **Environment Variable Security**
- `.env` excluded from Git
- Backend credentials not in source code
- GitHub token with limited permissions
- Email passwords as app-specific passwords

✅ **Database Security**
- SQLite data folder excluded from Git
- No sensitive data in logs
- Timestamped backups with compression
- Backup notification emails

✅ **Application Security**
- Trivy vulnerability scanning
- Incident tracking for security events
- Activity logging for audit trails

### Files to Exclude from Git

```gitignore
# Environment
.env
backend/.env

# Database
backend/data/
*.db
*.db-wal
*.db-shm

# Backups
/cloudops-db-backups/
*.db.gz

# Build & Dependencies
node_modules/
dist/

# Logs & Reports
*.log
backend/reports/
backend/logs/
```

### Recommended AWS Security Group Rules

| Port | Protocol | Purpose | Restriction |
|---|---|---|---|
| 22 | TCP | SSH | Your IP only |
| 80 | TCP | HTTP | 0.0.0.0/0 |
| 443 | TCP | HTTPS | 0.0.0.0/0 (after SSL) |

**Do NOT expose:**
- 5000 (Backend)
- 8080, 8081, 8082 (Optional services)
- 5173 (Vite dev server)

## 🚀 Deployment

### Production Deployment Checklist

```bash
# 1. Pull latest code
git fetch origin main
git reset --hard origin/main

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Build frontend
npm run build

# 4. Deploy frontend
sudo rm -rf /var/www/cloudops-sentinel/*
sudo cp -r dist/* /var/www/cloudops-sentinel/
sudo chown -R www-data:www-data /var/www/cloudops-sentinel

# 5. Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# 6. Restart backend
pm2 restart cloudops-backend --update-env

# 7. Verify health
curl http://localhost:5000/api/health
```

### Manual Deployment Script

```bash
#!/bin/bash
set -e

cd ~/CloudOps-Sentinel

echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "Installing dependencies..."
npm install
cd backend && npm install && cd ..

echo "Building frontend..."
npm run build

echo "Deploying frontend..."
sudo rm -rf /var/www/cloudops-sentinel/*
sudo cp -r dist/* /var/www/cloudops-sentinel/
sudo chown -R www-data:www-data /var/www/cloudops-sentinel

echo "Restarting backend..."
pm2 restart cloudops-backend --update-env

echo "Testing and restarting Nginx..."
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment complete!"
```

### PM2 Commands

```bash
# Start backend
pm2 start backend/server.cjs --name cloudops-backend --update-env

# Restart
pm2 restart cloudops-backend --update-env

# Stop
pm2 stop cloudops-backend

# Status
pm2 status

# Logs
pm2 logs cloudops-backend --lines 100

# Save configuration
pm2 save
```

## 💾 Backup & Restore

### Backup

The backup script runs daily via cron:

```bash
# Manual backup
cd ~/CloudOps-Sentinel
/bin/bash scripts/backup-sqlite-db.sh
```

Backups are stored as compressed files in:
```
/home/ubuntu/cloudops-db-backups/cloudops-YYYY-MM-DD-HHMMSS.db.gz
```

### Restore

```bash
# 1. Stop backend
pm2 stop cloudops-backend

# 2. Backup current broken database
cp backend/data/cloudops.db backend/data/cloudops.db.broken-$(date +%F-%H%M)

# 3. Restore backup
gunzip -c ~/cloudops-db-backups/cloudops-2024-01-15-073000.db.gz > backend/data/cloudops.db

# 4. Start backend
pm2 start cloudops-backend

# 5. Verify
curl http://localhost:5000/api/health
```

## 📊 Current Capabilities

✅ Login-protected dashboard UI  
✅ Real-time server health monitoring  
✅ Docker container visibility  
✅ GitHub Actions CI/CD tracking with history  
✅ Trivy security vulnerability monitoring  
✅ PDF infrastructure report generation and management  
✅ Activity logs and audit trail  
✅ Alert history with status tracking  
✅ Incident management workflow  
✅ Nginx log monitoring  
✅ Server cleanup utilities  
✅ SQLite persistence across restarts  
✅ Database status and analytics  
✅ Persistent settings page  
✅ Automated SQLite backup with compression  
✅ Backup email notifications  
✅ Cron-based scheduled automation  
✅ Email notification system  

## 🚦 Future Improvements

- [ ] Backend JWT authentication for `/api/*` endpoints
- [ ] Role-based access control (RBAC)
- [ ] User management interface
- [ ] Database-backed dashboard charts and trends
- [ ] Alert auto-resolution workflow
- [ ] Trivy vulnerability trend visualization
- [ ] PDF report delivery audit page
- [ ] CI/CD deployment analytics
- [ ] Email notification preferences UI
- [ ] Cloudflare WAF integration
- [ ] HTTPS domain setup with Certbot
- [ ] Centralized logging (ELK stack)
- [ ] Prometheus and Grafana integration
- [ ] Dockerized production deployment
- [ ] Automated restore workflow UI
- [ ] Slack/Telegram notification integration
- [ ] Multi-user dashboard support
- [ ] Custom alerting rules engine

## 📁 Project Structure

```
CloudOps-Sentinel/
├── src/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── ServerPage.tsx
│   │   ├── DockerPage.tsx
│   │   ├── PipelinePage.tsx
│   │   ├── TrivyPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── ActivityPage.tsx
│   │   ├── AlertsPage.tsx
│   │   ├── IncidentsPage.tsx
│   │   ├── NginxLogsPage.tsx
│   │   ├── CleanupPage.tsx
│   │   ├── DatabasePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── AppSidebar.tsx
│   │   └── ...
│   └── main.tsx
├── backend/
│   ├── server.cjs
│   ├── init-db.cjs
│   ├── send-db-backup-mail.cjs
│   ├── package.json
│   ├── .env
│   ├── data/
│   │   └── cloudops.db
│   ├── reports/
│   └── logs/
├── scripts/
│   ├── backup-sqlite-db.sh
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
├── dist/
├── package.json
├── vite.config.ts
├── .gitignore
└── README.md
```

## 🎯 Challenges Faced & Solutions

### Challenge: Frontend Mock Data
**Problem:** Frontend was displaying mock data instead of real API data  
**Solution:** Replaced mock imports with real API calls to backend endpoints

### Challenge: SQLite Persistence
**Problem:** Settings and incident data were lost after restarts  
**Solution:** Implemented SQLite database with proper schema and migrations

### Challenge: GitHub API Rate Limits
**Problem:** Unauthenticated GitHub API calls hitting rate limits  
**Solution:** Added GitHub token authentication with limited permissions

### Challenge: Database Backup Strategy
**Problem:** No backup mechanism for operational data  
**Solution:** Created automated backup script with cron scheduling and email notifications

### Challenge: Login Protection
**Problem:** Dashboard exposed to unauthorized access  
**Solution:** Implemented frontend login gate protecting all routes

### Challenge: Email Configuration
**Problem:** Password authentication failing  
**Solution:** Used Gmail App Passwords instead of regular account password

## 📝 Repository Hygiene

### Before Pushing

Check what's staged:
```bash
git status
git diff --cached --name-only
```

If `.env` or database files are staged by mistake:
```bash
git restore --staged backend/.env backend/data/
```

Commit only source changes:
```bash
git add src backend scripts .gitignore package*.json vite.config.ts
git commit -m "Meaningful commit message"
git push origin main
```

## 🏆 Project Purpose

CloudOps Sentinel was built to demonstrate hands-on DevOps and CloudOps capabilities in a real server environment. It combines:

- Application deployment and operations
- Server health monitoring and alerting
- CI/CD observability and tracking
- Security vulnerability scanning
- Incident management workflows
- Report automation and delivery
- Persistent operational storage
- Database backup and recovery

The project shows practical experience with:

- Linux server administration
- AWS EC2 cloud infrastructure
- Nginx reverse proxy configuration
- Node.js backend development
- React frontend development
- SQLite database design
- GitHub Actions CI/CD integration
- Trivy security scanning
- Email automation and notifications
- Cron-based scheduling
- PM2 process management
- DevOps troubleshooting workflows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions:
- Open a GitHub issue
- Contact the author
- Check existing documentation

## 👨‍💼 Author

**Piyush Prasad**  
Aspiring Cloud and DevOps Engineer

- 🌐 GitHub: [@ppiyushhhhh](https://github.com/ppiyushhhhh)
- 💼 LinkedIn: [linkedin.com/in/ppiyushhhh](https://www.linkedin.com/in/ppiyushhhh)
- 📧 Email: [piyushprasad8122@gmail.com]
