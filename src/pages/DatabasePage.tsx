import { useEffect, useState } from "react";

type DbStatus = {
  success: boolean;
  database: string;
  tables: string[];
  counts: Record<string, number>;
  checkedAt: string;
};

const DatabasePage = () => {
  const [data, setData] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/db/status");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch database status.");
      }

      setData(result);
    } catch (error) {
      console.error("Database status error:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch database status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading database status...</div>;
  }

  if (!data) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Database Status</h1>
        <p className="text-red-400 mt-4">Database status unavailable.</p>
      </div>
    );
  }

  const importantTables = [
    "users",
    "app_settings",
    "incident_history",
    "report_history",
    "trivy_scan_history",
    "pipeline_runs",
    "alert_history"
  ];

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Database Status</h1>
          <p className="text-sm text-zinc-400 mt-2">
            SQLite persistence layer for CloudOps Sentinel dashboard data.
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Last checked: {data.checkedAt ? new Date(data.checkedAt).toLocaleString() : "N/A"}
          </p>
        </div>

        <button
          onClick={fetchDatabaseStatus}
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-semibold"
        >
          Refresh Database Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Tables" value={String(data.tables.length)} />
        <SummaryCard title="Incidents" value={String(data.counts.incident_history ?? 0)} />
        <SummaryCard title="Pipeline Runs" value={String(data.counts.pipeline_runs ?? 0)} />
        <SummaryCard title="Alerts" value={String(data.counts.alert_history ?? 0)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Database Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <Info label="Database Type" value="SQLite" />
          <Info label="Database File" value={data.database} />
          <Info label="Storage Mode" value="Local EC2 file-based database" />
          <Info label="Status" value="Connected and readable" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Core Table Counts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
          {importantTables.map((table) => (
            <div
              key={table}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
            >
              <p className="text-sm text-zinc-400">{formatTableName(table)}</p>
              <p className="text-3xl font-bold mt-2">
                {data.counts[table] ?? 0}
              </p>
              <p className="text-xs text-zinc-500 mt-2">{table}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">All SQLite Tables</h2>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-400">
                <th className="py-3 pr-4">Table Name</th>
                <th className="py-3 pr-4">Rows</th>
                <th className="py-3 pr-4">Purpose</th>
              </tr>
            </thead>

            <tbody>
              {data.tables.map((table) => (
                <tr key={table} className="border-b border-zinc-900">
                  <td className="py-3 pr-4 font-semibold">{table}</td>
                  <td className="py-3 pr-4">{data.counts[table] ?? "N/A"}</td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {getTablePurpose(table)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Persistence Coverage</h2>

        <div className="space-y-3 mt-5 text-sm text-zinc-300">
          <p>Incidents are stored in <span className="text-white font-semibold">incident_history</span>.</p>
          <p>PDF report metadata is stored in <span className="text-white font-semibold">report_history</span>.</p>
          <p>Trivy scan summaries are stored in <span className="text-white font-semibold">trivy_scan_history</span>.</p>
          <p>GitHub Actions runs are stored in <span className="text-white font-semibold">pipeline_runs</span>.</p>
          <p>Alert events are stored in <span className="text-white font-semibold">alert_history</span>.</p>
          <p>Dashboard configuration is stored in <span className="text-white font-semibold">app_settings</span>.</p>
        </div>
      </div>
    </div>
  );
};

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
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

function formatTableName(table: string) {
  return table
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTablePurpose(table: string) {
  const purposes: Record<string, string> = {
    users: "Dashboard users and roles",
    app_settings: "Persistent dashboard settings",
    incident_history: "Operational incidents and resolutions",
    report_history: "PDF report metadata and delivery records",
    trivy_scan_history: "Trivy vulnerability scan history",
    pipeline_runs: "GitHub Actions deployment history",
    alert_history: "Alert events and resolution status",
    sqlite_sequence: "SQLite internal auto-increment tracking"
  };

  return purposes[table] || "Application database table";
}

export default DatabasePage;
