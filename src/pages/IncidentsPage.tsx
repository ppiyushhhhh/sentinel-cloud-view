import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useMemo, useState } from "react";

type Incident = {
  id: number;
  incident_number: string;
  title: string;
  severity: string;
  status: string;
  source: string;
  description: string;
  root_cause: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const ITEMS_PER_PAGE = 10;

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("SEV3");
  const [source, setSource] = useState("Manual");
  const [description, setDescription] = useState("");

  const fetchIncidents = async () => {
    try {
      setLoading(true);

      const response = await authFetch("/api/incidents");
      const data = await response.json();

      setIncidents(Array.isArray(data.incidents) ? data.incidents : []);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, severityFilter, searchTerm]);

  const filteredIncidents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return incidents.filter((incident) => {
      const statusMatches =
        statusFilter === "ALL" || incident.status === statusFilter;

      const severityMatches =
        severityFilter === "ALL" || incident.severity === severityFilter;

      const searchableText = [
        incident.incident_number,
        incident.title,
        incident.severity,
        incident.status,
        incident.source,
        incident.description,
        incident.root_cause,
        incident.resolution
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches = !query || searchableText.includes(query);

      return statusMatches && severityMatches && searchMatches;
    });
  }, [incidents, statusFilter, severityFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedIncidents = filteredIncidents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const openCount = incidents.filter((incident) => incident.status === "open").length;
  const resolvedCount = incidents.filter((incident) => incident.status === "resolved").length;
  const criticalCount = incidents.filter(
    (incident) => incident.severity === "SEV1" || incident.severity === "SEV2"
  ).length;

  const createIncident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Incident title is required.");
      return;
    }

    try {
      setCreating(true);

      const response = await authFetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          severity,
          source,
          description
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create incident.");
      }

      setTitle("");
      setSeverity("SEV3");
      setSource("Manual");
      setDescription("");

      await fetchIncidents();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create incident.");
    } finally {
      setCreating(false);
    }
  };

  const resolveIncident = async (incident: Incident) => {
    const rootCause = window.prompt("Enter root cause:", incident.root_cause || "");
    if (rootCause === null) return;

    const resolution = window.prompt("Enter resolution:", incident.resolution || "");
    if (resolution === null) return;

    try {
      const response = await authFetch(`/api/incidents/${incident.id}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rootCause,
          resolution
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to resolve incident.");
      }

      await fetchIncidents();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to resolve incident.");
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading incidents...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incident Management</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Track infrastructure incidents, root causes, and resolutions using SQLite persistence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Incidents" value={String(incidents.length)} />
        <SummaryCard title="Open" value={String(openCount)} />
        <SummaryCard title="Resolved" value={String(resolvedCount)} />
        <SummaryCard title="Critical / High" value={String(criticalCount)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Create Incident</h2>

        <form onSubmit={createIncident} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Example: Backend API latency spike"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Severity</label>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              >
                <option value="SEV1">SEV1 - Critical</option>
                <option value="SEV2">SEV2 - High</option>
                <option value="SEV3">SEV3 - Medium</option>
                <option value="SEV4">SEV4 - Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-400">Source</label>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
                placeholder="Manual / Alert / Trivy / Server Monitor"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white min-h-[90px]"
              placeholder="Describe what happened, affected services, and initial observations."
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-5 py-2 font-semibold"
          >
            {creating ? "Creating..." : "Create Incident"}
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Incident History</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Showing {paginatedIncidents.length} of {filteredIncidents.length} filtered incidents.
              Page {safePage} of {totalPages}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
              placeholder="Search incidents..."
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="ALL">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="ALL">All Severity</option>
              <option value="SEV1">SEV1</option>
              <option value="SEV2">SEV2</option>
              <option value="SEV3">SEV3</option>
              <option value="SEV4">SEV4</option>
            </select>
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <p className="text-zinc-400">No incidents found.</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">
                          {incident.incident_number}
                        </h3>
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>

                      <div>
                        <p className="font-semibold">{incident.title}</p>
                        <p className="text-sm text-zinc-400 mt-1">
                          {incident.description || "No description provided."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <Info label="Source" value={incident.source || "N/A"} />
                        <Info label="Created" value={formatDate(incident.created_at)} />
                        <Info label="Resolved" value={formatDate(incident.resolved_at)} />
                      </div>

                      {(incident.root_cause || incident.resolution) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <Info label="Root Cause" value={incident.root_cause || "N/A"} />
                          <Info label="Resolution" value={incident.resolution || "N/A"} />
                        </div>
                      )}
                    </div>

                    {incident.status !== "resolved" && (
                      <button
                        onClick={() => resolveIncident(incident)}
                        className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredIncidents.length}
              startIndex={startIndex}
              onPageChange={setCurrentPage}
            />
          </>
        )}
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

function SeverityBadge({ severity }: { severity: string }) {
  const color =
    severity === "SEV1"
      ? "bg-red-500/10 border-red-500/30 text-red-400"
      : severity === "SEV2"
      ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
      : severity === "SEV3"
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";

  return (
    <span className={`border rounded-lg px-3 py-1 text-xs font-semibold ${color}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "resolved"
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : "bg-blue-500/10 border-blue-500/30 text-blue-400";

  return (
    <span className={`border rounded-lg px-3 py-1 text-xs font-semibold ${color}`}>
      {status.toUpperCase()}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
}) {
  const end = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 border-t border-zinc-800 pt-4">
      <p className="text-sm text-zinc-400">
        Showing {startIndex + 1}-{end} of {totalItems}
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

export default IncidentsPage;
