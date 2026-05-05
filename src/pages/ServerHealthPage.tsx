import { serverStatus, cpuHistory, ramHistory, diskHistory, networkHistory } from "@/data/mock";
import { MetricCard, StatusBadge } from "@/components/shared/MetricCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Server, Cpu, MemoryStick, HardDrive, Network, Clock } from "lucide-react";

const chartProps = {
  xAxis: { dataKey: "time" as const, tick: { fontSize: 10, fill: "hsl(215 12% 52%)" }, axisLine: false, tickLine: false },
  yAxis: { domain: [0, 100] as [number, number], tick: { fontSize: 10, fill: "hsl(215 12% 52%)" }, axisLine: false, tickLine: false },
  tooltip: { contentStyle: { background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8, fontSize: 12 } },
};

function MiniChart({ data, dataKey, color, gradientId }: { data: any[]; dataKey: string; color: string; gradientId: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis {...chartProps.xAxis} />
        <YAxis {...chartProps.yAxis} />
        <Tooltip {...chartProps.tooltip} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function ServerHealthPage() {
  const diskWarning = serverStatus.disk >= 60;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Server Health</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed metrics for {serverStatus.publicIp}</p>
      </div>

      {diskWarning && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-warning shrink-0" />
          <span className="text-sm text-warning font-medium">Disk usage alert threshold: 60% — Current: {serverStatus.disk}%</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Instance Type" value={serverStatus.instanceType} icon={<Server className="h-4 w-4" />} />
        <MetricCard title="Region" value={serverStatus.region} icon={<Network className="h-4 w-4" />} />
        <MetricCard title="OS" value={serverStatus.os} icon={<Cpu className="h-4 w-4" />} />
        <MetricCard title="Uptime" value={serverStatus.uptime} icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">CPU Usage (24h)</h3>
          <MiniChart data={cpuHistory} dataKey="value" color="hsl(199,89%,48%)" gradientId="cpuG" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Memory Usage (24h)</h3>
          <MiniChart data={ramHistory} dataKey="value" color="hsl(280,67%,60%)" gradientId="ramG" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Disk Usage (24h)</h3>
          <MiniChart data={diskHistory} dataKey="value" color="hsl(38,92%,50%)" gradientId="diskG" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Network Traffic (24h)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={networkHistory}>
              <XAxis {...chartProps.xAxis} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} axisLine={false} tickLine={false} />
              <Tooltip {...chartProps.tooltip} />
              <Line type="monotone" dataKey="inbound" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="outbound" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Storage</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${serverStatus.disk}%` }} />
            </div>
          </div>
          <span className="text-sm font-mono text-muted-foreground">{serverStatus.storageUsed} / {serverStatus.storageTotal}</span>
        </div>
      </div>
    </div>
  );
}
