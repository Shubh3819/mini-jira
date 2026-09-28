import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getProjectById,
  getProjectMembers,
  updateProject,
  deleteProject,
} from "../services/projectService";

import { getTickets, createTicket } from "../services/ticketService";

/* -------------------------------------------------------------------------- */
/*  Design tokens (same as Dashboard and Login)                               */
/* -------------------------------------------------------------------------- */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

const INPUT =
  "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const BTN =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const BTN_PRIMARY = `${BTN} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 ${FOCUS}`;
const BTN_SECONDARY = `${BTN} bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 ${FOCUS}`;
const BTN_DANGER_GHOST = `${BTN} text-red-600 border border-transparent hover:bg-red-50 ${FOCUS}`;
const BTN_DANGER = `${BTN} bg-red-600 text-white shadow-sm hover:bg-red-700 ${FOCUS}`;

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

const TYPES = {
  TASK: { label: "Task", dot: "bg-sky-500" },
  BUG: { label: "Bug", dot: "bg-red-500" },
  STORY: { label: "Story", dot: "bg-emerald-500" },
};

const formatType = (type) =>
  type ? type.charAt(0) + type.slice(1).toLowerCase() : "";

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

const PlusIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-4 h-4 text-slate-300"
    aria-hidden="true"
  >
    <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FlagIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path
      d="M5 17V3.5m0 0h9l-1.8 3.2L14 10H5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TicketIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path
      d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V8a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5V12a2 2 0 0 0 0-4V6.5Z"
      strokeLinejoin="round"
    />
    <path d="M12 5v10" strokeDasharray="1.5 2" />
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

const ErrorNote = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl"
  >
    <AlertIcon />
    <p className="text-sm font-medium flex-1">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className={`text-sm font-medium underline underline-offset-2 hover:text-red-900 rounded ${FOCUS}`}
      >
        Try again
      </button>
    )}
  </div>
);

const Avatar = ({ name, size = "w-9 h-9 text-sm", className = "" }) => (
  <span
    className={`${size} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0 ${className}`}
    aria-hidden="true"
  >
    {name?.charAt(0)?.toUpperCase() || "?"}
  </span>
);

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

const TypeChip = ({ type }) => {
  const config = TYPES[type] || { label: formatType(type), dot: "bg-slate-400" };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
      <span className={`w-2 h-2 rounded-sm ${config.dot}`} />
      {config.label}
    </span>
  );
};

const Field = ({ label, htmlFor, hint, children }) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-700 mb-1.5"
    >
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
  </div>
);

const SkeletonBlock = ({ className = "" }) => (
  <div className={`bg-slate-200/70 rounded-lg animate-pulse ${className}`} />
);

/** Accessible dialog: closes on Escape or backdrop click, locks page scroll. */
const Modal = ({ title, description, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`-mr-2 -mt-1 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ${FOCUS}`}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">{children}</div>
      </div>
    </div>
  );
};

