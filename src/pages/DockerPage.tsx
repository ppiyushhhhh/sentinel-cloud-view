import { dockerContainers } from "@/data/mock";
import { StatusBadge } from "@/components/shared/MetricCard";
import { Container } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DockerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Docker Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">{dockerContainers.length} containers tracked</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {dockerContainers.map((c) => (
          <div key={c.name} className="rounded-lg border border-border bg-card p-3 flex flex-col items-center gap-2">
            <Container className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold text-foreground">{c.name}</span>
            <StatusBadge status={c.status} variant={c.status === "running" ? "success" : c.status === "stopped" ? "danger" : "warning"} />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Container</TableHead>
              <TableHead className="text-muted-foreground">Image</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">CPU %</TableHead>
              <TableHead className="text-muted-foreground">Memory</TableHead>
              <TableHead className="text-muted-foreground">Restarts</TableHead>
              <TableHead className="text-muted-foreground">Last Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dockerContainers.map((c) => (
              <TableRow key={c.name} className="border-border">
                <TableCell className="font-mono text-sm font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.image}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} variant={c.status === "running" ? "success" : c.status === "stopped" ? "danger" : "warning"} />
                </TableCell>
                <TableCell className="font-mono text-sm">{c.cpu}%</TableCell>
                <TableCell className="font-mono text-sm">{c.memory} MB</TableCell>
                <TableCell className="font-mono text-sm">{c.restartCount}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.lastStarted).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
