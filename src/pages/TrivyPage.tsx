import { useEffect, useState } from "react";

type Summary = {
  low: number;
  medium: number;
  high: number;
  critical: number;
  total: number;
};

type TrivyData = {
  frontend: Summary;
  backend: Summary;
  scannedImages: {
    frontend: string;
    backend: string;
  };
  scannedAt: string;
};

const TrivyPage = () => {
  const [data, setData] = useState<TrivyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trivy-summary")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Trivy data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading Trivy scan data...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-400">Failed to load Trivy data.</div>;
  }

  const totalCritical = data.frontend.critical + data.backend.critical;
  const totalHigh = data.frontend.high + data.backend.high;
  const totalMedium = data.frontend.medium + data.backend.medium;
  const totalLow = data.frontend.low + data.backend.low;
  const total = data.frontend.total + data.backend.total;

  const status =
    totalCritical > 0
      ? "Critical Risk"
      : totalHigh > 0
      ? "High Risk"
      : "Healthy";

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trivy Security</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Real cached Trivy Docker image scan results from your EC2 server.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-2">Security Status</h2>
        <p
          className={`text-3xl font-bold ${
            status === "Healthy"
              ? "text-green-400"
              : status === "High Risk"
              ? "text-yellow-400"
              : "text-red-400"
          }`}
        >
          {status}
        </p>
        <p className="text-sm text-zinc-400 mt-2">
          Last Scan: {data.scannedAt || "N/A"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <Card title="Critical" value={String(totalCritical)} />
        <Card title="High" value={String(totalHigh)} />
        <Card title="Medium" value={String(totalMedium)} />
        <Card title="Low" value={String(totalLow)} />
        <Card title="Total" value={String(total)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImageCard
          title="Frontend Image"
          image={data.scannedImages.frontend}
          summary={data.frontend}
        />

        <ImageCard
          title="Backend Image"
          image={data.scannedImages.backend}
          summary={data.backend}
        />
      </div>
    </div>
  );
};

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ImageCard({
  title,
  image,
  summary
}: {
  title: string;
  image: string;
  summary: Summary;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-xs text-zinc-400 break-all">{image}</p>
      <p>Critical: {summary.critical}</p>
      <p>High: {summary.high}</p>
      <p>Medium: {summary.medium}</p>
      <p>Low: {summary.low}</p>
      <p>Total: {summary.total}</p>
    </div>
  );
}

export default TrivyPage;
