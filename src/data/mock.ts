// Mock data layer — replace with real API calls later
// Suggested endpoints:
// GET /api/health, GET /api/docker, GET /api/deployments, GET /api/trivy, GET /api/reports, GET /api/alerts, POST /api/settings

export const serverStatus = {
  status: "online" as "online" | "offline",
  publicIp: "54.221.134.77",
  uptime: "14d 7h 32m",
  uptimeSeconds: 1234920,
  cpu: 42,
  ram: 67,
  disk: 58,
  os: "Ubuntu 22.04 LTS",
  instanceType: "t3.medium",
  region: "us-east-1",
  storageTotal: "80 GB",
  storageUsed: "46.4 GB",
  dockerContainers: 7,
  lastDeployment: { status: "success" as const, time: "2026-05-05T08:30:00Z" },
  lastTrivyScan: { status: "pass" as const, time: "2026-05-05T08:28:00Z" },
  healthScore: 94,
};

export const cpuHistory = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  value: Math.floor(25 + Math.random() * 40),
}));

export const ramHistory = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  value: Math.floor(50 + Math.random() * 30),
}));

export const diskHistory = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  value: Math.floor(45 + Math.random() * 20),
}));

export const networkHistory = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  inbound: Math.floor(10 + Math.random() * 50),
  outbound: Math.floor(5 + Math.random() * 30),
}));

export interface DockerContainer {
  name: string;
  image: string;
  status: "running" | "stopped" | "restarting";
  cpu: number;
  memory: number;
  restartCount: number;
  lastStarted: string;
}

export const dockerContainers: DockerContainer[] = [
  { name: "frontend", image: "cloudops/frontend:latest", status: "running", cpu: 2.3, memory: 128, restartCount: 0, lastStarted: "2026-05-05T08:30:00Z" },
  { name: "backend", image: "cloudops/backend:latest", status: "running", cpu: 8.1, memory: 256, restartCount: 0, lastStarted: "2026-05-05T08:30:00Z" },
  { name: "nginx", image: "nginx:1.25-alpine", status: "running", cpu: 0.5, memory: 32, restartCount: 0, lastStarted: "2026-05-05T08:30:00Z" },
  { name: "prometheus", image: "prom/prometheus:v2.51.0", status: "running", cpu: 3.2, memory: 384, restartCount: 1, lastStarted: "2026-05-04T12:00:00Z" },
  { name: "grafana", image: "grafana/grafana:10.4.0", status: "running", cpu: 1.8, memory: 192, restartCount: 0, lastStarted: "2026-05-05T08:30:00Z" },
  { name: "node-exporter", image: "prom/node-exporter:v1.7.0", status: "running", cpu: 0.3, memory: 24, restartCount: 0, lastStarted: "2026-05-05T08:30:00Z" },
  { name: "report-service", image: "cloudops/report-svc:latest", status: "running", cpu: 1.1, memory: 96, restartCount: 2, lastStarted: "2026-05-05T06:00:00Z" },
];

export interface PipelineStep {
  id: number;
  name: string;
  status: "success" | "failed" | "running" | "pending";
  duration: string;
  time: string;
}

export const pipelineSteps: PipelineStep[] = [
  { id: 1, name: "Code Pushed", status: "success", duration: "—", time: "08:25:00" },
  { id: 2, name: "Trivy Scan Started", status: "success", duration: "1m 42s", time: "08:25:10" },
  { id: 3, name: "Docker Image Built", status: "success", duration: "3m 15s", time: "08:26:52" },
  { id: 4, name: "Image Deployed to EC2", status: "success", duration: "45s", time: "08:30:07" },
  { id: 5, name: "Containers Restarted", status: "success", duration: "12s", time: "08:30:52" },
  { id: 6, name: "Deployment Successful", status: "success", duration: "—", time: "08:31:04" },
];

export const pipelineHistory = [
  { id: 1, commit: "feat: add monitoring endpoint", status: "success" as const, time: "2026-05-05T08:25:00Z", duration: "5m 49s" },
  { id: 2, commit: "fix: docker compose volumes", status: "success" as const, time: "2026-05-04T14:10:00Z", duration: "6m 02s" },
  { id: 3, commit: "chore: update nginx config", status: "failed" as const, time: "2026-05-03T09:45:00Z", duration: "4m 11s" },
  { id: 4, commit: "feat: PDF report generation", status: "success" as const, time: "2026-05-02T16:30:00Z", duration: "5m 33s" },
];

export interface Vulnerability {
  pkg: string;
  vulnId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  installed: string;
  fixed: string;
  status: "Fixed" | "Affected" | "Will Not Fix";
}

