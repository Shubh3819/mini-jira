import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { getTickets } from "../services/ticketService";

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

// Full class strings on purpose, so Tailwind's JIT can see them.
const STATUSES = [
  {
    key: "TODO",
    label: "To do",
    bar: "bg-slate-300",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    key: "IN_PROGRESS",
    label: "In progress",
    bar: "bg-indigo-500",
    dot: "bg-indigo-500",
    pill: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    key: "IN_REVIEW",
    label: "In review",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    key: "DONE",
    label: "Done",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
];

const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const PRIORITIES = {
  HIGH: { label: "High", level: 3, color: "bg-red-500", text: "text-red-700" },
  MEDIUM: {
    label: "Medium",
    level: 2,
    color: "bg-amber-500",
    text: "text-amber-700",
  },
  LOW: { label: "Low", level: 1, color: "bg-sky-500", text: "text-sky-700" },
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const FolderIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path
      d="M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h3.2l1.6 1.8H16a1.5 1.5 0 0 1 1.5 1.5v7.7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z"
      strokeLinejoin="round"
    />
  </svg>
);

const FlagIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path
      d="M5 17V3.5m0 0h9l-1.8 3.2L14 10H5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TicketIcon = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V8a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5V12a2 2 0 0 0 0-4V6.5Z"
      strokeLinejoin="round"
    />
    <path d="M12 5v10" strokeDasharray="1.5 2" />
  </svg>
);

