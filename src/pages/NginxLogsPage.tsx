import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

type NginxSummary = {
  totalRequests: number;
  successRequests: number;
  redirectRequests: number;
  clientErrors: number;
  serverErrors: number;
  errorLogCount: number;
};

type TopIp = {
  ip: string;
  count: number;
};

type TopRoute = {
  route: string;
  count: number;
};

type StatusCode = {
  status: string;
  count: number;
};

type RequestLog = {
  ip: string;
  method: string;
  route: string;
  status: string;
  time: string;
  raw: string;
};

type NginxLogData = {
  summary: NginxSummary;
  topIps: TopIp[];
  topRoutes: TopRoute[];
  statusCodes: StatusCode[];
  latestRequests: RequestLog[];
  latestErrors: string[];
};

const NginxLogsPage = () => {
  const [data, setData] = useState<NginxLogData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    fetch("/api/nginx-logs")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Nginx logs:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusChartData = useMemo(() => {
    if (!data) return [];
    return data.statusCodes.map((item) => ({
      status: item.status,
      count: item.count
    }));
  }, [data]);

  const routeChartData = useMemo(() => {
    if (!data) return [];
    return data.topRoutes.slice(0, 8).map((item) => ({
      route: item.route.length > 18 ? item.route.slice(0, 18) + "..." : item.route,
      count: item.count
    }));
  }, [data]);

  const requestTrendData = useMemo(() => {
    if (!data) return [];

    const bucket: Record<string, number> = {};

    data.latestRequests.forEach((req) => {
      const parts = req.time.split(":");
      const hourMinute =
        parts.length >= 3 ? `${parts[1]}:${parts[2]}` : req.time.slice(0, 8);

      bucket[hourMinute] = (bucket[hourMinute] || 0) + 1;
    });

    return Object.entries(bucket)
      .map(([time, count]) => ({ time, count }))
      .slice(-20);
  }, [data]);

  if (loading) {
    return <div className="p-6 text-white">Loading Nginx log analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-400">Failed to load Nginx logs.</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nginx Log Analytics</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Traffic, status code, route, IP, and error analytics from Nginx logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card title="Total Requests" value={String(data.summary.totalRequests)} />
        <Card title="2xx Success" value={String(data.summary.successRequests)} />
        <Card title="3xx Redirects" value={String(data.summary.redirectRequests)} />
        <Card title="4xx Errors" value={String(data.summary.clientErrors)} />
        <Card title="5xx Errors" value={String(data.summary.serverErrors)} />
        <Card title="Error Logs" value={String(data.summary.errorLogCount)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartPanel title="Status Code Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Top Routes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={routeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="route" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Recent Request Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={requestTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Panel title="Top Visitor IPs">
          {data.topIps.length === 0 ? (
            <p className="text-zinc-400">No IP data found.</p>
          ) : (
            data.topIps.map((item) => (
              <Row key={item.ip} left={item.ip} right={String(item.count)} />
            ))
          )}
        </Panel>

        <Panel title="Most Visited Routes">
          {data.topRoutes.length === 0 ? (
            <p className="text-zinc-400">No route data found.</p>
          ) : (
            data.topRoutes.map((item) => (
              <Row key={item.route} left={item.route} right={String(item.count)} />
            ))
          )}
        </Panel>

        <Panel title="Status Codes">
          {data.statusCodes.length === 0 ? (
            <p className="text-zinc-400">No status data found.</p>
          ) : (
            data.statusCodes.map((item) => (
              <Row key={item.status} left={item.status} right={String(item.count)} />
            ))
          )}
        </Panel>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Latest Requests</h2>

        {data.latestRequests.length === 0 ? (
          <p className="text-zinc-400">No access logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-300">
                  <th className="text-left p-3 border border-zinc-800">IP</th>
                  <th className="text-left p-3 border border-zinc-800">Method</th>
                  <th className="text-left p-3 border border-zinc-800">Route</th>
                  <th className="text-left p-3 border border-zinc-800">Status</th>
                  <th className="text-left p-3 border border-zinc-800">Time</th>
                </tr>
              </thead>

              <tbody>
                {data.latestRequests.map((req, index) => (
                  <tr key={index} className="hover:bg-zinc-950">
                    <td className="p-3 border border-zinc-800">{req.ip}</td>
                    <td className="p-3 border border-zinc-800">{req.method}</td>
                    <td className="p-3 border border-zinc-800 break-all">{req.route}</td>
                    <td className="p-3 border border-zinc-800">
                      <span className={getStatusClass(req.status)}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 border border-zinc-800">{req.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Latest Nginx Errors</h2>

        {data.latestErrors.length === 0 ? (
          <p className="text-zinc-400">No recent Nginx errors found.</p>
        ) : (
          <div className="space-y-3">
            {data.latestErrors.map((error, index) => (
              <div
                key={index}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-red-300 break-words"
              >
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ChartPanel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Panel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2 text-sm">
      <span className="text-zinc-300 break-all">{left}</span>
      <span className="font-semibold">{right}</span>
    </div>
  );
}

function getStatusClass(status: string) {
  if (status.startsWith("2")) return "text-green-400 font-bold";
  if (status.startsWith("3")) return "text-blue-400 font-bold";
  if (status.startsWith("4")) return "text-yellow-400 font-bold";
  if (status.startsWith("5")) return "text-red-400 font-bold";
  return "text-zinc-400 font-bold";
}

export default NginxLogsPage;
