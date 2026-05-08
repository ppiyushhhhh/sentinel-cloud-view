import { useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;

type WorkflowRun = {
  id: number;
  runNumber: number;
  name?: string;
  workflow?: string;
  workflowName?: string;
  workflow_name?: string;
  displayTitle?: string;
  status: string;
  conclusion: string | null;
  displayStatus?: string;
  branch: string;
  commitMessage: string;
  commitSha: string;
  fullCommitSha: string;
  actor?: string;
  actorLogin?: string;
  triggeredBy?: string;
  triggered_by?: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  duration?: string;
  durationSeconds?: number | null;
  htmlUrl: string;
  workflowId?: number;
  runAttempt: number;
  repository: string;
};

type PipelineSummary = {
  totalRuns: number;
  successfulRuns?: number;
  successful?: number;
  success?: number;
  failedRuns?: number;
  failed?: number;
  inProgressRuns?: number;
  inProgress?: number;
  cancelledRuns?: number;
  cancelled?: number;
};

type GitHubActionsData = {
  success?: boolean;
  repository: string;
  latestRun: WorkflowRun | null;
  latestDeployment?: WorkflowRun | null;
  summary: PipelineSummary;
  stats?: PipelineSummary;
  runs: WorkflowRun[];
  fetchedAt?: string;
};

const PipelinePage = () => {
  const [data, setData] = useState<GitHubActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchPipeline = () => {
    fetch("/api/github-actions")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLastUpdated(new Date().toLocaleString());
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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const latest = data?.latestRun || data?.latestDeployment || null;
  const summary = data?.summary || data?.stats;

  const totalRuns = Number(summary?.totalRuns ?? data?.runs?.length ?? 0);
  const successfulRuns = Number(
    summary?.successfulRuns ?? summary?.successful ?? summary?.success ?? 0
  );
  const failedRuns = Number(summary?.failedRuns ?? summary?.failed ?? 0);
  const inProgressRuns = Number(
    summary?.inProgressRuns ?? summary?.inProgress ?? 0
  );
  const cancelledRuns = Number(
    summary?.cancelledRuns ?? summary?.cancelled ?? 0
  );

  const filteredRuns = useMemo(() => {
    const runs = Array.isArray(data?.runs) ? data.runs : [];
    const query = searchTerm.trim().toLowerCase();

    return runs.filter((run) => {
      const runStatus = getRunStatus(run);
      const statusMatches = statusFilter === "ALL" || runStatus === statusFilter;

      const searchableText = [
        run.runNumber,
        getWorkflowName(run),
        run.commitMessage,
        run.commitSha,
        run.fullCommitSha,
        run.branch,
        getActor(run),
        run.event,
        run.repository,
        run.displayStatus,
        run.status,
        run.conclusion
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches = !query || searchableText.includes(query);

      return statusMatches && searchMatches;
    });
  }, [data, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRuns = filteredRuns.slice(startIndex, endIndex);

  if (loading) {
    return <div className="p-6 text-white">Loading CI/CD pipeline data...</div>;
  }

  if (!data || !latest) {
    return (
      <div className="p-6 text-white space-y-4">
        <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
        <p className="text-red-400">No GitHub Actions data found.</p>
        <button
          onClick={fetchPipeline}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Complete GitHub Actions deployment history and live status tracking.
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Last dashboard refresh: {lastUpdated || "N/A"} · API fetched:{" "}
            {data.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "N/A"}
          </p>
        </div>

        <button
          onClick={fetchPipeline}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Refresh Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Total Runs" value={String(totalRuns)} />
        <SummaryCard title="Successful" value={String(successfulRuns)} />
        <SummaryCard title="Failed" value={String(failedRuns)} />
        <SummaryCard title="In Progress" value={String(inProgressRuns)} />
        <SummaryCard title="Cancelled" value={String(cancelledRuns)} />
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
          <Info label="Workflow" value={getWorkflowName(latest)} />
          <Info label="Run Number" value={`#${latest.runNumber}`} />
          <Info label="Run Attempt" value={String(latest.runAttempt || "N/A")} />
          <Info label="Branch" value={latest.branch || "N/A"} />
          <Info label="Commit SHA" value={latest.commitSha || "N/A"} />
          <Info label="Commit Message" value={latest.commitMessage || "N/A"} />
          <Info label="Triggered By" value={getActor(latest)} />
          <Info label="Event" value={latest.event || "N/A"} />
          <Info label="Duration" value={formatDuration(latest)} />
          <Info label="Created At" value={formatDate(latest.createdAt)} />
          <Info label="Updated At" value={formatDate(latest.updatedAt)} />
        </div>

        {latest.htmlUrl && (
          <a
            href={latest.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
          >
            Open Latest GitHub Actions Run
          </a>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Deployment History</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Showing {paginatedRuns.length} of {filteredRuns.length} filtered runs.
              Page {safeCurrentPage} of {totalPages}. Total available:{" "}
              {data.runs.length}.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search run, commit, branch, actor..."
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white min-w-[260px]"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
        </div>

        {filteredRuns.length === 0 ? (
          <p className="text-zinc-400">No workflow runs found for this filter.</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedRuns.map((run) => (
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
                        {run.commitMessage || "No commit message available"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-zinc-500">
                        <p>Workflow: {getWorkflowName(run)}</p>
                        <p>Branch: {run.branch || "N/A"}</p>
                        <p>Commit: {run.commitSha || "N/A"}</p>
                        <p>Actor: {getActor(run)}</p>
                        <p>Event: {run.event || "N/A"}</p>
                        <p>Duration: {formatDuration(run)}</p>
                        <p>Created: {formatDate(run.createdAt)}</p>
                        <p>Updated: {formatDate(run.updatedAt)}</p>
                      </div>
                    </div>

                    {run.htmlUrl && (
                      <a
                        href={run.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold text-center"
                      >
                        View Run
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredRuns.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

function getWorkflowName(run: WorkflowRun) {
  return (
    run.name ||
    run.workflowName ||
    run.workflow ||
    run.workflow_name ||
    run.displayTitle ||
    "N/A"
  );
}

function getActor(run: WorkflowRun) {
  return (
    run.actor ||
    run.actorLogin ||
    run.triggeredBy ||
    run.triggered_by ||
    "N/A"
  );
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function formatDuration(run: WorkflowRun) {
  if (run.duration && run.duration.trim() !== "") return run.duration;

  if (typeof run.durationSeconds === "number") {
    if (run.durationSeconds < 60) return `${run.durationSeconds}s`;
    const minutes = Math.floor(run.durationSeconds / 60);
    const seconds = run.durationSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  if (run.createdAt && run.updatedAt) {
    const start = new Date(run.createdAt).getTime();
    const end = new Date(run.updatedAt).getTime();

    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      const totalSeconds = Math.round((end - start) / 1000);
      if (totalSeconds < 60) return `${totalSeconds}s`;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}s`;
    }
  }

  return "N/A";
}

function getRunStatus(run: WorkflowRun) {
  const displayStatus = String(run.displayStatus || "").toUpperCase();

  if (displayStatus === "SUCCESS") return "SUCCESS";
  if (displayStatus === "FAILED") return "FAILED";
  if (displayStatus === "CANCELLED") return "CANCELLED";
  if (displayStatus === "IN_PROGRESS" || displayStatus === "QUEUED") {
    return "IN_PROGRESS";
  }

  if (run.status === "in_progress" || run.status === "queued") {
    return "IN_PROGRESS";
  }

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

  return String(run.status || "UNKNOWN").toUpperCase();
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

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}) {
  const visibleEnd = Math.min(endIndex, totalItems);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 border-t border-zinc-800 pt-4">
      <p className="text-sm text-zinc-400">
        Showing {startIndex + 1}-{visibleEnd} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 disabled:opacity-40"
        >
          First
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 disabled:opacity-40"
        >
          Previous
        </button>

        <span className="px-3 py-2 text-sm text-zinc-300">
          Page {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 disabled:opacity-40"
        >
          Next
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 disabled:opacity-40"
        >
          Last
        </button>
      </div>
    </div>
  );
}

export default PipelinePage;
