import { useEffect, useMemo, useState } from "react";

type Vulnerability = {
  image: string;
  target: string;
  type: string;
  vulnerabilityId: string;
  severity: string;
  packageName: string;
  installedVersion: string;
  fixedVersion: string;
  title: string;
  description: string;
  primaryUrl: string;
  publishedDate: string;
  lastModifiedDate: string;
};

type TrivyDetailsData = {
  total: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  vulnerabilities: Vulnerability[];
};

const TrivyPage = () => {
  const [data, setData] = useState<TrivyDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [imageFilter, setImageFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/trivy-vulnerabilities")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Trivy vulnerability details:", error);
        setLoading(false);
      });
  }, []);

  const filteredVulnerabilities = useMemo(() => {
    if (!data) return [];

    return data.vulnerabilities.filter((vuln) => {
      const matchesSeverity =
        severityFilter === "ALL" || vuln.severity === severityFilter;

      const matchesImage =
        imageFilter === "ALL" || vuln.image.includes(imageFilter);

      const searchText = search.toLowerCase();

      const matchesSearch =
        vuln.vulnerabilityId.toLowerCase().includes(searchText) ||
        vuln.packageName.toLowerCase().includes(searchText) ||
        vuln.title.toLowerCase().includes(searchText) ||
        vuln.image.toLowerCase().includes(searchText);

      return matchesSeverity && matchesImage && matchesSearch;
    });
  }, [data, severityFilter, imageFilter, search]);

  if (loading) {
    return <div className="p-6 text-white">Loading Trivy CVE details...</div>;
  }

  if (!data) {
    return (
      <div className="p-6 text-red-400">
        Failed to load Trivy vulnerability details.
      </div>
    );
  }

  const securityStatus =
    data.summary.critical > 0
      ? "Critical Risk"
      : data.summary.high > 0
      ? "High Risk"
      : data.total > 0
      ? "Review Required"
      : "Healthy";

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trivy Security</h1>
        <p className="text-sm text-zinc-400 mt-2">
          CVE-level Docker image vulnerability report from cached Trivy scans.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-2">Security Status</h2>

        <p
          className={`text-3xl font-bold ${
            securityStatus === "Healthy"
              ? "text-green-400"
              : securityStatus === "Review Required"
              ? "text-yellow-400"
              : securityStatus === "High Risk"
              ? "text-orange-400"
              : "text-red-400"
          }`}
        >
          {securityStatus}
        </p>

        <p className="text-sm text-zinc-400 mt-2">
          Total vulnerabilities detected: {data.total}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Critical" value={data.summary.critical} color="text-red-400" />
        <SummaryCard title="High" value={data.summary.high} color="text-orange-400" />
        <SummaryCard title="Medium" value={data.summary.medium} color="text-yellow-400" />
        <SummaryCard title="Low" value={data.summary.low} color="text-blue-400" />
        <SummaryCard title="Unknown" value={data.summary.unknown} color="text-zinc-400" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-semibold">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

          <select
            value={imageFilter}
            onChange={(e) => setImageFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Images</option>
            <option value="frontend">Frontend Image</option>
            <option value="backend">Backend Image</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CVE, package, title..."
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">
          CVE Details ({filteredVulnerabilities.length})
        </h2>

        {filteredVulnerabilities.length === 0 ? (
          <p className="text-zinc-400">
            No vulnerabilities found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-300">
                  <th className="text-left p-3 border border-zinc-800">CVE ID</th>
                  <th className="text-left p-3 border border-zinc-800">Severity</th>
                  <th className="text-left p-3 border border-zinc-800">Package</th>
                  <th className="text-left p-3 border border-zinc-800">Installed</th>
                  <th className="text-left p-3 border border-zinc-800">Fixed</th>
                  <th className="text-left p-3 border border-zinc-800">Image</th>
                  <th className="text-left p-3 border border-zinc-800">Title</th>
                  <th className="text-left p-3 border border-zinc-800">Link</th>
                </tr>
              </thead>

              <tbody>
                {filteredVulnerabilities.map((vuln, index) => (
                  <tr key={`${vuln.vulnerabilityId}-${index}`} className="hover:bg-zinc-950">
                    <td className="p-3 border border-zinc-800 font-semibold">
                      {vuln.vulnerabilityId}
                    </td>

                    <td className="p-3 border border-zinc-800">
                      <span className={getSeverityClass(vuln.severity)}>
                        {vuln.severity}
                      </span>
                    </td>

                    <td className="p-3 border border-zinc-800">{vuln.packageName}</td>
                    <td className="p-3 border border-zinc-800">{vuln.installedVersion}</td>
                    <td className="p-3 border border-zinc-800">{vuln.fixedVersion}</td>

                    <td className="p-3 border border-zinc-800 text-xs max-w-[220px] break-words">
                      {vuln.image}
                    </td>

                    <td className="p-3 border border-zinc-800 max-w-[360px]">
                      {vuln.title}
                    </td>

                    <td className="p-3 border border-zinc-800">
                      {vuln.primaryUrl ? (
                        <a
                          href={vuln.primaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-3">Recommended Action</h2>

        <p className="text-sm text-zinc-300 leading-6">
          Review all Critical and High vulnerabilities first. For each vulnerable package,
          check the fixed version, update the base image or dependency, rebuild the Docker
          image, rerun Trivy scan, and redeploy only after the risk is reduced.
        </p>
      </div>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  color
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm text-zinc-400">{title}</h3>
      <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function getSeverityClass(severity: string) {
  if (severity === "CRITICAL") return "text-red-400 font-bold";
  if (severity === "HIGH") return "text-orange-400 font-bold";
  if (severity === "MEDIUM") return "text-yellow-400 font-bold";
  if (severity === "LOW") return "text-blue-400 font-bold";
  return "text-zinc-400 font-bold";
}

export default TrivyPage;
