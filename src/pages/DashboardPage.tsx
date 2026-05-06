import { useEffect, useState } from "react";

type ServerHealth = {
  status: string;
  hostname: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  publicIp: string;
  privateIp: string;
  nginxStatus: string;
  checkedAt: string;
};

type DockerContainer = {
  name: string;
  image: string;
  status: string;
  ports: string;
};

type TrivySummary = {
  frontend: { low: number; medium: number; high: number; critical: number; total: number };
  backend: { low: number; medium: number; high: number; critical: number; total: number };
  scannedAt: string;
};

const DashboardPage = () => {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [trivy, setTrivy] = useState<TrivySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/server-health").then((res) => res.json()),
      fetch("/api/docker-containers").then((res) => res.json()),
      fetch("/api/trivy-summary").then((res) => res.json())
    ])
      .then(([healthData, dockerData, trivyData]) => {
        setHealth(healthData);
        setContainers(dockerData);
        setTrivy(trivyData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Dashboard API error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading live dashboard data...</div>;
  }

  const totalHigh = (trivy?.frontend.high || 0) + (trivy?.backend.high || 0);
  const totalCritical = (trivy?.frontend.critical || 0) + (trivy?.backend.critical || 0);

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Live CloudOps Sentinel overview from your EC2 server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card title="Server Status" value={health?.status || "N/A"} />
        <Card title="CPU Usage" value={`${health?.cpuUsage ?? 0}%`} />
        <Card title="Memory Usage" value={`${health?.memoryUsage ?? 0}%`} />
        <Card title="Disk Usage" value={`${health?.diskUsage ?? 0}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Docker Containers" value={String(containers.length)} />
        <Card title="High Vulnerabilities" value={String(totalHigh)} />
        <Card title="Critical Vulnerabilities" value={String(totalCritical)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Server Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Info label="Hostname" value={health?.hostname} />
          <Info label="Public IP" value={health?.publicIp} />
          <Info label="Private IP" value={health?.privateIp} />
          <Info label="Uptime" value={health?.uptime} />
          <Info label="Nginx Status" value={health?.nginxStatus} />
          <Info label="Checked At" value={health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "N/A"} />
        </div>
      </div>
    </div>
  );
};

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value || "N/A"}</p>
    </div>
  );
}

export default DashboardPage;
