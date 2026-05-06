const SettingsPage = () => {
  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400 mt-2">
          CloudOps Sentinel monitoring and automation configuration.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Current Automation Setup</h2>

        <div className="space-y-3 text-sm">
          <p><span className="text-zinc-400">Daily PDF Report:</span> 7:00 AM and 7:00 PM</p>
          <p><span className="text-zinc-400">Alert Check:</span> Every 5 minutes</p>
          <p><span className="text-zinc-400">Disk Alert Threshold:</span> 60%</p>
          <p><span className="text-zinc-400">Memory Alert Threshold:</span> 80%</p>
          <p><span className="text-zinc-400">CPU Alert Threshold:</span> 80%</p>
          <p><span className="text-zinc-400">Trivy Scan:</span> Cached scan from backend/trivy-cache</p>
          <p><span className="text-zinc-400">Backend Runtime:</span> PM2</p>
          <p><span className="text-zinc-400">Frontend Serving:</span> Nginx</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Production Notes</h2>

        <div className="space-y-3 text-sm text-zinc-300">
          <p>The frontend is served through Nginx on port 80.</p>
          <p>The backend runs internally on port 5000 and is exposed through the /api reverse proxy.</p>
          <p>Public access should be limited to SSH, HTTP, and later HTTPS after domain SSL setup.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
