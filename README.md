# CloudOps Sentinel

## Production-Ready Cloud Monitoring, DevSecOps, CI/CD, Docker, and Automated Reporting System

CloudOps Sentinel is a full-stack DevOps monitoring and automation project deployed on an AWS EC2 instance. The project is designed to monitor real server health, Docker containers, Trivy security scan results, automated PDF infrastructure reports, email alerts, and CI/CD deployment status from a single dashboard.

This project demonstrates practical hands-on implementation of cloud infrastructure monitoring, backend API development, Docker-based deployment, security scanning, Nginx reverse proxy configuration, automated reporting, alerting, and GitHub Actions CI/CD on a Linux server.

---

## Project Objective

The main objective of this project is to build a real-world DevOps monitoring dashboard that can:

- Monitor live EC2 server health
- Track CPU, memory, disk usage, uptime, and IP details
- Display Docker container status
- Scan Docker images using Trivy
- Generate professional PDF infrastructure reports
- Send reports automatically through email
- Trigger email alerts when server conditions cross defined thresholds
- Deploy changes automatically using GitHub Actions CI/CD
- Serve the frontend through Nginx reverse proxy
- Keep backend APIs secured behind the `/api` route

---

## Live Application

| Service | URL |
|---|---|
| CloudOps Sentinel Dashboard | `http://3.110.173.200` |
| Server Health API | `http://3.110.173.200/api/server-health` |
| Docker Containers API | `http://3.110.173.200/api/docker-containers` |
| Trivy Summary API | `http://3.110.173.200/api/trivy-summary` |
| PDF Reports API | `http://3.110.173.200/api/reports` |
| Alerts History API | `http://3.110.173.200/api/alerts-history` |

> Domain and SSL will be added later. Currently, the application is served through the EC2 public IP using Nginx.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Process Manager | PM2 |
| Web Server | Nginx |
| Cloud Platform | AWS EC2 |
| Operating System | Ubuntu Linux |
| Containerization | Docker, Docker Compose |
| Security Scanning | Trivy |
| Reporting | PDFKit |
| Email Service | Nodemailer with Gmail App Password |
| Automation | Cron Jobs |
| CI/CD | GitHub Actions |
| Version Control | Git, GitHub |

---

## System Architecture

