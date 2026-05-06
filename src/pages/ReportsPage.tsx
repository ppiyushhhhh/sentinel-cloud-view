import { useEffect, useState } from "react";

type ReportItem = {
  fileName: string;
  fullDownloadUrl: string;
};

const ReportsPage = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = () => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reverse());
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

  const generateReport = async () => {
    setGenerating(true);
    await fetch("/api/generate-report");
    fetchReports();
    setGenerating(false);
  };

  const generateAndEmailReport = async () => {
    setGenerating(true);
    await fetch("/api/generate-and-email-report");
    fetchReports();
    setGenerating(false);
  };

  if (loading) return <div className="p-6 text-white">Loading reports...</div>;

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PDF Reports</h1>
        <p className="text-sm text-zinc-400 mt-2">Generated infrastructure PDF reports.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={generateReport} disabled={generating} className="bg-blue-600 px-4 py-2 rounded-lg font-semibold">
          {generating ? "Generating..." : "Generate PDF"}
        </button>

        <button onClick={generateAndEmailReport} disabled={generating} className="bg-green-600 px-4 py-2 rounded-lg font-semibold">
          {generating ? "Sending..." : "Generate & Email PDF"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>

        {reports.length === 0 ? (
          <p className="text-zinc-400">No reports found.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="font-semibold break-all">{report.fileName}</p>
                <a href={report.fullDownloadUrl || `/api/reports/${report.fileName}`} target="_blank" rel="noreferrer" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold text-center">
                  Download PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