/** Navbar plus page background, shared by every state of this page. */
const PageShell = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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

              <Avatar name={user?.name} />

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);

  // `tickets` is what the list shows (may be filtered).
  // `allTickets` is the full set, so the progress stats never change when filtering.
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Project edit
  const [showEditForm, setShowEditForm] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: "",
    key: "",
    description: "",
  });

  // Project delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Create ticket
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const emptyTicketForm = {
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    assignedTo: "",
    labels: "",
  };

  const [formData, setFormData] = useState(emptyTicketForm);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });

  const [filtering, setFiltering] = useState(false);

  const hasFilters = Boolean(
    filters.search.trim() || filters.status || filters.priority,
  );

  /* ------------------------------ Load project ----------------------------- */

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [projectData, memberData, ticketData] = await Promise.all([
        getProjectById(id),
        getProjectMembers(id),
        getTickets({ project: id }),
      ]);

      setProject(projectData.project);
      setMembers(memberData.members);
      setTickets(ticketData.tickets);
      setAllTickets(ticketData.tickets);

      setProjectForm({
        name: projectData.project.name || "",
        key: projectData.project.key || "",
        description: projectData.project.description || "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  /* ------------------------------ Project edit ----------------------------- */

  const openEditForm = () => {
    setError("");
    setProjectForm({
      name: project.name || "",
      key: project.key || "",
      description: project.description || "",
    });
    setShowEditForm(true);
  };

  const closeEditForm = useCallback(() => setShowEditForm(false), []);

  const handleProjectChange = (e) => {
    setProjectForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();

    try {
      setUpdatingProject(true);
      setError("");

      const data = await updateProject(id, {
        name: projectForm.name,
        key: projectForm.key,
        description: projectForm.description,
      });

      setProject(data.project);

      setProjectForm({
        name: data.project.name || "",
        key: data.project.key || "",
        description: data.project.description || "",
      });

      setShowEditForm(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update project.");
    } finally {
      setUpdatingProject(false);
    }
  };

  /* ----------------------------- Project delete ---------------------------- */

  const openDeleteConfirm = () => {
    setError("");
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = useCallback(() => {
    if (!deletingProject) setShowDeleteConfirm(false);
  }, [deletingProject]);

  const handleDeleteProject = async () => {
    try {
      setDeletingProject(true);
      setError("");

      await deleteProject(id);

      navigate("/projects");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete project.");
      setDeletingProject(false);
    }
  };

  /* ------------------------------ Create ticket ---------------------------- */

  const openCreateForm = () => {
    setError("");
    setShowCreateForm(true);
  };

  const closeCreateForm = useCallback(() => setShowCreateForm(false), []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      const ticketData = {
        title: formData.title,
        description: formData.description,
        project: id,
        type: formData.type,
        priority: formData.priority,
        assignedTo: formData.assignedTo || null,
        labels: formData.labels
          ? formData.labels
              .split(",")
              .map((label) => label.trim())
              .filter(Boolean)
          : [],
      };

      const data = await createTicket(ticketData);

      setTickets((prevTickets) => [data.ticket, ...prevTickets]);
      setAllTickets((prevTickets) => [data.ticket, ...prevTickets]);

      setFormData(emptyTicketForm);
      setShowCreateForm(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  };

  /* -------------------------------- Filters -------------------------------- */

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleApplyFilters = async (e) => {
    e?.preventDefault();

    try {
      setFiltering(true);
      setError("");

      const params = { project: id };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const data = await getTickets(params);

      setTickets(data.tickets);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to filter tickets.");
    } finally {
      setFiltering(false);
    }
  };

  const handleClearFilters = async () => {
    try {
      setFiltering(true);
      setError("");

      setFilters({ search: "", status: "", priority: "" });

      const data = await getTickets({ project: id });

      setTickets(data.tickets);
      setAllTickets(data.tickets);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to clear filters.");
    } finally {
      setFiltering(false);
    }
  };

  /* --------------------------------- Loading ------------------------------- */

  if (loading) {
    return (
      <PageShell>
        <div aria-busy="true" aria-label="Loading project">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-44 mt-4 rounded-2xl" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <SkeletonBlock className="h-96 lg:col-span-2 rounded-2xl" />
            <div className="space-y-6">
              <SkeletonBlock className="h-56 rounded-2xl" />
              <SkeletonBlock className="h-40 rounded-2xl" />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  /* --------------------------------- Failed -------------------------------- */

  if (error && !project) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center mt-10">
          <span className="mx-auto w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertIcon />
          </span>

          <h2 className="text-lg font-semibold mt-4">
            This project didn't load
          </h2>

          <p className="text-sm text-slate-500 mt-1.5">{error}</p>

          <div className="flex justify-center gap-3 mt-6">
            <button onClick={loadProjectData} className={BTN_PRIMARY}>
              Try again
            </button>

            <Link to="/projects" className={BTN_SECONDARY}>
              Back to projects
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  /* --------------------------------- Stats --------------------------------- */

  const countByStatus = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };

  allTickets.forEach((ticket) => {
    if (countByStatus[ticket.status] !== undefined) {
      countByStatus[ticket.status] += 1;
    }
  });

  const totalCount = allTickets.length;
  const highPriorityCount = allTickets.filter(
    (ticket) => ticket.priority === "HIGH",
  ).length;
  const completionRate =
    totalCount > 0 ? Math.round((countByStatus.DONE / totalCount) * 100) : 0;

  const modalOpen = showEditForm || showCreateForm || showDeleteConfirm;

  /* --------------------------------- Render -------------------------------- */

  return (
    <PageShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-slate-500"
      >
        <Link
          to="/projects"
          className={`rounded hover:text-slate-900 transition-colors ${FOCUS}`}
        >
          Projects
        </Link>
        <ChevronIcon />
        <span className="font-medium text-slate-900">{project.key}</span>
      </nav>

      {/* Page error (modals show their own) */}
      {error && !modalOpen && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Project header */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 mt-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex gap-4 min-w-0">
            <span
              className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold shrink-0"
              aria-hidden="true"
            >
              {project.key?.slice(0, 2)}
            </span>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>

              <p
                className={`mt-1.5 max-w-2xl ${
                  project.description ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {project.description || "No description yet."}
              </p>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((member) => (
                    <Avatar
                      key={member._id}
                      name={member.name}
                      size="w-7 h-7 text-xs"
                      className="ring-2 ring-white"
                    />
                  ))}
                </div>

                <span className="text-sm text-slate-500">
                  {members.length > 4 && `+${members.length - 4} more, `}
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openDeleteConfirm}
              className={BTN_DANGER_GHOST}
            >
              Delete
            </button>

            <button type="button" onClick={openEditForm} className={BTN_SECONDARY}>
              Edit project
            </button>

            <button type="button" onClick={openCreateForm} className={BTN_PRIMARY}>
              <PlusIcon />
              Create ticket
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
        {/* Tickets */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div>
              <h2 className="text-lg font-semibold">Tickets</h2>

              <p className="text-sm text-slate-500 mt-0.5">
                {hasFilters
                  ? `${tickets.length} of ${totalCount} match your filters`
                  : `${totalCount} ${totalCount === 1 ? "ticket" : "tickets"} in this project`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem_auto] gap-3 px-6 py-5 border-b border-slate-200"
          >
            <div className="relative sm:col-span-2 lg:col-span-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <SearchIcon />
              </span>

              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title or key"
                aria-label="Search tickets"
                className={`${INPUT} pl-9`}
              />
            </div>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              aria-label="Filter by status"
              className={INPUT}
            >
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="IN_REVIEW">In review</option>
              <option value="DONE">Done</option>
            </select>

            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              aria-label="Filter by priority"
              className={INPUT}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
              <button type="submit" disabled={filtering} className={BTN_PRIMARY}>
                {filtering ? "Filtering..." : "Filter"}
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={filtering}
                  className={`${BTN} text-slate-600 hover:bg-slate-100 ${FOCUS}`}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* List */}
          {tickets.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <TicketIcon />
              </span>

              {hasFilters ? (
                <>
                  <h3 className="font-semibold mt-4">No tickets match</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Try a different search or clear the filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={`${BTN_SECONDARY} mt-5`}
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold mt-4">No tickets yet</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Create the first task, bug or story for this project.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className={`${BTN_PRIMARY} mt-5`}
                  >
                    <PlusIcon />
                    Create ticket
                  </button>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <li key={ticket._id}>
                  <Link
                    to={`/tickets/${ticket._id}`}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-center gap-x-6 gap-y-3 px-6 py-4 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-indigo-600">
                          {ticket.ticketKey}
                        </span>

                        <TypeChip type={ticket.type} />
                      </div>

                      <h3 className="font-medium mt-1.5 wrap-break-word">
                        {ticket.title}
                      </h3>

                      {ticket.description && (
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                          {ticket.description}
                        </p>
                      )}

                      {ticket.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {ticket.labels.map((label, index) => (
                            <span
                              key={`${label}-${index}`}
                              className="px-2 py-0.5 rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200 text-slate-600 text-xs"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:flex-nowrap">
                      <div className="md:w-24">
                        <PriorityMark priority={ticket.priority} />
                      </div>

                      <div className="md:w-28 md:flex md:justify-end">
                        <StatusPill status={ticket.status} />
                      </div>

                      {ticket.assignedTo ? (
                        <span
                          title={`Assigned to ${ticket.assignedTo.name || "a member"}`}
                        >
                          <Avatar
                            name={ticket.assignedTo.name}
                            size="w-7 h-7 text-xs"
                          />
                        </span>
                      ) : (
                        <span
                          title="Unassigned"
                          className="w-7 h-7 rounded-full border border-dashed border-slate-300 shrink-0"
                        />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Progress */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Progress</h2>

              <p className="text-sm text-slate-500">
                <span className="text-xl font-semibold text-slate-900 tabular-nums">
                  {completionRate}%
                </span>{" "}
                done
              </p>
            </div>

            <div
              className="flex h-3 gap-0.5 mt-4 rounded-full overflow-hidden bg-slate-100"
              role="img"
              aria-label={STATUSES.map(
                (s) => `${countByStatus[s.key]} ${s.label}`,
              ).join(", ")}
            >
              {totalCount > 0 &&
                STATUSES.filter((s) => countByStatus[s.key] > 0).map((s) => (
                  <div
                    key={s.key}
                    className={`${s.bar} transition-all duration-700 ease-out`}
                    style={{
                      width: `${(countByStatus[s.key] / totalCount) * 100}%`,
                    }}
                  />
                ))}
            </div>

            <dl className="mt-5 space-y-2.5">
              {STATUSES.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-slate-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {countByStatus[s.key]}
                  </dd>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <dt className="flex items-center gap-2 text-sm text-red-700">
                  <FlagIcon />
                  High priority
                </dt>
                <dd className="text-sm font-semibold tabular-nums">
                  {highPriorityCount}
                </dd>
              </div>
            </dl>
          </section>

          {/* Members */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Members</h2>
              <span className="text-sm text-slate-500 tabular-nums">
                {members.length}
              </span>
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">
                Nobody has joined this project yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {members.map((member) => (
                  <li key={member._id} className="flex items-center gap-3">
                    <Avatar name={member.name} />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {member.email}
                      </p>
                    </div>

                    {member.role && (
                      <span className="text-xs text-slate-500 shrink-0">
                        {formatType(member.role)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Edit project */}
      {showEditForm && (
        <Modal
          title="Edit project"
          description="Update the project's name, key and description."
          onClose={closeEditForm}
        >
          <form onSubmit={handleUpdateProject} className="space-y-5">
            {error && <ErrorNote message={error} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Project name" htmlFor="project-name">
                <input
                  id="project-name"
                  type="text"
                  name="name"
                  value={projectForm.name}
                  onChange={handleProjectChange}
                  required
                  className={INPUT}
                />
              </Field>

              <Field
                label="Project key"
                htmlFor="project-key"
                hint="Used in ticket keys, like ECOM-1."
              >
                <input
                  id="project-key"
                  type="text"
                  name="key"
                  value={projectForm.key}
                  onChange={handleProjectChange}
                  required
                  className={`${INPUT} uppercase`}
                />
              </Field>
            </div>

            <Field label="Description" htmlFor="project-description">
              <textarea
                id="project-description"
                name="description"
                value={projectForm.description}
                onChange={handleProjectChange}
                rows="4"
                placeholder="What is this project about?"
                className={`${INPUT} resize-none`}
              />
            </Field>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeEditForm}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updatingProject}
                className={BTN_PRIMARY}
              >
                {updatingProject ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create ticket */}
      {showCreateForm && (
        <Modal
          title="Create ticket"
          description="Add a task, bug or story to this project."
          onClose={closeCreateForm}
        >
          <form onSubmit={handleCreateTicket} className="space-y-5">
            {error && <ErrorNote message={error} />}

            <Field label="Title" htmlFor="ticket-title">
              <input
                id="ticket-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Fix login button on mobile"
                required
                autoFocus
                className={INPUT}
              />
            </Field>

            <Field label="Description" htmlFor="ticket-description">
              <textarea
                id="ticket-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What needs to happen, and why?"
                rows="4"
                className={`${INPUT} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Type" htmlFor="ticket-type">
                <select
                  id="ticket-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={INPUT}
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="STORY">Story</option>
                </select>
              </Field>

              <Field label="Priority" htmlFor="ticket-priority">
                <select
                  id="ticket-priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={INPUT}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
            </div>

            <Field label="Assignee" htmlFor="ticket-assignee">
              <select
                id="ticket-assignee"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className={INPUT}
              >
                <option value="">Unassigned</option>

                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Labels"
              htmlFor="ticket-labels"
              hint="Separate labels with commas."
            >
              <input
                id="ticket-labels"
                type="text"
                name="labels"
                value={formData.labels}
                onChange={handleChange}
                placeholder="frontend, urgent"
                className={INPUT}
              />
            </Field>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeCreateForm}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>

              <button type="submit" disabled={creating} className={BTN_PRIMARY}>
                {creating ? "Creating..." : "Create ticket"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete project */}
      {showDeleteConfirm && (
        <Modal
          title={`Delete ${project.name}?`}
          description="This can't be undone."
          onClose={closeDeleteConfirm}
        >
          <div className="space-y-5">
            {error && <ErrorNote message={error} />}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deletingProject}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deletingProject}
                className={BTN_DANGER}
              >
                {deletingProject ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default ProjectDetails;