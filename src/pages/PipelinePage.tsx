import { pipelineSteps, pipelineHistory } from "@/data/mock";
import { StatusBadge } from "@/components/shared/MetricCard";
import { CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const stepIcon = (status: string) => {
  switch (status) {
    case "success": return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "failed": return <XCircle className="h-5 w-5 text-critical" />;
    case "running": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    default: return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CI/CD Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">GitHub Actions deployment timeline</p>
      </div>

      {/* Pipeline Timeline */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Latest Deployment</h3>
        <div className="space-y-0">
          {pipelineSteps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {stepIcon(step.status)}
                {i < pipelineSteps.length - 1 && <div className="w-px h-8 bg-border" />}
              </div>
              <div className="pb-8">
                <p className="text-sm font-medium text-foreground">{step.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{step.time} • {step.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Deployment History</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Commit</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipelineHistory.map((p) => (
              <TableRow key={p.id} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">{p.commit}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} variant={p.status === "success" ? "success" : "danger"} />
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{p.duration}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(p.time).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
