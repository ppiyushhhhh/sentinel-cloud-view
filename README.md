# CloudOps Sentinel

[![GitHub Stars](https://img.shields.io/badge/⭐-Stars-blue?style=flat-square)](https://github.com/ppiyushhhhh/sentinel-cloud-view)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)](#current-project-status)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-brightgreen?style=flat-square)](#tech-stack)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)](#tech-stack)

> **Production-Ready Cloud Monitoring, DevSecOps, CI/CD, Docker, and Automated Reporting System**

CloudOps Sentinel is a full-stack DevOps monitoring and automation project deployed on AWS EC2. It provides real-time monitoring of server health, Docker containers, security vulnerabilities via Trivy, automated PDF reporting, email alerting, and GitHub Actions CI/CD deployment.

🔗 **Live Demo:** [http://3.110.173.200](http://3.110.173.200)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Live Application](#live-application)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Security](#security)
- [Challenges & Solutions](#challenges--solutions)
- [Project Status](#current-project-status)
- [Future Improvements](#future-improvements)
- [Author](#author)

## 📖 Overview

CloudOps Sentinel demonstrates practical hands-on implementation of:
- ☁️ Cloud infrastructure monitoring
- 🔐 Security scanning and DevSecOps
- 🐳 Docker container management
- 📊 Automated PDF reporting
- 📧 Email alerting system
- 🚀 GitHub Actions CI/CD pipeline
- 🔄 Nginx reverse proxy setup
- ⚙️ Cron job automation

## ✨ Features

### 1. 🖥️ Live Server Health Monitoring
Real-time EC2 instance metrics including:
- Server status and hostname
- Public/Private IP addresses
- CPU, Memory, Disk usage
- Server uptime and Nginx status
- Last checked timestamp

**Endpoint:** `GET /api/server-health`

### 2. 🐳 Docker Container Monitoring
Live Docker container tracking:
- Container names and images
- Container status (running/stopped)
- Exposed ports
- Real-time updates

**Endpoint:** `GET /api/docker-containers`

### 3. 🔍 Trivy Security Scanning
Vulnerability scanning for Docker images:
- Critical, High, Medium, Low severity levels
- Total vulnerability count
- Cached results for performance
- Scanned images: frontend and backend

**Endpoint:** `GET /api/trivy-summary`

### 4. 📄 Professional PDF Reports
Comprehensive infrastructure reports including:
- Executive summary
- Overall health score
- Resource utilization metrics
- Container status overview
- Vulnerability summary
- Operational recommendations
- Report timestamp

**Endpoints:** `GET /api/generate-report` | `GET /api/reports`

### 5. 📧 Automated Email Alerts
Smart alerting system with configurable thresholds:

| Alert Type | Threshold |
|---|---|
| Disk Usage | ≥ 60% |
| Memory Usage | ≥ 80% |
| CPU Usage | ≥ 80% |
| Backend API | Down/Unavailable |
| Frontend Site | Down/Unavailable |
| Docker Containers | Stopped Detected |

**Endpoints:** `GET /api/send-alert` | `GET /api/alerts-history`

### 6. 🚀 CI/CD Pipeline
Automated deployment via GitHub Actions:
1. Push to main branch
2. GitHub Actions starts
3. SSH into EC2
4. Pull latest code
5. Install dependencies & build frontend
6. Copy build to Nginx root
7. Restart backend via PM2
8. Restart Nginx

**Workflow:** `.github/workflows/deploy.yml`

### 7. 📊 Automated Daily Reports
Scheduled email reports:
- 7:00 AM daily
- 7:00 PM daily
- PDF attachment included
- Cron-based automation

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Process Manager** | PM2 |
| **Web Server** | Nginx |
| **Cloud Platform** | AWS EC2 |
| **OS** | Ubuntu Linux |
| **Containerization** | Docker, Docker Compose |
| **Security Scanning** | Trivy |
| **Reporting** | PDFKit |
| **Email Service** | Nodemailer + Gmail App Password |
| **Automation** | Cron Jobs |
| **CI/CD** | GitHub Actions |
| **Version Control** | Git, GitHub |

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       User Browser                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         ▼
        ┌────────────────────────────────┐
        │   Nginx Reverse Proxy :80      │
        └─────────┬──────────┬──────────┘
                  │          │
        ┌─────────▼┐  ┌─────▼──────────────┐
        │ Frontend │  │   /api Route       │
        │  Static  │  │                    │
        │  Files   │  │  Node.js Express   │
        └──────────┘  │     Backend        │
                      │   PM2 Managed      │
                      └────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼────┐  ┌──────▼────┐  ┌────▼─────┐
        │  Server    │  │  Docker   │  │  Trivy   │
        │  Metrics   │  │    CLI    │  │  Cache   │
        └────────────┘  └───────────┘  └──────────┘
```

## 🌐 Live Application

| Service | URL | Type |
|---|---|---|
| CloudOps Dashboard | `http://3.110.173.200` | Frontend |
| Server Health API | `/api/server-health` | GET |
| Docker Containers API | `/api/docker-containers` | GET |
| Trivy Summary API | `/api/trivy-summary` | GET |
| PDF Reports API | `/api/reports` | GET |
| Alerts History API | `/api/alerts-history` | GET |

> **Note:** Domain and SSL will be added later. Currently served via EC2 public IP.

## 🚀 Getting Started

### Prerequisites
- AWS EC2 instance (Ubuntu 22.04+)
- Docker and Docker Compose installed
- Node.js v18+ and npm
- Git
- GitHub account

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/ppiyushhhhh/sentinel-cloud-view.git
cd CloudOps-Sentinel
```

2. **Install Frontend Dependencies**
```bash
npm install
npm run build
```

3. **Install Backend Dependencies**
```bash
cd backend
npm install
```

4. **Setup Environment Variables**
```bash
# Create .env file in backend directory
cat > backend/.env << EOF
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=receiver@gmail.com
EOF
```

5. **Start Backend with PM2**
```bash
cd backend
pm2 start server.js --name cloudops-backend --update-env
pm2 save
```

6. **Configure Nginx**
```bash
# Copy Nginx config and restart
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup Cron Jobs**
```bash
crontab -e

# Add these lines:
30 7 * * * /home/ubuntu/CloudOps-Sentinel/backend/run-trivy-scan.sh >> /home/ubuntu/CloudOps-Sentinel/backend/trivy-cache/trivy-cron.log 2>&1
0 7 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1
0 19 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1
*/5 * * * * /home/ubuntu/CloudOps-Sentinel/backend/alert-check.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/alert-cron.log 2>&1
```

## 📚 API Documentation

### Server Health
```bash
curl http://3.110.173.200/api/server-health
```
**Response:**
```json
{
  "status": "online",
  "hostname": "ip-172-31-0-1",
  "publicIp": "3.110.173.200",
  "privateIp": "172.31.0.1",
  "cpuUsage": 25.5,
  "memoryUsage": 45.2,
  "diskUsage": 38.7,
  "uptime": 432000,
  "nginxStatus": "running",
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
      "name": "cloudops-frontend",
      "image": "cloudops-sentinel-cloudops-frontend:latest",
      "status": "running",
      "ports": "80"
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

### Generate Report
```bash
curl http://3.110.173.200/api/generate-report
```

### List Reports
```bash
curl http://3.110.173.200/api/reports
```

## ⚙️ Configuration

### Environment Variables
Create `backend/.env`:
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=receiver@gmail.com
```

> **Important:** `EMAIL_PASS` must be a Gmail App Password, not your regular Gmail password.

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name 3.110.173.200;

    root /var/www/cloudops-sentinel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

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

### GitHub Actions Secrets
Configure these secrets in your GitHub repository:

| Secret | Example Value |
|---|---|
| `EC2_HOST` | `3.110.173.200` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | `your_private_ssh_key` |
| `EC2_PROJECT_PATH` | `/home/ubuntu/CloudOps-Sentinel` |

## 🔐 Security

### Current Security Measures
- ✅ Backend behind Nginx reverse proxy at `/api` route
- ✅ Backend port 5000 not exposed publicly
- ✅ Production frontend build served via Nginx
- ✅ PM2 keeps backend process alive
- ✅ Trivy scans Docker images for vulnerabilities
- ✅ Email alerts on infrastructure risks
- ✅ Cron-based automated monitoring

### Recommended AWS Security Group Rules
```
Inbound Rules:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS) - after SSL setup

Do NOT expose publicly:
- 5000 (Backend)
- 8080, 8081, 8082 (Optional services)
- 5173 (Vite dev server)
- 9090 (Other services)
```

## 🎯 Challenges & Solutions

### Challenge 1: Frontend Showing Dummy Data
**Problem:** Mock data instead of real API calls  
**Solution:** Replaced mock imports with real API endpoints

### Challenge 2: Backend Port 5000 Not Working
**Problem:** JavaScript syntax/runtime errors  
**Solution:** Fixed code errors via PM2 logs and restarted process

### Challenge 3: Docker Permission Issues
**Problem:** Backend couldn't access Docker socket  
**Solution:**
```bash
sudo usermod -aG docker ubuntu
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock
```

### Challenge 4: Trivy Scan Slowing Down API
**Problem:** Running Trivy in API requests caused delays  
**Solution:** Cached Trivy results in JSON files, API reads from cache

### Challenge 5: PDF Report Formatting
**Problem:** Poor alignment and layout  
**Solution:** Improved with proper headers, cards, tables, and footers

### Challenge 6: GitHub Push Permission Issues
**Problem:** Deploy key read-only, couldn't push changes  
**Solution:** Changed remote to SSH and used deploy key with write access

## 📁 Project Structure

```
CloudOps-Sentinel/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── reports/
│   ├── trivy-cache/
│   ├── alert-check.sh
│   ├── daily-email-report.sh
│   └── run-trivy-scan.sh
├── src/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── ServerHealthPage.tsx
│   │   ├── DockerPage.tsx
│   │   ├── TrivyPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── AlertsPage.tsx
│   │   ├── PipelinePage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/
│   │   ├── TopBar.tsx
│   │   └── AppSidebar.tsx
│   └── main.tsx
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.ts
└── README.md
```

## 📊 Current Project Status

| Component | Status |
|---|---|
| Frontend Dashboard | ✅ Completed |
| Backend API | ✅ Completed |
| Server Health Monitoring | ✅ Completed |
| Docker Monitoring | ✅ Completed |
| Trivy Security Scanning | ✅ Completed |
| PDF Report Generation | ✅ Completed |
| Email Report Sending | ✅ Completed |
| Alert Email System | ✅ Completed |
| Alert History Page | ✅ Completed |
| Nginx Reverse Proxy | ✅ Completed |
| GitHub Actions CI/CD | ✅ Configured |
| Custom Domain | ⏳ Planned |
| SSL Certificate | ⏳ Planned |
| GitHub Actions Trivy Gate | ⏳ Planned |

## 🚦 Future Improvements

- [ ] Add custom domain name
- [ ] Setup SSL certificate with Certbot
- [ ] Implement GitHub Actions Trivy security gate
- [ ] Display real GitHub Actions workflow status
- [ ] Add authentication/authorization layer
- [ ] Integrate Grafana for historical charts
- [ ] Store report metadata in database
- [ ] Add Slack/Telegram alerts
- [ ] CloudWatch integration
- [ ] AWS EventBridge and SNS for EC2 state alerts

## 📝 Manual Deployment

If not using GitHub Actions CI/CD:

```bash
cd ~/CloudOps-Sentinel

# Update code
git fetch origin main
git reset --hard origin/main

# Build frontend
npm install
npm run build

# Deploy frontend
sudo rm -rf /var/www/cloudops-sentinel/*
sudo cp -r dist/* /var/www/cloudops-sentinel/
sudo chown -R www-data:www-data /var/www/cloudops-sentinel

# Deploy backend
cd backend
npm install
pm2 restart cloudops-backend --update-env || pm2 start server.js --name cloudops-backend --update-env
pm2 save

# Restart web server
sudo nginx -t
sudo systemctl restart nginx
```

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

For issues, questions, or suggestions, please open a GitHub issue or contact the author.

## 👨‍💼 Author

**Piyush Prasad**  
Aspiring Cloud and DevOps Engineer

- 🌐 GitHub: [@ppiyushhhhh](https://github.com/ppiyushhhhh)
- 📧 Email: [piyushprasad8122@gmail.com]
- 💼 LinkedIn: [www.linkedin.com/in/ppiyushhhh]

