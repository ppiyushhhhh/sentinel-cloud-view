import { trivySummary, vulnerabilities } from "@/data/mock";
import { StatusBadge } from "@/components/shared/MetricCard";
import { Shield, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const severityVariant = (s: string) => {
  switch (s) {
    case "CRITICAL": return "danger" as const;
    case "HIGH": return "warning" as const;
    case "MEDIUM": return "info" as const;
    default: return "neutral" as const;
  }
};

export default function TrivyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trivy Security</h1>
        <p className="text-sm text-muted-foreground mt-1">Container image vulnerability scanning</p>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
        <span className="text-sm text-warning font-medium">Deployment blocked if HIGH or CRITICAL vulnerabilities are found.</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["critical", "high", "medium", "low", "unknown"] as const).map((sev) => {
          const colors: Record<string, string> = {
            critical: "text-critical border-critical/30 bg-critical/10",
            high: "text-warning border-warning/30 bg-warning/10",
            medium: "text-primary border-primary/30 bg-primary/10",
            low: "text-success border-success/30 bg-success/10",
            unknown: "text-muted-foreground border-border bg-muted",
          };
          return (
            <div key={sev} className={`rounded-lg border p-4 text-center ${colors[sev]}`}>
              <span className="text-3xl font-bold">{trivySummary[sev]}</span>
              <p className="text-xs font-semibold uppercase mt-1">{sev}</p>
            </div>
          );
        })}
      </div>

      {/* Vulnerabilities Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Package</TableHead>
              <TableHead className="text-muted-foreground">Vulnerability ID</TableHead>
              <TableHead className="text-muted-foreground">Severity</TableHead>
              <TableHead className="text-muted-foreground">Installed</TableHead>
              <TableHead className="text-muted-foreground">Fixed</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vulnerabilities.map((v) => (
              <TableRow key={v.vulnId} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">{v.pkg}</TableCell>
                <TableCell className="font-mono text-xs text-primary">{v.vulnId}</TableCell>
                <TableCell><StatusBadge status={v.severity} variant={severityVariant(v.severity)} /></TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{v.installed}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{v.fixed}</TableCell>
                <TableCell>
                  <StatusBadge status={v.status} variant={v.status === "Fixed" ? "success" : v.status === "Affected" ? "warning" : "neutral"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
