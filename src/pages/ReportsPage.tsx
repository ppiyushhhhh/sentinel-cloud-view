import { reports } from "@/data/mock";
import { StatusBadge } from "@/components/shared/MetricCard";
import { FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">PDF Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Daily automated infrastructure reports</p>
      </div>

      {/* Report Preview Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Report Preview — {reports[0].date}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {["Server Overview", "Health Metrics", "Docker Status", "Deployment Summary", "Trivy Security Summary", "Recommendations"].map((section) => (
            <div key={section} className="rounded-md border border-border bg-muted/30 p-3">
              <span className="text-xs font-medium text-muted-foreground">{section}</span>
              <div className="h-8 mt-2 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Health</TableHead>
              <TableHead className="text-muted-foreground">Disk</TableHead>
              <TableHead className="text-muted-foreground">Trivy</TableHead>
              <TableHead className="text-muted-foreground">Deploy</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">{r.date}</TableCell>
                <TableCell>
                  <span className={`font-bold text-sm ${r.healthScore >= 90 ? "text-success" : r.healthScore >= 80 ? "text-warning" : "text-critical"}`}>
                    {r.healthScore}%
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{r.diskUsage}%</TableCell>
                <TableCell><StatusBadge status={r.trivyResult === "pass" ? "Pass" : "Fail"} variant={r.trivyResult === "pass" ? "success" : "danger"} /></TableCell>
                <TableCell><StatusBadge status={r.deploymentStatus} variant={r.deploymentStatus === "success" ? "success" : "danger"} /></TableCell>
                <TableCell>
                  {r.emailSent ? <Mail className="h-4 w-4 text-success" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
