import { settings } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [form, setForm] = useState(settings);
  const { toast } = useToast();

  const handleSave = () => {
    // POST /api/settings
    toast({ title: "Settings saved", description: "Configuration updated successfully." });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure monitoring thresholds and notifications</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2 text-foreground mb-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Server Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ip" className="text-muted-foreground">Server IP</Label>
            <Input id="ip" value={form.serverIp} onChange={(e) => setForm({ ...form, serverIp: e.target.value })} className="font-mono bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">Email Recipient</Label>
            <Input id="email" value={form.emailRecipient} onChange={(e) => setForm({ ...form, emailRecipient: e.target.value })} className="bg-muted border-border" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Disk Threshold (%)</Label>
            <Input type="number" value={form.diskThreshold} onChange={(e) => setForm({ ...form, diskThreshold: Number(e.target.value) })} className="font-mono bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">CPU Threshold (%)</Label>
            <Input type="number" value={form.cpuThreshold} onChange={(e) => setForm({ ...form, cpuThreshold: Number(e.target.value) })} className="font-mono bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">RAM Threshold (%)</Label>
            <Input type="number" value={form.ramThreshold} onChange={(e) => setForm({ ...form, ramThreshold: Number(e.target.value) })} className="font-mono bg-muted border-border" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Daily Report Time</Label>
            <Input type="time" value={form.dailyReportTime} onChange={(e) => setForm({ ...form, dailyReportTime: e.target.value })} className="font-mono bg-muted border-border" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <Label className="text-muted-foreground">Enable Alerts</Label>
            <Switch checked={form.alertsEnabled} onCheckedChange={(v) => setForm({ ...form, alertsEnabled: v })} />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
