import { useEffect, useMemo, useState } from "react";

type ActivityEvent = {
  id: string;
  type: string;
  severity: "critical" | "warning" | "success" | "info" | string;
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type ActivityData = {
  summary: {
    totalEvents: number;
    critical: number;
    warning: number;
    success: number;
    info: number;
  };
  events: ActivityEvent[];
  generatedAt: string;
};

const ActivityLogPage = () => {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchActivity = () => {
    fetch("/api/activity-log")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch activity log:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActivity();

    const interval = setInterval(fetchActivity, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    if (filter === "ALL") {
      return data.events;
    }

    return data.events.filter((event) => event.severity === filter);
  }, [data, filter]);

  if (loading) {
    return <div className="p-6 text-white">Loading activity timeline...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-400">Failed to load activity log.</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Centralized incident timeline for alerts, deployments, reports, Docker, Trivy, and server events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Total Events" value={String(data.summary.totalEvents)} />
        <SummaryCard title="Critical" value={String(data.summary.critical)} color="text-red-400" />
        <SummaryCard title="Warnings" value={String(data.summary.warning)} color="text-yellow-400" />
        <SummaryCard title="Success" value={String(data.summary.success)} color="text-green-400" />
        <SummaryCard title="Info" value={String(data.summary.info)} color="text-blue-400" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Incident Timeline</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Auto-refreshes every 30 seconds. Last generated:{" "}
              {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Events</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-zinc-400">
            No events found for the selected filter.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-3 rounded-full ${getSeverityDot(event.severity)}`} />

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-lg">{event.type}</span>
                      <SeverityBadge severity={event.severity} />
                    </div>

                    <p className="text-sm text-zinc-300 leading-6 break-words">
                      {event.message}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-zinc-500">
                      <p>Source: {event.source}</p>
                      <p>Time: {new Date(event.timestamp).toLocaleString()}</p>
                      <p>Severity: {event.severity.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatRelativeTime(event.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  color = "text-white"
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const className =
    severity === "critical"
      ? "bg-red-500/10 border-red-500/30 text-red-400"
      : severity === "warning"
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : severity === "success"
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : "bg-blue-500/10 border-blue-500/30 text-blue-400";

  return (
    <span className={`border rounded-lg px-3 py-1 text-xs font-semibold ${className}`}>
      {severity.toUpperCase()}
    </span>
  );
}

function getSeverityDot(severity: string) {
  if (severity === "critical") return "bg-red-500";
  if (severity === "warning") return "bg-yellow-500";
  if (severity === "success") return "bg-green-500";
  return "bg-blue-500";
}

function formatRelativeTime(timestamp: string) {
  const eventTime = new Date(timestamp).getTime();
  const now = Date.now();

  if (Number.isNaN(eventTime)) return "N/A";

  const diffSeconds = Math.floor((now - eventTime) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

export default ActivityLogPage;
