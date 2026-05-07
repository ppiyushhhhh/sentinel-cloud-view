import { useEffect, useState } from "react";

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

  const fetchReports = () => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
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

  const generatePdf = async () => {
    setGenerating(true);

    try {
      await fetch("/api/generate-report");
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
      await fetch("/api/generate-and-email-report");
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
      <div>
        <h1 className="text-3xl font-bold">PDF Reports</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Generated infrastructure PDF reports with delivery details.
        </p>
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
        <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>

        {reports.length === 0 ? (
          <p className="text-zinc-400">No PDF reports generated yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.fileName}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-5"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-lg font-bold break-all">
                        {report.fileName}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {report.reportType}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                      <Info label="Generated At" value={report.generatedAtLocal} />
                      <Info label="File Size" value={`${report.sizeKB} KB`} />
                      <Info label="Email From" value={report.emailSender} />
                      <Info label="Email To" value={report.emailRecipient} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <Info
                        label="Delivery Status"
                        value={report.deliveryStatus}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="font-semibold break-words">{value || "N/A"}</p>
    </div>
  );
}

export default ReportsPage;
