import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";

type AppSettings = {
  cpu_threshold: string;
  memory_threshold: string;
  disk_threshold: string;
  alert_cooldown_minutes: string;
  report_page_size: string;
  pipeline_page_size: string;
  trivy_scan_schedule?: string;
  report_email_schedule?: string;
};

const defaultSettings: AppSettings = {
  cpu_threshold: "80",
  memory_threshold: "80",
  disk_threshold: "80",
  alert_cooldown_minutes: "30",
  report_page_size: "10",
  pipeline_page_size: "10",
  trivy_scan_schedule: "0 7 * * *",
  report_email_schedule: "0 8 * * *"
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await authFetch("/api/settings");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch settings");
      }

      const loadedSettings: AppSettings = {
        ...defaultSettings,
        ...data.settings
      };

      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = (key: keyof AppSettings, value: string) => {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await authFetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save settings");
      }

      setOriginalSettings(settings);
      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setSettings(originalSettings);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return <div className="p-6 text-white">Loading settings from database...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Configure dashboard thresholds, page sizes, and automation values stored in SQLite.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-semibold"
        >
          Refresh from Database
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <SummaryCard
          title="CPU Threshold"
          value={`${settings.cpu_threshold}%`}
          description="Server CPU alert trigger"
        />

        <SummaryCard
          title="Memory Threshold"
          value={`${settings.memory_threshold}%`}
          description="RAM usage alert trigger"
        />

        <SummaryCard
          title="Disk Threshold"
          value={`${settings.disk_threshold}%`}
          description="Disk usage alert trigger"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Alert Thresholds</h2>
        <p className="text-sm text-zinc-400 mt-1">
          These values are saved in the SQLite app_settings table.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <SettingInput
            label="CPU Threshold (%)"
            description="Trigger alert when CPU usage crosses this value."
            value={settings.cpu_threshold}
            onChange={(value) => updateSetting("cpu_threshold", value)}
            type="number"
            min="1"
            max="100"
          />

          <SettingInput
            label="Memory Threshold (%)"
            description="Trigger alert when memory usage crosses this value."
            value={settings.memory_threshold}
            onChange={(value) => updateSetting("memory_threshold", value)}
            type="number"
            min="1"
            max="100"
          />

          <SettingInput
            label="Disk Threshold (%)"
            description="Trigger alert when disk usage crosses this value."
            value={settings.disk_threshold}
            onChange={(value) => updateSetting("disk_threshold", value)}
            type="number"
            min="1"
            max="100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <SettingInput
            label="Alert Cooldown (minutes)"
            description="Avoid duplicate alerts within this period."
            value={settings.alert_cooldown_minutes}
            onChange={(value) => updateSetting("alert_cooldown_minutes", value)}
            type="number"
            min="1"
            max="1440"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Page Size Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          These values can be used by paginated dashboard pages.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <SettingInput
            label="Report Page Size"
            description="Number of PDF reports shown per page."
            value={settings.report_page_size}
            onChange={(value) => updateSetting("report_page_size", value)}
            type="number"
            min="5"
            max="100"
          />

          <SettingInput
            label="Pipeline Page Size"
            description="Number of deployments shown per page."
            value={settings.pipeline_page_size}
            onChange={(value) => updateSetting("pipeline_page_size", value)}
            type="number"
            min="5"
            max="100"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Automation Schedules</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Stored as reference values in SQLite. Cron still controls actual execution on the server.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <SettingInput
            label="Trivy Scan Cron"
            description="Example: 0 7 * * * means daily at 7:00 AM."
            value={settings.trivy_scan_schedule || ""}
            onChange={(value) => updateSetting("trivy_scan_schedule", value)}
          />

          <SettingInput
            label="Report Email Cron"
            description="Example: 0 8 * * * means daily at 8:00 AM."
            value={settings.report_email_schedule || ""}
            onChange={(value) => updateSetting("report_email_schedule", value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Database Persistence</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
          <Info
            label="Database Table"
            value="app_settings"
          />

          <Info
            label="Database File"
            value="/home/ubuntu/CloudOps-Sentinel/backend/data/cloudops.db"
          />

          <Info
            label="Storage Type"
            value="SQLite local file-based database"
          />

          <Info
            label="Current Status"
            value={hasChanges ? "Unsaved changes detected" : "All settings saved"}
          />
        </div>
      </div>

      <div className="sticky bottom-5 z-30 bg-zinc-950/95 border border-zinc-800 rounded-xl p-4 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-zinc-400">
            {hasChanges
              ? "You have unsaved changes."
              : "Settings are synced with SQLite."}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetChanges}
              disabled={!hasChanges || saving}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-5 py-2 font-semibold"
            >
              Reset Changes
            </button>

            <button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 px-5 py-2 font-semibold"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function SettingInput({
  label,
  description,
  value,
  onChange,
  type = "text",
  min,
  max
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <label className="text-sm font-semibold text-zinc-200">{label}</label>
      <p className="text-xs text-zinc-500 mt-1 min-h-[32px]">{description}</p>

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-green-500"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-zinc-500 mt-2">{description}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value}</p>
    </div>
  );
}

export default SettingsPage;