/** Three little bars that fill up with priority, easier to scan than a word. */
const PriorityMark = ({ priority }) => {
  const config = PRIORITIES[priority] || PRIORITIES.LOW;

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${config.text}`}
    >
      <span className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            style={{ height: `${bar * 33}%` }}
            className={`w-1 rounded-sm ${
              bar <= config.level ? config.color : "bg-slate-200"
            }`}
          />
        ))}
      </span>
      {config.label}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const config = STATUS_BY_KEY[status] || STATUS_BY_KEY.TODO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${config.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const SkeletonBlock = ({ className = "" }) => (
  <div className={`bg-slate-200/70 rounded-lg animate-pulse ${className}`} />
);

const DashboardSkeleton = () => (
  <div aria-busy="true" aria-label="Loading dashboard">
    <SkeletonBlock className="h-4 w-40" />
    <SkeletonBlock className="h-9 w-72 mt-3" />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
      <SkeletonBlock className="h-56 lg:col-span-2 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        <SkeletonBlock className="h-26 rounded-2xl" />
        <SkeletonBlock className="h-26 rounded-2xl" />
      </div>
    </div>

    <SkeletonBlock className="h-72 mt-8 rounded-2xl" />
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [projectData, ticketData] = await Promise.all([
        getProjects(),
        getTickets(),
      ]);

      setProjects(projectData.projects || []);
      setTickets(ticketData.tickets || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ------------------------------ Derived data ----------------------------- */

  const totalTickets = tickets.length;

  const countByStatus = useMemo(() => {
    const counts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) counts[ticket.status] += 1;
    });
    return counts;
  }, [tickets]);

  const highPriorityTickets = tickets.filter(
    (ticket) => ticket.priority === "HIGH",
  ).length;

  const openHighPriority = tickets.filter(
    (ticket) => ticket.priority === "HIGH" && ticket.status !== "DONE",
  ).length;

  const completionRate =
    totalTickets > 0
      ? Math.round((countByStatus.DONE / totalTickets) * 100)
      : 0;

  // Newest first when the API sends createdAt, otherwise keeps API order.
  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [tickets],
  );

  const firstName = user?.name?.split(" ")[0];

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-8 h-full">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2.5 rounded-lg ${FOCUS}`}
              >
                <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  Mini Jira
                </span>
              </Link>

              <div className="flex items-center gap-1 h-full">
                {[
                  { to: "/dashboard", label: "Dashboard" },
                  { to: "/projects", label: "Projects" },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative h-full px-3 flex items-center text-sm font-medium transition-colors ${FOCUS} ${
                        isActive
                          ? "text-indigo-700 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-indigo-600 after:rounded-full"
                          : "text-slate-500 hover:text-slate-900"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right leading-tight">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">
                  {user?.role || "Member"}
                </p>
              </div>

              <div
                className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold"
                aria-hidden="true"
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>

              <button
                onClick={logout}
                className={`px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors ${FOCUS}`}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {getGreeting()}
                  {firstName ? `, ${firstName}` : ""}
                </h1>

                <p className="text-slate-500 mt-1.5">
                  {totalTickets === 0
                    ? "Nothing on your board yet."
                    : openHighPriority > 0
                      ? `${openHighPriority} high priority ${
                          openHighPriority === 1
                            ? "ticket needs"
                            : "tickets need"
                        } your attention.`
                      : "All high priority tickets are currently resolved."}
                </p>
              </div>

              <Link
                to="/projects"
                className={`inline-flex items-center justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors ${FOCUS}`}
              >
                Open projects
              </Link>
            </header>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 flex items-center justify-between gap-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
              >
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={loadDashboard}
                  className={`text-sm font-medium underline underline-offset-2 hover:text-red-900 rounded ${FOCUS}`}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Workload + side stats */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
              {/* Workload: the one memorable element */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Workload</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Where your tickets are right now
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-semibold tabular-nums leading-none">
                      {completionRate}%
                    </p>
                    <p className="text-sm text-slate-500 mt-1">done</p>
                  </div>
                </div>

                {/* Segmented bar */}
                <div
                  className="flex h-3 gap-0.5 mt-6 rounded-full overflow-hidden bg-slate-100"
                  role="img"
                  aria-label={STATUSES.map(
                    (s) => `${countByStatus[s.key]} ${s.label}`,
                  ).join(", ")}
                >
                  {totalTickets > 0 &&
                    STATUSES.filter((s) => countByStatus[s.key] > 0).map(
                      (s) => (
                        <div
                          key={s.key}
                          className={`${s.bar} transition-all duration-700 ease-out`}
                          style={{
                            width: `${(countByStatus[s.key] / totalTickets) * 100}%`,
                          }}
                        />
                      ),
                    )}
                </div>

                {/* Legend */}
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 mt-6">
                  {STATUSES.map((s) => (
                    <div key={s.key}>
                      <dt className="flex items-center gap-2 text-sm text-slate-500">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </dt>
                      <dd className="text-2xl font-semibold tabular-nums mt-1">
                        {countByStatus[s.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Side stats */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <Link
                  to="/projects"
                  className={`group flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-colors ${FOCUS}`}
                >
                  <div>
                    <p className="text-sm text-slate-500">Projects</p>
                    <p className="text-3xl font-semibold tabular-nums mt-1">
                      {projects.length}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <FolderIcon />
                  </span>
                </Link>

                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5">
                  <div>
                    <p className="text-sm text-slate-500">High priority</p>
                    <p className="text-3xl font-semibold tabular-nums mt-1">
                      {highPriorityTickets}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <FlagIcon />
                  </span>
                </div>
              </div>
            </section>

            {/* Recent tickets */}
            <section className="mt-10">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold">Recent tickets</h2>

                {totalTickets > 0 && (
                  <p className="text-sm text-slate-500">
                    Showing {recentTickets.length} of {totalTickets}
                  </p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {tickets.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <span className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      <TicketIcon className="w-6 h-6" />
                    </span>

                    <h3 className="font-semibold mt-4">No tickets yet</h3>

                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      Tickets you create inside a project will show up here.
                    </p>

                    <Link
                      to="/projects"
                      className={`inline-flex mt-5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors ${FOCUS}`}
                    >
                      Pick a project
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {recentTickets.map((ticket) => (
                      <li key={ticket._id}>
                        <Link
                          to={`/tickets/${ticket._id}`}
                          className={`grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center gap-x-8 gap-y-3 px-5 py-4 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-medium text-indigo-600">
                                {ticket.ticketKey}
                              </span>

                              {ticket.type && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {ticket.type}
                                </span>
                              )}

                              <span className="text-slate-500 truncate">
                                {ticket.project?.name || "Unknown project"}
                              </span>
                            </div>

                            <h3 className="font-medium mt-1 truncate">
                              {ticket.title}
                            </h3>
                          </div>

                          <div className="md:w-28">
                            <PriorityMark priority={ticket.priority} />
                          </div>

                          <div className="md:w-32 md:flex md:justify-end">
                            <StatusPill status={ticket.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
