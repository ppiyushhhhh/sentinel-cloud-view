import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

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

type MetricSnapshot = {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  status: string;
};

const DashboardPage = () => {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [trivy, setTrivy] = useState<TrivySummary | null>(null);
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    Promise.all([
      fetch("/api/server-health").then((res) => res.json()),
      fetch("/api/docker-containers").then((res) => res.json()),
      fetch("/api/trivy-summary").then((res) => res.json()),
      fetch("/api/metrics-history").then((res) => res.json())
    ])
      .then(([healthData, dockerData, trivyData, metricsData]) => {
        setHealth(healthData);
        setContainers(dockerData);
        setTrivy(trivyData);
        setMetrics(metricsData.history || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Dashboard API error:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading live dashboard data...</div>;
  }

  const totalHigh = (trivy?.frontend.high || 0) + (trivy?.backend.high || 0);
  const totalCritical = (trivy?.frontend.critical || 0) + (trivy?.backend.critical || 0);

  const chartData = metrics.slice(-288).map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    cpu: item.cpuUsage,
    memory: item.memoryUsage,
    disk: item.diskUsage
  }));

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Live CloudOps Sentinel overview with historical server metrics.
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
          <Info
            label="Checked At"
            value={health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "N/A"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <MetricChart
          title="CPU Usage Trend"
          data={chartData}
          dataKey="cpu"
        />

        <MetricChart
          title="Memory Usage Trend"
          data={chartData}
          dataKey="memory"
        />

        <MetricChart
          title="Disk Usage Trend"
          data={chartData}
          dataKey="disk"
        />
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

function MetricChart({
  title,
  data,
  dataKey
}: {
  title: string;
  data: { time: string; cpu: number; memory: number; disk: number }[];
  dataKey: "cpu" | "memory" | "disk";
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {data.length === 0 ? (
        <p className="text-zinc-400">
          No historical metrics collected yet. Wait for cron or run collect-metrics.sh manually.
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataKey}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
