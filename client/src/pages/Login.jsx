import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

const INPUT =
  "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

const Logo = ({ dark = false }) => (
  <span className="inline-flex items-center gap-2.5">
    <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
      M
    </span>
    <span
      className={`text-lg font-semibold tracking-tight ${
        dark ? "text-white" : "text-slate-900"
      }`}
    >
      Mini Jira
    </span>
  </span>
);

const EyeIcon = ({ off }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path
      d="M1.8 10S4.7 4.5 10 4.5 18.2 10 18.2 10 15.3 15.5 10 15.5 1.8 10 1.8 10Z"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="10" r="2.4" />
    {off && <path d="M3.5 16.5 16.5 3.5" strokeLinecap="round" />}
  </svg>
);

const AlertIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-5 h-5 shrink-0 mt-px"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6v4.5M10 13.5v.01" strokeLinecap="round" />
  </svg>
);

/** Decorative sample of the product: a workload bar plus a few tickets. */
const BoardPreview = () => {
  const segments = [
    { width: "22%", color: "bg-slate-500" },
    { width: "34%", color: "bg-indigo-400" },
    { width: "14%", color: "bg-amber-400" },
    { width: "30%", color: "bg-emerald-400" },
  ];

  const rows = [
    {
      key: "WEB-42",
      title: "Fix checkout redirect loop",
      status: "In progress",
      pill: "bg-indigo-400/15 text-indigo-200 ring-indigo-300/30",
    },
    {
      key: "WEB-45",
      title: "Add password reset email",
      status: "In review",
      pill: "bg-amber-400/15 text-amber-200 ring-amber-300/30",
    },
    {
      key: "WEB-38",
      title: "Update onboarding copy",
      status: "Done",
      pill: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-white/4 ring-1 ring-white/10 p-5"
    >
      <div className="flex h-2.5 gap-0.5 rounded-full overflow-hidden">
        {segments.map((s) => (
          <div
            key={s.color}
            className={s.color}
            style={{ width: s.width }}
          />
        ))}
      </div>

      <ul className="mt-5 divide-y divide-white/10">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-indigo-300">{row.key}</p>
              <p className="text-sm text-slate-200 truncate mt-0.5">
                {row.title}
              </p>
            </div>

            <span
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${row.pill}`}
            >
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-slate-50">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex flex-col justify-between bg-slate-900 px-12 xl:px-16 py-12">
        <Link
          to="/login"
          className={`self-start rounded-lg ${FOCUS} focus-visible:ring-offset-slate-900`}
        >
          <Logo dark />
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-tight">
            Every ticket, from to do to done.
          </h2>

          <p className="text-slate-400 mt-4 leading-relaxed">
            Plan projects, assign work and see what your team is building
            without the clutter.
          </p>

          <div className="mt-10">
            <BoardPreview />
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Simple project and ticket management.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-4 sm:px-8 py-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <Link
            to="/login"
            className={`lg:hidden inline-flex mb-10 rounded-lg ${FOCUS}`}
          >
            <Logo />
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="text-slate-500 mt-2">
            Sign in to continue to your workspace.
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
            >
              <AlertIcon />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                required
                className={INPUT}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  required
                  className={`${INPUT} pr-11`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className={`absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700 rounded-lg transition-colors ${FOCUS}`}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;