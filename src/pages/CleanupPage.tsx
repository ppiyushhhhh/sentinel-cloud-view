import { useEffect, useState } from "react";

type LargestFolder = {
  size: string;
  path: string;
};

type CleanupSummary = {
  diskUsage: number;
  largestFolders: LargestFolder[];
  dockerDiskUsage: string;
  cleanupCandidates: {
    oldPdfReports: number;
    oldLogFiles: number;
    stoppedContainers: number;
    danglingImages: number;
  };
  checkedAt: string;
};

const CleanupPage = () => {
  const [data, setData] = useState<CleanupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState("");

  const fetchSummary = () => {
    fetch("/api/cleanup-summary")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch cleanup summary:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const runCleanup = async (type: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to run cleanup: ${type}?`
    );

    if (!confirmed) return;

    setRunning(type);

    try {
      await fetch(`/api/run-cleanup?type=${type}`);
      fetchSummary();
      alert("Cleanup completed successfully.");
    } catch (error) {
      console.error(error);
      alert("Cleanup failed.");
    } finally {
      setRunning("");
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading cleanup dashboard...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-400">Failed to load cleanup data.</div>;
  }

  const diskStatus =
    data.diskUsage >= 80
      ? "Critical"
      : data.diskUsage >= 60
      ? "Warning"
      : "Healthy";

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Server Cleanup</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Safe disk cleanup and storage visibility for the EC2 server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card title="Disk Usage" value={`${data.diskUsage}%`} />
        <Card title="Disk Status" value={diskStatus} />
        <Card title="Old PDFs" value={String(data.cleanupCandidates.oldPdfReports)} />
        <Card title="Old Logs" value={String(data.cleanupCandidates.oldLogFiles)} />
        <Card title="Stopped Containers" value={String(data.cleanupCandidates.stoppedContainers)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Cleanup Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ActionButton
            label="Delete Old PDF Reports"
            type="old-reports"
            running={running}
            onClick={runCleanup}
          />

          <ActionButton
            label="Delete Old Log Files"
            type="old-logs"
            running={running}
            onClick={runCleanup}
          />

          <ActionButton
            label="Remove Stopped Containers"
            type="stopped-containers"
            running={running}
            onClick={runCleanup}
          />

          <ActionButton
            label="Remove Dangling Images"
            type="dangling-images"
            running={running}
            onClick={runCleanup}
          />

          <ActionButton
            label="Clean NPM Cache"
            type="npm-cache"
            running={running}
            onClick={runCleanup}
          />

          <ActionButton
            label="Run Safe Cleanup"
            type="safe-all"
            running={running}
            onClick={runCleanup}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Largest Project/System Paths</h2>

        {data.largestFolders.length === 0 ? (
          <p className="text-zinc-400">No folder usage data found.</p>
        ) : (
          <div className="space-y-3">
            {data.largestFolders.map((item, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 border-b border-zinc-800 pb-2 text-sm"
              >
                <span className="text-zinc-300 break-all">{item.path}</span>
                <span className="font-semibold">{item.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Docker Disk Usage</h2>
        <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap">
          {data.dockerDiskUsage}
        </pre>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-3">Safety Notes</h2>
        <div className="space-y-2 text-sm text-zinc-300">
          <p>Safe cleanup only removes old reports, old logs, stopped containers, and dangling Docker images.</p>
          <p>It does not delete source code, active containers, Nginx files, PM2 process files, or environment variables.</p>
          <p>Checked at: {new Date(data.checkedAt).toLocaleString()}</p>
        </div>
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

function ActionButton({
  label,
  type,
  running,
  onClick
}: {
  label: string;
  type: string;
  running: string;
  onClick: (type: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(type)}
      disabled={running !== ""}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-4 py-3 rounded-lg font-semibold"
    >
      {running === type ? "Running..." : label}
    </button>
  );
}

export default CleanupPage;