```text
User Browser
    |
    | HTTP Request
    v
Nginx Reverse Proxy :80
    |
    |----------------------------|
    |                            |
Frontend Static Files        /api Route
/var/www/cloudops-sentinel       |
                                 v
                         Node.js Express Backend
                         PM2 Managed Process
                                 |
        ------------------------------------------------
        |               |              |               |
 Server Metrics     Docker CLI      Trivy Cache     PDF Reports
 CPU/RAM/Disk       Containers      JSON Results    Generated PDFs
        |
        v
 Email Alerts and Daily PDF Reports
Key Features
1. Live Server Health Monitoring

The dashboard fetches real-time EC2 server data from the backend API.

Monitored details include:

Server status
Hostname
Public IP
Private IP
CPU usage
Memory usage
Disk usage
Total memory
Free memory
Server uptime
Nginx status
Last checked time

API endpoint:

/api/server-health
2. Docker Container Monitoring

CloudOps Sentinel displays live Docker container data from the EC2 server.

Displayed container details include:

Container name
Docker image
Container status
Exposed ports

API endpoint:

/api/docker-containers

Docker command used internally:

docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'

A timeout is added in the backend to prevent the API from hanging if Docker becomes unavailable.

3. Trivy Security Scanning

Trivy is used to scan Docker images for vulnerabilities.

The system tracks vulnerabilities by severity:

Critical
High
Medium
Low
Total vulnerabilities

Scanned images:

cloudops-sentinel-cloudops-frontend:latest
cloudops-sentinel-cloudops-backend:latest

API endpoint:

/api/trivy-summary

To avoid slow API responses, Trivy scan results are cached in JSON files:

backend/trivy-cache/frontend-trivy.json
backend/trivy-cache/backend-trivy.json
backend/trivy-cache/last-scan.txt
4. Professional PDF Infrastructure Reports

The backend generates PDF reports using PDFKit.

The report includes:

Executive summary
Overall health score
CPU usage
Memory usage
Disk usage
Server details
Docker container status
Trivy vulnerability summary
Operational recommendations
Report generation timestamp

API endpoint to generate report:

/api/generate-report

API endpoint to list generated reports:

/api/reports

Generated reports are stored in:

backend/reports/
5. Automated Email Reports

The system sends infrastructure PDF reports through email using Nodemailer and Gmail App Password.

Report email API:

/api/generate-and-email-report

Daily report automation is configured using cron.

Current schedule:

7:00 AM daily
7:00 PM daily

Cron entries:

0 7 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1
0 19 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1
6. Automated Email Alerts

CloudOps Sentinel sends alert emails when important thresholds are crossed.

Current alert conditions:

Alert Type	Threshold / Condition
Disk Usage	60% or higher
Memory Usage	80% or higher
CPU Usage	80% or higher
Backend API	Down or unavailable
Frontend Site	Down or unavailable
Docker Containers	Stopped containers detected

Alert API:

/api/send-alert

Alert history API:

/api/alerts-history

Alert check cron job:

*/5 * * * * /home/ubuntu/CloudOps-Sentinel/backend/alert-check.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/alert-cron.log 2>&1
7. EC2 Stopped Instance Alert

For stopped EC2 instance alerts, the project uses AWS-level monitoring because an EC2 instance cannot send email after it is stopped.

Recommended AWS services:

Amazon EventBridge
Amazon SNS

Flow:

EC2 State Change → EventBridge Rule → SNS Topic → Email Notification

This ensures an email is sent when the EC2 instance enters states such as:

stopping
stopped
shutting-down
terminated
8. CI/CD Pipeline with GitHub Actions

GitHub Actions is configured to deploy the application automatically when changes are pushed to the main branch.

CI/CD workflow:

Push to main branch
        |
        v
GitHub Actions starts
        |
        v
SSH into AWS EC2
        |
        v
Pull latest code
        |
        v
Install dependencies
        |
        v
Build frontend
        |
        v
Copy frontend build to Nginx web root
        |
        v
Install backend dependencies
        |
        v
Restart backend using PM2
        |
        v
Test and restart Nginx

Workflow file:

.github/workflows/deploy.yml

Deployment target:

/home/ubuntu/CloudOps-Sentinel

Nginx web root:

/var/www/cloudops-sentinel

Backend process:

cloudops-backend
GitHub Actions Secrets

The following GitHub repository secrets are used:

Secret Name	Purpose
EC2_HOST	EC2 public IP
EC2_USER	SSH user, usually ubuntu
EC2_SSH_KEY	Private SSH key used by GitHub Actions
EC2_PROJECT_PATH	Project path on EC2

Example:

EC2_HOST=3.110.173.200
EC2_USER=ubuntu
EC2_PROJECT_PATH=/home/ubuntu/CloudOps-Sentinel
Nginx Reverse Proxy Setup

Nginx serves the React frontend and proxies API requests to the backend.

Frontend:

http://3.110.173.200

Backend through reverse proxy:

http://3.110.173.200/api

Nginx configuration:

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
PM2 Backend Management

The backend is managed using PM2.

Start backend:

cd ~/CloudOps-Sentinel/backend
pm2 start server.js --name cloudops-backend --update-env
pm2 save

Restart backend:

pm2 restart cloudops-backend --update-env

Check status:

pm2 status

View logs:

pm2 logs cloudops-backend
Cron Jobs

Current automation jobs:

crontab -l

Expected cron jobs:

30 7 * * * /home/ubuntu/CloudOps-Sentinel/backend/run-trivy-scan.sh >> /home/ubuntu/CloudOps-Sentinel/backend/trivy-cache/trivy-cron.log 2>&1

0 7 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1

0 19 * * * /home/ubuntu/CloudOps-Sentinel/backend/daily-email-report.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/email-cron.log 2>&1

*/5 * * * * /home/ubuntu/CloudOps-Sentinel/backend/alert-check.sh >> /home/ubuntu/CloudOps-Sentinel/backend/reports/alert-cron.log 2>&1
Environment Variables

The backend uses a .env file for email configuration.

File location:

backend/.env

Example:

EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=receiver@gmail.com

Important:

EMAIL_PASS must be a Gmail App Password, not the normal Gmail password.
Project Folder Structure
CloudOps-Sentinel/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── reports/
│   ├── trivy-cache/
│   ├── alert-check.sh
│   ├── daily-email-report.sh
│   └── run-trivy-scan.sh
│
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
│   │
│   ├── components/
│   │   ├── TopBar.tsx
│   │   └── AppSidebar.tsx
│   │
│   └── main.tsx
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.ts
└── README.md
API Endpoints
Method	Endpoint	Description
GET	/api/server-health	Returns live EC2 server metrics
GET	/api/docker-containers	Returns Docker container list
GET	/api/trivy-summary	Returns cached Trivy vulnerability summary
GET	/api/generate-report	Generates a PDF report
GET	/api/generate-and-email-report	Generates and emails PDF report
GET	/api/reports	Lists generated PDF reports
GET	/api/reports/:fileName	Downloads a PDF report
GET	/api/send-alert	Sends alert email
GET	/api/alerts-history	Returns alert log history
Manual Deployment Commands

If CI/CD is not used, the project can be manually deployed using:

cd ~/CloudOps-Sentinel

git fetch origin main
git reset --hard origin/main

npm install
npm run build

sudo rm -rf /var/www/cloudops-sentinel/*
sudo cp -r dist/* /var/www/cloudops-sentinel/
sudo chown -R www-data:www-data /var/www/cloudops-sentinel

cd backend
npm install

pm2 restart cloudops-backend --update-env || pm2 start server.js --name cloudops-backend --update-env
pm2 save

sudo nginx -t
sudo systemctl restart nginx
Security Hardening

Current security improvements:

Backend is served behind Nginx /api reverse proxy
Public users do not need direct access to backend port 5000
Nginx serves production frontend build
PM2 keeps backend process alive
Trivy scans Docker images for vulnerabilities
Email alerts notify about infrastructure risks
PDF reports provide operational visibility
Cron automates scheduled monitoring tasks

Recommended AWS Security Group inbound rules:

Port	Purpose
22	SSH
80	HTTP website
443	HTTPS after domain SSL setup

Ports to avoid exposing publicly after Nginx setup:

5000, 8080, 8081, 8082, 5173, 9090
Challenges Faced and Solutions
1. Frontend Showing Dummy Data

Problem:

The frontend pages were importing mock data from:

@/data/mock

Solution:

Replaced mock imports with real API calls using:

/api/server-health
/api/docker-containers
/api/trivy-summary
/api/reports
/api/alerts-history
2. Backend Port 5000 Not Working

Problem:

Backend was not listening on port 5000 due to JavaScript syntax/runtime errors.

Solution:

Checked PM2 logs:

pm2 logs cloudops-backend

Fixed backend code and restarted PM2:

pm2 restart cloudops-backend --update-env
3. Docker Permission Issue

Problem:

Backend could not access Docker socket.

Solution:

Added the ubuntu user to Docker group and fixed Docker socket permissions.

sudo usermod -aG docker ubuntu
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock
4. Trivy Scan Slowing Down API

Problem:

Running Trivy directly inside API requests caused slow responses.

Solution:

Created cached Trivy scans stored in JSON files and read those cached results from the backend API.

5. PDF Report Alignment Issues

Problem:

The initial PDF report was plain and poorly aligned.

Solution:

Improved PDF layout with:

Header section
Summary cards
Tables
Risk status
Recommendations
Footer
6. CI/CD GitHub Pull Issue on EC2

Problem:

EC2 repository used HTTPS remote, causing GitHub username/password prompt.

Solution:

Changed remote to SSH:

git remote set-url origin git@github.com:ppiyushhhhh/sentinel-cloud-view.git

Added SSH deploy key to GitHub.

7. GitHub Push Permission Issue

Problem:

EC2 deploy key was read-only and could not push changes.

Solution:

Either push from local laptop or add a deploy key with write access.

Current Project Status
Component	Status
Frontend Dashboard	Completed
Backend API	Completed
Server Health Monitoring	Completed
Docker Monitoring	Completed
Trivy Security Summary	Completed
PDF Report Generation	Completed
Email Report Sending	Completed
Alert Email System	Completed
Alert History Page	Completed
Nginx Reverse Proxy	Completed
GitHub Actions CI/CD	Configured
Domain	Planned
SSL Certificate	Planned after domain setup
GitHub Actions Trivy Gate	Planned upgrade
Future Improvements

Planned enhancements:

Add domain name
Add SSL certificate using Certbot
Add GitHub Actions Trivy security gate
Show real GitHub Actions workflow status on Pipeline page
Add authentication to dashboard
Add Grafana integration
Add historical metric charts
Store report metadata in database
Add Slack or Telegram alerts
Add CloudWatch integration
Add AWS EventBridge and SNS for EC2 stopped-state alerts
Resume Highlight

CloudOps Sentinel is a production-ready DevOps monitoring and automation project deployed on AWS EC2. It includes a React dashboard, Node.js backend APIs, Docker monitoring, Trivy security scanning, automated PDF infrastructure reports, email alerting, Nginx reverse proxy, PM2 process management, cron automation, and GitHub Actions CI/CD deployment.

Author

Piyush Prasad
Aspiring Cloud and DevOps Engineer
