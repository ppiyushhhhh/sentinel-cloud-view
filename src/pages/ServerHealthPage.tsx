import { useEffect, useState } from "react";

type ServerHealth = {
  status: string;
  hostname: string;
  platform: string;
  architecture: string;
  cpuCores: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  totalMemoryGB: number;
  freeMemoryGB: number;
  uptime: string;
  publicIp: string;
  privateIp: string;
  nginxStatus: string;
  checkedAt: string;
};

const ServerHealthPage = () => {
  const [data, setData] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/server-health")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch server health:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-white">Loading server health...</div>;
  if (!data) return <div className="p-6 text-red-400">Failed to load server health.</div>;

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Server Health</h1>
        <p className="text-sm text-zinc-400 mt-2">Live EC2 server metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Metric title="CPU Usage" value={`${data.cpuUsage}%`} />
        <Metric title="Memory Usage" value={`${data.memoryUsage}%`} />
        <Metric title="Disk Usage" value={`${data.diskUsage}%`} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Server Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Info label="Status" value={data.status} />
          <Info label="Hostname" value={data.hostname} />
          <Info label="Public IP" value={data.publicIp} />
          <Info label="Private IP" value={data.privateIp} />
          <Info label="Platform" value={data.platform} />
          <Info label="Architecture" value={data.architecture} />
          <Info label="CPU Cores" value={String(data.cpuCores)} />
          <Info label="Total Memory" value={`${data.totalMemoryGB} GB`} />
          <Info label="Free Memory" value={`${data.freeMemoryGB} GB`} />
          <Info label="Uptime" value={data.uptime} />
          <Info label="Nginx Status" value={data.nginxStatus} />
          <Info label="Checked At" value={new Date(data.checkedAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
};

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value || "N/A"}</p>
    </div>
  );
}

export default ServerHealthPage;