export const trivySummary = { critical: 0, high: 2, medium: 5, low: 12, unknown: 1 };

export const vulnerabilities: Vulnerability[] = [
  { pkg: "libssl3", vulnId: "CVE-2024-5535", severity: "HIGH", installed: "3.0.13", fixed: "3.0.14", status: "Fixed" },
  { pkg: "libcrypto3", vulnId: "CVE-2024-4741", severity: "HIGH", installed: "3.0.13", fixed: "3.0.14", status: "Fixed" },
  { pkg: "curl", vulnId: "CVE-2024-2398", severity: "MEDIUM", installed: "8.5.0", fixed: "8.7.1", status: "Affected" },
  { pkg: "zlib", vulnId: "CVE-2023-45853", severity: "MEDIUM", installed: "1.3", fixed: "1.3.1", status: "Fixed" },
  { pkg: "busybox", vulnId: "CVE-2023-42366", severity: "MEDIUM", installed: "1.36.1", fixed: "—", status: "Will Not Fix" },
  { pkg: "nghttp2", vulnId: "CVE-2024-28182", severity: "MEDIUM", installed: "1.58.0", fixed: "1.61.0", status: "Affected" },
  { pkg: "expat", vulnId: "CVE-2024-45490", severity: "MEDIUM", installed: "2.5.0", fixed: "2.6.3", status: "Affected" },
  { pkg: "libtasn1", vulnId: "CVE-2024-12133", severity: "LOW", installed: "4.19.0", fixed: "4.20.0", status: "Fixed" },
];

export interface Report {
  id: number;
  date: string;
  healthScore: number;
  diskUsage: number;
  trivyResult: "pass" | "fail";
  deploymentStatus: "success" | "failed";
  emailSent: boolean;
}

export const reports: Report[] = [
  { id: 1, date: "2026-05-05", healthScore: 94, diskUsage: 58, trivyResult: "pass", deploymentStatus: "success", emailSent: true },
  { id: 2, date: "2026-05-04", healthScore: 91, diskUsage: 56, trivyResult: "pass", deploymentStatus: "success", emailSent: true },
  { id: 3, date: "2026-05-03", healthScore: 78, diskUsage: 62, trivyResult: "fail", deploymentStatus: "failed", emailSent: true },
  { id: 4, date: "2026-05-02", healthScore: 89, diskUsage: 54, trivyResult: "pass", deploymentStatus: "success", emailSent: true },
  { id: 5, date: "2026-05-01", healthScore: 92, diskUsage: 52, trivyResult: "pass", deploymentStatus: "success", emailSent: false },
];

export interface Alert {
  id: number;
  time: string;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  emailSent: boolean;
}

export const alertRules = [
  { name: "EC2 Down", condition: "Server unreachable for > 30s", enabled: true },
  { name: "Disk Usage > 60%", condition: "Disk usage exceeds 60%", enabled: true },
  { name: "CPU > 80%", condition: "CPU usage exceeds 80% for 5 min", enabled: true },
  { name: "RAM > 80%", condition: "RAM usage exceeds 80% for 5 min", enabled: true },
  { name: "Docker Container Stopped", condition: "Any container exits unexpectedly", enabled: true },
  { name: "Trivy HIGH/CRITICAL", condition: "HIGH or CRITICAL vulnerability found", enabled: true },
];

export const alertHistory: Alert[] = [
  { id: 1, time: "2026-05-05T07:15:00Z", type: "Disk Usage", severity: "warning", message: "Disk usage reached 62% on /dev/xvda1", emailSent: true },
  { id: 2, time: "2026-05-03T09:48:00Z", type: "Deployment Failed", severity: "critical", message: "Docker build failed: nginx config syntax error", emailSent: true },
  { id: 3, time: "2026-05-03T09:45:00Z", type: "Trivy Scan", severity: "warning", message: "2 HIGH vulnerabilities detected in libssl3", emailSent: true },
  { id: 4, time: "2026-05-01T22:10:00Z", type: "Container Restart", severity: "info", message: "report-service restarted (exit code 137)", emailSent: false },
  { id: 5, time: "2026-04-29T03:00:00Z", type: "CPU Spike", severity: "warning", message: "CPU usage at 87% for 8 minutes", emailSent: true },
];

export const settings = {
  serverIp: "54.221.134.77",
  emailRecipient: "devops@company.com",
  diskThreshold: 60,
  cpuThreshold: 80,
  ramThreshold: 80,
  dailyReportTime: "06:00",
  alertsEnabled: true,
};
