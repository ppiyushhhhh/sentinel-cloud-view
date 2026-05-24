import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Server, Activity } from "lucide-react";
import { login } from "@/lib/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login(username.trim(), password);

      const redirectTo =
        (location.state as { from?: string } | null)?.from || "/";

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid username or password.");
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-green-400 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Secure DevOps Monitoring
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-tight">
              CloudOps Sentinel
            </h1>

            <p className="mt-4 text-lg text-zinc-400 max-w-xl">
              Login to access live infrastructure monitoring, CI/CD deployment history,
              Trivy security scans, PDF reports, alerts, and server cleanup tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Server className="h-5 w-5" />}
              title="Live Server"
              description="CPU, memory, disk, uptime"
            />

            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="CI/CD"
              description="GitHub Actions tracking"
            />

            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Security"
              description="Trivy and alerts"
            />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <Lock className="h-7 w-7 text-green-400" />
              </div>

              <h2 className="text-3xl font-bold">Admin Login</h2>

              <p className="mt-2 text-sm text-zinc-400">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-zinc-300">Username</label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-green-400 hover:text-green-300 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-green-500 px-4 py-3 font-bold text-black hover:bg-green-400 transition"
              >
                Login to Dashboard
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
              <p className="font-semibold text-zinc-300">Protected Access</p>
              <p className="mt-1">Login is verified by the backend JWT authentication API.</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            CloudOps Sentinel · DevOps Monitoring Dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="mb-3 text-green-400">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}

export default LoginPage;
