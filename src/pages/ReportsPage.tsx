import { useEffect, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 10;

type Report = {
  fileName: string;
  downloadUrl: string;
  fullDownloadUrl: string;
  generatedAt: string;
  generatedAtLocal: string;
  lastModifiedAt: string;
  sizeKB: number;
  emailSender: string;
  emailRecipient: string;
  deliveryStatus: string;
  reportType: string;
};

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchReports = () => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch reports:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deliveryFilter, typeFilter, sortOrder]);

  const reportTypes = useMemo(() => {
    const uniqueTypes = new Set(
      reports
        .map((report) => report.reportType)
        .filter((type): type is string => Boolean(type))
    );

    return Array.from(uniqueTypes).sort();
  }, [reports]);

  const deliveryStatuses = useMemo(() => {
    const uniqueStatuses = new Set(
      reports
        .map((report) => normalizeDeliveryStatus(report.deliveryStatus))
        .filter(Boolean)
    );

    return Array.from(uniqueStatuses).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      const deliveryStatus = normalizeDeliveryStatus(report.deliveryStatus);
      const reportType = report.reportType || "Unknown";

      const deliveryMatches =
        deliveryFilter === "ALL" || deliveryStatus === deliveryFilter;

      const typeMatches = typeFilter === "ALL" || reportType === typeFilter;

      const searchableText = [
        report.fileName,
        report.reportType,
        report.deliveryStatus,
        report.emailSender,
        report.emailRecipient,
        report.generatedAtLocal,
        report.lastModifiedAt,
        report.sizeKB
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches = !query || searchableText.includes(query);

      return deliveryMatches && typeMatches && searchMatches;
    });

    return filtered.sort((a, b) => {
      const aTime = getReportTime(a);
      const bTime = getReportTime(b);

      if (sortOrder === "OLDEST") return aTime - bTime;
      if (sortOrder === "SIZE_DESC") return Number(b.sizeKB || 0) - Number(a.sizeKB || 0);
      if (sortOrder === "SIZE_ASC") return Number(a.sizeKB || 0) - Number(b.sizeKB || 0);

      return bTime - aTime;
    });
  }, [reports, searchTerm, deliveryFilter, typeFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const totalSizeKb = filteredReports.reduce(
    (total, report) => total + Number(report.sizeKB || 0),
    0
  );

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const response = await fetch("/api/generate-report");

      if (!response.ok) {
        throw new Error(`Generate failed with status ${response.status}`);
      }

      fetchReports();
      alert("PDF report generated successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF report.");
    } finally {
      setGenerating(false);
    }
  };

  const generateAndEmailPdf = async () => {
    setEmailing(true);

    try {
      const response = await fetch("/api/generate-and-email-report");

      if (!response.ok) {
        throw new Error(`Generate and email failed with status ${response.status}`);
      }

      fetchReports();
      alert("PDF report generated and email sending started.");
    } catch (error) {
      console.error(error);
      alert("Failed to generate and email PDF report.");
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading PDF reports...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">PDF Reports</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Generated infrastructure PDF reports with delivery details.
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Last refreshed: {lastUpdated || "N/A"}
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Refresh Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Reports" value={String(reports.length)} />
        <SummaryCard title="Filtered Reports" value={String(filteredReports.length)} />
        <SummaryCard title="Total Size" value={`${totalSizeKb.toFixed(2)} KB`} />
        <SummaryCard title="Page Size" value={`${ITEMS_PER_PAGE} / page`} />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={generatePdf}
          disabled={generating || emailing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-5 py-3 rounded-lg font-semibold"
        >
          {generating ? "Generating..." : "Generate PDF"}
        </button>

        <button
          onClick={generateAndEmailPdf}
          disabled={generating || emailing}
          className="bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 px-5 py-3 rounded-lg font-semibold"
        >
          {emailing ? "Generating & Emailing..." : "Generate & Email PDF"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Generated Reports</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Showing {paginatedReports.length} of {filteredReports.length} filtered reports.
              Page {safeCurrentPage} of {totalPages}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reports..."
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white min-w-[220px]"
            />

            <select
              value={deliveryFilter}
              onChange={(event) => setDeliveryFilter(event.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="ALL">All Delivery</option>
              {deliveryStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="ALL">All Types</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="SIZE_DESC">Largest First</option>
              <option value="SIZE_ASC">Smallest First</option>
            </select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <p className="text-zinc-400">No PDF reports found for this filter.</p>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedReports.map((report) => (
                <div
                  key={report.fileName}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold break-all">
                            {report.fileName}
                          </h3>
                          <DeliveryBadge status={report.deliveryStatus} />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {report.reportType || "Unknown Report Type"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                        <Info label="Generated At" value={report.generatedAtLocal || "N/A"} />
                        <Info label="File Size" value={`${Number(report.sizeKB || 0).toFixed(2)} KB`} />
                        <Info label="Email From" value={report.emailSender || "N/A"} />
                        <Info label="Email To" value={report.emailRecipient || "N/A"} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <Info
                          label="Delivery Status"
                          value={report.deliveryStatus || "N/A"}
                        />
                        <Info
                          label="Last Modified"
                          value={
                            report.lastModifiedAt
                              ? new Date(report.lastModifiedAt).toLocaleString()
                              : "N/A"
                          }
                        />
                      </div>
                    </div>

                    <a
                      href={report.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-lg font-semibold text-center whitespace-nowrap"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredReports.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-3">Report Delivery Notes</h2>

        <div className="space-y-2 text-sm text-zinc-300">
          <p>
            The generated time is taken from the actual PDF file creation time on the server.
          </p>
          <p>
            Email sender and recipient are loaded from the backend environment variables.
          </p>
          <p>
            Old reports may show the current configured recipient because older PDF files did not store separate delivery metadata.
          </p>
        </div>
      </div>
    </div>
  );
};

function getReportTime(report: Report) {
  const value = report.lastModifiedAt || report.generatedAt || report.generatedAtLocal;
  const time = new Date(value || "").getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeDeliveryStatus(status?: string) {
  if (!status || status.trim() === "") return "Unknown";
  return status.trim();
}

function DeliveryBadge({ status }: { status: string }) {
  const normalized = normalizeDeliveryStatus(status);
  const lower = normalized.toLowerCase();

  const badgeClass =
    lower.includes("sent") || lower.includes("delivered") || lower.includes("success")
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : lower.includes("failed") || lower.includes("error")
      ? "bg-red-500/10 border-red-500/30 text-red-400"
      : lower.includes("pending") || lower.includes("started")
      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
      : "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";

  return (
    <span className={`border rounded-lg px-3 py-1 text-xs font-semibold ${badgeClass}`}>
      {normalized}
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
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

export default ReportsPage;
