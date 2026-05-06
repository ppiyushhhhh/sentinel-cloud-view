import { useEffect, useState } from "react";

type AlertItem = {
  id: number;
  message: string;
  timestamp: string;
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    fetch("/api/alerts-history")
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch alerts:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const sendTestAlert = async () => {
    await fetch("/api/send-alert?type=test&message=Manual test alert from CloudOps Sentinel dashboard");
    fetchAlerts();
    alert("Test alert sent. Check your email.");
  };

  if (loading) return <div className="p-6 text-white">Loading alert history...</div>;

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-sm text-zinc-400 mt-2">Email alert history and monitoring status.</p>
      </div>

      <button onClick={sendTestAlert} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold">
        Send Test Alert
      </button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card title="Disk Alert" value="60%" />
        <Card title="Memory Alert" value="80%" />
        <Card title="CPU Alert" value="80%" />
        <Card title="Backend" value="Monitored" />
        <Card title="Docker" value="Monitored" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Alert History</h2>

        {alerts.length === 0 ? (
          <p className="text-zinc-400">No alerts found yet.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <p className="text-sm text-zinc-300 break-words">{alert.message}</p>
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
      <p className="text-lg font-semibold mt-2">{value}</p>
    </div>
  );
}

export default AlertsPage;
