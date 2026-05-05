import { alertRules, alertHistory } from "@/data/mock";
import { StatusBadge } from "@/components/shared/MetricCard";
import { Bell, Mail, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">Alert rules and notification history</p>
      </div>

      {/* Alert Rules */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Alert Rules
          </h3>
        </div>
        <div className="divide-y divide-border">
          {alertRules.map((rule) => (
            <div key={rule.name} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{rule.condition}</p>
              </div>
              <Switch defaultChecked={rule.enabled} />
            </div>
          ))}
        </div>
      </div>

      {/* Alert History */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Alert History</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Severity</TableHead>
              <TableHead className="text-muted-foreground">Message</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertHistory.map((a) => (
              <TableRow key={a.id} className="border-border">
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(a.time).toLocaleString()}</TableCell>
                <TableCell className="text-sm text-foreground">{a.type}</TableCell>
                <TableCell>
                  <StatusBadge status={a.severity} variant={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{a.message}</TableCell>
                <TableCell>
                  {a.emailSent ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
