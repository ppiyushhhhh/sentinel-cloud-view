import { useEffect, useState } from "react";

type WorkflowRun = {
  id: number;
  runNumber: number;
  name: string;
  displayTitle: string;
  status: string;
  conclusion: string | null;
  branch: string;
  commitMessage: string;
  commitSha: string;
  fullCommitSha: string;
  actor: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  duration: string;
  htmlUrl: string;
  workflowId: number;
  runAttempt: number;
  repository: string;
};

type PipelineSummary = {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  inProgressRuns: number;
  cancelledRuns: number;
};

type GitHubActionsData = {
  repository: string;
  latestRun: WorkflowRun | null;
  summary: PipelineSummary;
  runs: WorkflowRun[];
};

const PipelinePage = () => {
  const [data, setData] = useState<GitHubActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const filteredRuns = data.runs.filter((run) => {
    const runStatus = getRunStatus(run);
    if (statusFilter === "ALL") return true;
    return runStatus === statusFilter;
  });

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Complete GitHub Actions deployment history and live status tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Total Runs" value={String(data.summary.totalRuns)} />
        <SummaryCard title="Successful" value={String(data.summary.successfulRuns)} />
        <SummaryCard title="Failed" value={String(data.summary.failedRuns)} />
        <SummaryCard title="In Progress" value={String(data.summary.inProgressRuns)} />
        <SummaryCard title="Cancelled" value={String(data.summary.cancelledRuns)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Latest Deployment</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Auto-refreshes every 30 seconds.
            </p>
          </div>

          <StatusBadge run={latest} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Info label="Repository" value={data.repository} />
          <Info label="Workflow" value={latest.name} />
          <Info label="Run Number" value={`#${latest.runNumber}`} />
          <Info label="Run Attempt" value={String(latest.runAttempt)} />
          <Info label="Branch" value={latest.branch} />
          <Info label="Commit SHA" value={latest.commitSha} />
          <Info label="Commit Message" value={latest.commitMessage} />
          <Info label="Triggered By" value={latest.actor} />
          <Info label="Event" value={latest.event} />
          <Info label="Duration" value={latest.duration} />
          <Info label="Created At" value={new Date(latest.createdAt).toLocaleString()} />
          <Info label="Updated At" value={new Date(latest.updatedAt).toLocaleString()} />
        </div>

        <a
          href={latest.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
        >
          Open Latest GitHub Actions Run
        </a>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Deployment History</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Showing latest {data.runs.length} GitHub Actions workflow runs.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {filteredRuns.length === 0 ? (
          <p className="text-zinc-400">No workflow runs found for this filter.</p>
        ) : (
          <div className="space-y-4">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-lg">
                        Run #{run.runNumber}
                      </p>
                      <StatusBadge run={run} />
                    </div>

                    <p className="text-sm text-zinc-300 break-words">
                      {run.commitMessage}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-zinc-500">
                      <p>Workflow: {run.name}</p>
                      <p>Branch: {run.branch}</p>
                      <p>Commit: {run.commitSha}</p>
                      <p>Actor: {run.actor}</p>
                      <p>Event: {run.event}</p>
                      <p>Duration: {run.duration}</p>
                      <p>Created: {new Date(run.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(run.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <a
                    href={run.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold text-center"
                  >
                    View Run
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getRunStatus(run: WorkflowRun) {
  if (run.status === "in_progress") return "IN_PROGRESS";
  if (run.conclusion === "success") return "SUCCESS";
  if (run.conclusion === "failure") return "FAILED";
  if (run.conclusion === "cancelled") return "CANCELLED";
  return "UNKNOWN";
}

function getStatusText(run: WorkflowRun) {
  const status = getRunStatus(run);

  if (status === "SUCCESS") return "SUCCESS";
  if (status === "FAILED") return "FAILED";
  if (status === "IN_PROGRESS") return "IN PROGRESS";
  if (status === "CANCELLED") return "CANCELLED";

  return run.status.toUpperCase();
}

function StatusBadge({ run }: { run: WorkflowRun }) {
  const status = getRunStatus(run);

  const badgeClass =
    status === "SUCCESS"
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : status === "IN_PROGRESS"
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : status === "FAILED"
      ? "bg-red-500/10 border-red-500/30 text-red-400"
      : status === "CANCELLED"
      ? "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
      : "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";

  return (
    <span className={`border rounded-lg px-3 py-1 text-xs font-semibold ${badgeClass}`}>
      {getStatusText(run)}
    </span>
  );
}

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
      <p className="font-semibold break-words">{value || "N/A"}</p>
    </div>
  );
}

export default PipelinePage;
