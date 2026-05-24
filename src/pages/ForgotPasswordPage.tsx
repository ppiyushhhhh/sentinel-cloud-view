import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft, MailCheck } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Backend endpoint to be implemented manually later.
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed })
      }).catch(() => {
        // Silent fail – backend may not be wired up yet.
      });

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              {submitted ? (
                <MailCheck className="h-7 w-7 text-green-400" />
              ) : (
                <KeyRound className="h-7 w-7 text-green-400" />
              )}
            </div>

            <h2 className="text-3xl font-bold">
              {submitted ? "Check your email" : "Forgot Password"}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {submitted
                ? "If an account exists for that email, a password reset link has been sent."
                : "Enter your account email and we'll send you a reset link."}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-zinc-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-green-500"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  maxLength={255}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-500 px-4 py-3 font-bold text-black hover:bg-green-400 transition disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
              <p className="font-semibold text-zinc-300">What's next?</p>
              <p className="mt-1">
                Open the email and click the secure link to set a new password.
                The link expires in 30 minutes.
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-green-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          CloudOps Sentinel · DevOps Monitoring Dashboard
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
