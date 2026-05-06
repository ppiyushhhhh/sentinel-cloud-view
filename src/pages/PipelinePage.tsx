import { useEffect, useState } from "react";

type WorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  commitMessage: string;
  commitSha: string;
  actor: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
};

type GitHubActionsData = {
  repository: string;
  latestRun: WorkflowRun | null;
  runs: WorkflowRun[];
};

const PipelinePage = () => {
  const [data, setData] = useState<GitHubActionsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = () => {
    fetch("/api/github-actions")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch pipeline data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPipeline();

    const interval = setInterval(fetchPipeline, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Loading CI/CD pipeline data...</div>;
  }

  if (!data || !data.latestRun) {
    return (
      <div className="p-6 text-white space-y-4">
        <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
        <p className="text-red-400">No GitHub Actions data found.</p>
      </div>
    );
  }

  const latest = data.latestRun;

  const statusText =
    latest.status === "completed"
      ? latest.conclusion || "completed"
      : latest.status;

  const statusColor =
    latest.status === "completed" && latest.conclusion === "success"
      ? "text-green-400"
      : latest.status === "in_progress"
      ? "text-yellow-400"
      : "text-red-400";

  const badgeColor =
    latest.status === "completed" && latest.conclusion === "success"
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : latest.status === "in_progress"
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : "bg-red-500/10 border-red-500/30 text-red-400";

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Live GitHub Actions deployment tracking for CloudOps Sentinel.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Latest Deployment</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Auto-refreshes every 30 seconds.
            </p>
          </div>

          <div className={`border rounded-lg px-4 py-2 text-sm font-semibold ${badgeColor}`}>
            {statusText.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Info label="Repository" value={data.repository} />
          <Info label="Workflow" value={latest.name} />
          <Info label="Branch" value={latest.branch} />
          <Info label="Commit SHA" value={latest.commitSha} />
          <Info label="Commit Message" value={latest.commitMessage} />
          <Info label="Triggered By" value={latest.actor} />
          <Info label="Event" value={latest.event} />
          <Info
            label="Updated At"
            value={new Date(latest.updatedAt).toLocaleString()}
          />
        </div>

        <div className="mt-5">
          <p className="text-sm text-zinc-400">Deployment Status</p>
          <p className={`text-3xl font-bold ${statusColor}`}>
            {statusText.toUpperCase()}
          </p>
        </div>

        <a
          href={latest.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
        >
          Open GitHub Actions Run
        </a>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Recent Workflow Runs</h2>

        <div className="space-y-3">
          {data.runs.map((run) => {
            const runStatus =
              run.status === "completed"
                ? run.conclusion || "completed"
                : run.status;

            const runColor =
              run.status === "completed" && run.conclusion === "success"
                ? "text-green-400"
                : run.status === "in_progress"
                ? "text-yellow-400"
                : "text-red-400";

            return (
              <div
                key={run.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{run.commitMessage}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {run.branch} • {run.commitSha} • {run.actor}
                    </p>
                  </div>

                  <a
                    href={run.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 text-sm"
                  >
                    View Run
                  </a>
                </div>

                <p className={`text-sm mt-2 font-semibold ${runColor}`}>
                  Status: {runStatus.toUpperCase()}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  Updated: {new Date(run.updatedAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value || "N/A"}</p>
    </div>
  );
}

export default PipelinePage;
