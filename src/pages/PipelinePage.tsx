const PipelinePage = () => {
  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CI/CD Pipeline</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Deployment automation status for CloudOps Sentinel.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Current Pipeline Status</h2>

        <div className="space-y-3 text-sm">
          <p>
            <span className="text-zinc-400">Status:</span>{" "}
            <span className="text-green-400 font-semibold">CI/CD Configured</span>
          </p>

          <p>
            <span className="text-zinc-400">Source Code:</span>{" "}
            GitHub Repository
          </p>

          <p>
            <span className="text-zinc-400">Trigger:</span>{" "}
            Push to main branch
          </p>

          <p>
            <span className="text-zinc-400">Deployment Target:</span>{" "}
            AWS EC2
          </p>

          <p>
            <span className="text-zinc-400">Frontend Deployment:</span>{" "}
            React/Vite build copied to Nginx web root
          </p>

          <p>
            <span className="text-zinc-400">Backend Deployment:</span>{" "}
            Node.js/Express restarted using PM2
          </p>

          <p>
            <span className="text-zinc-400">Web Server:</span>{" "}
            Nginx reverse proxy
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Active Deployment Flow</h2>

        <div className="space-y-3 text-sm">
          <p>1. Code is pushed to the GitHub main branch</p>
          <p>2. GitHub Actions workflow starts automatically</p>
          <p>3. GitHub Actions connects to EC2 using SSH</p>
          <p>4. EC2 pulls the latest code from GitHub</p>
          <p>5. Frontend dependencies are installed</p>
          <p>6. Frontend production build is generated</p>
          <p>7. Build files are copied to /var/www/cloudops-sentinel</p>
          <p>8. Backend dependencies are installed</p>
          <p>9. PM2 restarts the backend API</p>
          <p>10. Nginx configuration is tested and restarted</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4">Recommended Next Upgrade</h2>

        <p className="text-sm text-zinc-300 leading-6">
          Add Trivy scanning inside GitHub Actions so the pipeline checks Docker
          image vulnerabilities before production deployment. You can also add
          build status data later by integrating the GitHub Actions API.
        </p>
      </div>
    </div>
  );
};

export default PipelinePage;
