import { serverStatus, cpuHistory } from "@/data/mock";
import { MetricCard, CircularProgress, StatusBadge } from "@/components/shared/MetricCard";
import { Cpu, HardDrive, MemoryStick, Container, Rocket, Shield, Heart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function getVariant(value: number, warn: number, crit: number) {
  if (value >= crit) return "danger" as const;
  if (value >= warn) return "warning" as const;
  return "success" as const;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time monitoring of your infrastructure</p>
      </div>

      {/* Health Score + Circular Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center glow-primary">
          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Health Score</span>
          <div className="relative flex items-center justify-center">
            <CircularProgress value={serverStatus.healthScore} label="" size={120} variant={getVariant(100 - serverStatus.healthScore, 20, 40)} />
          </div>
        </div>
        {[
          { label: "CPU", value: serverStatus.cpu, icon: <Cpu className="h-4 w-4" /> },
          { label: "RAM", value: serverStatus.ram, icon: <MemoryStick className="h-4 w-4" /> },
          { label: "Disk", value: serverStatus.disk, icon: <HardDrive className="h-4 w-4" /> },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <CircularProgress value={m.value} label="" size={100} variant={getVariant(m.value, 60, 80)} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              {m.icon}
              <span>{m.label} Usage</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Server Status" value={serverStatus.status === "online" ? "Online" : "Offline"} icon={<Heart className="h-4 w-4" />} variant={serverStatus.status === "online" ? "success" : "danger"} />
        <MetricCard title="Docker Containers" value={serverStatus.dockerContainers} subtitle="All running" icon={<Container className="h-4 w-4" />} />
        <MetricCard title="Last Deploy" value={<StatusBadge status="Success" variant="success" /> as any} subtitle={new Date(serverStatus.lastDeployment.time).toLocaleString()} icon={<Rocket className="h-4 w-4" />} />
        <MetricCard title="Trivy Scan" value={<StatusBadge status="Pass" variant="success" /> as any} subtitle={new Date(serverStatus.lastTrivyScan.time).toLocaleString()} icon={<Shield className="h-4 w-4" />} />
      </div>

      {/* CPU Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">CPU Usage (24h)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={cpuHistory}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 14% 18%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="hsl(199 89% 48%)" fill="url(#cpuGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
