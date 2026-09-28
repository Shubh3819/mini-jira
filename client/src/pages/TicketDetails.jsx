import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getTicketById,
  updateTicket,
  deleteTicket,
} from "../services/ticketService";

import { getProjectMembers } from "../services/projectService";

/* -------------------------------------------------------------------------- */
/*  Design tokens (same as the other pages)                                   */
/* -------------------------------------------------------------------------- */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

const INPUT =
  "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed";

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
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    key: "IN_PROGRESS",
    label: "In progress",
    dot: "bg-indigo-500",
    pill: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    key: "IN_REVIEW",
    label: "In review",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  {
    key: "DONE",
    label: "Done",
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

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

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
    className="w-4 h-4 text-slate-300 shrink-0"
    aria-hidden="true"
  >
    <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
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

const Avatar = ({ name, size = "w-9 h-9 text-sm" }) => (
  <span
    className={`${size} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0`}
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
  const config = TYPES[type] || {
    label: formatType(type),
    dot: "bg-slate-400",
  };

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

/** One row of the details panel: a quiet label and its value. */
const DetailRow = ({ label, children }) => (
  <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 py-3 first:pt-0 last:pb-0">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="text-sm min-w-0">{children}</dd>
  </div>
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
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
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

/** Navbar plus page background. */
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [members, setMembers] = useState([]);

  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [savingDetails, setSavingDetails] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    labels: "",
  });

  const toFormData = (source) => ({
    title: source.title || "",
    description: source.description || "",
    type: source.type || "TASK",
    priority: source.priority || "MEDIUM",
    labels: source.labels ? source.labels.join(", ") : "",
  });

  /* ------------------------------ Load ticket ------------------------------ */

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTicketById(id);

      const memberData = await getProjectMembers(data.ticket.project._id);

      setTicket(data.ticket);
      setMembers(memberData.members);

      setSelectedStatus(data.ticket.status);
      setSelectedAssignee(data.ticket.assignedTo?._id || "");

      setFormData({
        title: data.ticket.title || "",
        description: data.ticket.description || "",
        type: data.ticket.type || "TASK",
        priority: data.ticket.priority || "MEDIUM",
        labels: data.ticket.labels ? data.ticket.labels.join(", ") : "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  /* ------------------------------ Edit ticket ------------------------------ */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartEditing = () => {
    setError("");
    setFormData(toFormData(ticket));
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setEditing(false);
    setError("");
    setFormData(toFormData(ticket));
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const ticketData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        labels: formData.labels
          ? formData.labels
              .split(",")
              .map((label) => label.trim())
              .filter(Boolean)
          : [],
      };

      const data = await updateTicket(id, ticketData);

      setTicket(data.ticket);
      setFormData(toFormData(data.ticket));
      setEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------- Assignment ------------------------------ */

  const handleSaveDetails = async () => {
    const currentAssignee = ticket.assignedTo?._id || "";

    if (
      selectedStatus === ticket.status &&
      selectedAssignee === currentAssignee
    ) {
      return;
    }

    try {
      setSavingDetails(true);
      setError("");

      const data = await updateTicket(id, {
        status: selectedStatus,
        assignedTo: selectedAssignee || null,
      });

      setTicket(data.ticket);

      setSelectedStatus(data.ticket.status);
      setSelectedAssignee(data.ticket.assignedTo?._id || "");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save ticket changes.",
      );
    } finally {
      setSavingDetails(false);
    }
  };

  /* --------------------------------- Delete -------------------------------- */

  const openDeleteConfirm = () => {
    setError("");
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = useCallback(() => {
    if (!deleting) setShowDeleteConfirm(false);
  }, [deleting]);

  const handleDeleteTicket = async () => {
    try {
      setDeleting(true);
      setError("");

      await deleteTicket(id);

      navigate(`/projects/${ticket.project._id}`);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete ticket.");
      setDeleting(false);
    }
  };

  /* --------------------------------- Loading ------------------------------- */

  if (loading) {
    return (
      <PageShell>
        <div aria-busy="true" aria-label="Loading ticket">
          <SkeletonBlock className="h-4 w-64" />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 mt-6">
            <SkeletonBlock className="h-96 rounded-2xl" />
            <SkeletonBlock className="h-80 rounded-2xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  /* --------------------------------- Failed -------------------------------- */

  if (error && !ticket) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center mt-10">
          <span className="mx-auto w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertIcon />
          </span>

          <h2 className="text-lg font-semibold mt-4">
            This ticket didn't load
          </h2>

          <p className="text-sm text-slate-500 mt-1.5">{error}</p>

          <div className="flex justify-center gap-3 mt-6">
            <button onClick={loadTicket} className={BTN_PRIMARY}>
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

  const statusConfig = STATUS_BY_KEY[selectedStatus] || STATUS_BY_KEY.TODO;
  const projectPath = `/projects/${ticket.project._id}`;

  /* --------------------------------- Render -------------------------------- */

  return (
    <PageShell>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0"
      >
        <Link
          to="/projects"
          className={`rounded hover:text-slate-900 transition-colors ${FOCUS}`}
        >
          Projects
        </Link>
        <ChevronIcon />
        <Link
          to={projectPath}
          className={`rounded hover:text-slate-900 transition-colors truncate ${FOCUS}`}
        >
          {ticket.project?.name || "Unknown project"}
        </Link>
        <ChevronIcon />
        <span className="font-medium text-slate-900">{ticket.ticketKey}</span>
      </nav>

      {/* Page error (delete modal shows its own) */}
      {error && !showDeleteConfirm && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 mt-5 items-start">
        {/* Main column */}
        <article className="bg-white border border-slate-200 rounded-2xl">
          {editing ? (
            <form onSubmit={handleSaveTicket} className="p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Edit ticket</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Changes apply to {ticket.ticketKey} as soon as you save.
                </p>
              </div>

              <Field label="Title" htmlFor="title">
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  autoFocus
                  className={INPUT}
                />
              </Field>

              <Field label="Description" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="7"
                  placeholder="What needs to happen, and why?"
                  className={`${INPUT} resize-y`}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Type" htmlFor="type">
                  <select
                    id="type"
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

                <Field label="Priority" htmlFor="priority">
                  <select
                    id="priority"
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

              <Field
                label="Labels"
                htmlFor="labels"
                hint="Separate labels with commas."
              >
                <input
                  id="labels"
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
                  onClick={handleCancelEditing}
                  disabled={saving}
                  className={BTN_SECONDARY}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Title + actions */}
              <header className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <TypeChip type={ticket.type} />
                    <span className="text-sm font-medium text-indigo-600">
                      {ticket.ticketKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={openDeleteConfirm}
                      className={BTN_DANGER_GHOST}
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className={BTN_SECONDARY}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-4 wrap-break-word">
                  {ticket.title}
                </h1>
              </header>

              {/* Description */}
              <section className="px-6 sm:px-8 pb-8">
                <h2 className="text-sm font-semibold text-slate-900">
                  Description
                </h2>

                {ticket.description ? (
                  <p className="text-slate-700 mt-2 leading-7 whitespace-pre-wrap wrap-break-word max-w-prose">
                    {ticket.description}
                  </p>
                ) : (
                  <p className="text-slate-500 mt-2 text-sm">
                    No description yet.{" "}
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className={`font-medium text-indigo-600 hover:text-indigo-700 rounded ${FOCUS}`}
                    >
                      Add one
                    </button>
                  </p>
                )}
              </section>

              {/* Labels */}
              <section className="px-6 sm:px-8 py-5 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 mr-2">
                    Labels
                  </h2>

                  {ticket.labels?.length > 0 ? (
                    ticket.labels.map((label, index) => (
                      <span
                        key={`${label}-${index}`}
                        className="px-2.5 py-0.5 rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200 text-slate-600 text-sm"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">None added.</span>
                  )}
                </div>
              </section>
            </>
          )}
        </article>

        {/* Details panel */}
        <aside className="bg-white border border-slate-200 rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold mb-5">Details</h2>

          <dl className="divide-y divide-slate-100">
            <DetailRow label="Status">
              <div className="relative">
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusConfig.dot}`}
                />

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={savingDetails}
                  aria-label="Status"
                  className={`${INPUT} pl-8 py-2`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </DetailRow>

            <DetailRow label="Assignee">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                disabled={savingDetails}
                aria-label="Assignee"
                className={`${INPUT} py-2`}
              >
                <option value="">Unassigned</option>

                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Priority">
              <PriorityMark priority={ticket.priority} />
            </DetailRow>

            <DetailRow label="Type">
              <TypeChip type={ticket.type} />
            </DetailRow>

            <DetailRow label="Reporter">
              <span className="flex items-center gap-2 min-w-0">
                <Avatar name={ticket.createdBy?.name} size="w-6 h-6 text-xs" />
                <span className="truncate">
                  {ticket.createdBy?.name || "Unknown"}
                </span>
              </span>
            </DetailRow>

            <DetailRow label="Project">
              <Link
                to={projectPath}
                className={`font-medium text-indigo-600 hover:text-indigo-700 rounded truncate block ${FOCUS}`}
              >
                {ticket.project?.name || "Unknown project"}
              </Link>
            </DetailRow>

            {ticket.createdAt && (
              <DetailRow label="Created">
                <span className="text-slate-700">
                  {formatDate(ticket.createdAt)}
                </span>
              </DetailRow>
            )}
          </dl>

          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={
                savingDetails ||
                (selectedStatus === ticket.status &&
                  selectedAssignee === (ticket.assignedTo?._id || ""))
              }
              className={BTN_PRIMARY}
            >
              {savingDetails ? "Saving..." : "Save changes"}
            </button>
          </div>
        </aside>
      </div>

      {/* Delete ticket */}
      {showDeleteConfirm && (
        <Modal
          title={`Delete ${ticket.ticketKey}?`}
          description="This can't be undone."
          onClose={closeDeleteConfirm}
        >
          <div className="space-y-5">
            {error && <ErrorNote message={error} />}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className={BTN_SECONDARY}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteTicket}
                disabled={deleting}
                className={BTN_DANGER}
              >
                {deleting ? "Deleting..." : "Delete ticket"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default TicketDetails;
