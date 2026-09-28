import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getProjects,
  createProject,
  getUsers,
} from "../services/projectService";

/* -------------------------------------------------------------------------- */
/*  Design tokens (same as the other pages)                                   */
/* -------------------------------------------------------------------------- */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

const INPUT =
  "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const BTN =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const BTN_PRIMARY = `${BTN} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 ${FOCUS}`;
const BTN_SECONDARY = `${BTN} bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 ${FOCUS}`;

// Each project gets a stable tile colour based on its key, so projects are
// easy to tell apart at a glance. Full class strings so Tailwind can see them.
const TILE_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

const getTileColor = (key = "") => {
  const sum = [...key].reduce((total, char) => total + char.charCodeAt(0), 0);
  return TILE_COLORS[sum % TILE_COLORS.length];
};

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

const FolderIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path
      d="M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h3.2l1.6 1.8H16a1.5 1.5 0 0 1 1.5 1.5v7.7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z"
      strokeLinejoin="round"
    />
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

const CheckIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5 shrink-0 mt-px"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="7.5" />
    <path
      d="m6.8 10.2 2.2 2.2 4.2-4.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const Avatar = ({ name }) => (
  <span
    className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center shrink-0"
    aria-hidden="true"
  >
    {name?.charAt(0)?.toUpperCase() || "?"}
  </span>
);

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
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const Projects = () => {
  const [projects, setProjects] = useState([]);

  const emptyForm = {
    name: "",
    key: "",
    description: "",
    members: [],
  };
  const [formData, setFormData] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();

      setProjects(data.projects || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // The success message clears itself after a few seconds.
  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const openCreateForm = async () => {
    setError("");
    setSuccess("");
    setLoadingUsers(true);

    try {
      const data = await getUsers();
      setUsers(data.users || []);
      setFormData(emptyForm);
      setShowCreateForm(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeCreateForm = useCallback(() => setShowCreateForm(false), []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleMemberChange = (userId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const data = await createProject({
        name: formData.name,
        key: formData.key.toUpperCase(),
        description: formData.description,
        members: formData.members,
      });

      setProjects((prevProjects) => [data.project, ...prevProjects]);

      setFormData(emptyForm);
      setShowCreateForm(false);
      setSuccess(`${data.project?.name || "Project"} was created.`);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const visibleProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;

    return projects.filter(
      (project) =>
        project.name?.toLowerCase().includes(term) ||
        project.key?.toLowerCase().includes(term),
    );
  }, [projects, search]);

  /* --------------------------------- Render -------------------------------- */

  return (
    <PageShell>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>

          <p className="text-slate-500 mt-1.5">
            {loading
              ? "Loading your projects..."
              : projects.length === 0
                ? "Create a project to start tracking tickets."
                : `${projects.length} ${projects.length === 1 ? "project" : "projects"} in your workspace.`}
          </p>
        </div>

        <button type="button" onClick={openCreateForm} className={BTN_PRIMARY}>
          <PlusIcon />
          New project
        </button>
      </header>

      {/* Messages */}
      {error && !showCreateForm && (
        <div className="mt-6">
          <ErrorNote
            message={error}
            onRetry={projects.length === 0 ? loadProjects : undefined}
          />
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl"
        >
          <CheckIcon />
          <p className="text-sm font-medium flex-1">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss"
            className={`-my-1 -mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors ${FOCUS}`}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Search (only useful once there are a few projects) */}
      {!loading && projects.length > 3 && (
        <div className="relative mt-8 max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or key"
            aria-label="Search projects"
            className={`${INPUT} pl-9`}
          />
        </div>
      )}

      {/* Content */}
      <section className={projects.length > 3 ? "mt-4" : "mt-8"}>
        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            aria-busy="true"
            aria-label="Loading projects"
          >
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-16 text-center">
            <span className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FolderIcon />
            </span>

            <h2 className="font-semibold mt-4">No projects yet</h2>

            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              A project holds the tickets for one product or team. Give it a
              short key, like ECOM, and you're set.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className={`${BTN_PRIMARY} mt-6`}
            >
              <PlusIcon />
              Create your first project
            </button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center">
            <h2 className="font-semibold">
              No projects match "{search.trim()}"
            </h2>

            <button
              type="button"
              onClick={() => setSearch("")}
              className={`${BTN_SECONDARY} mt-4`}
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleProjects.map((project) => (
              <li key={project._id}>
                <Link
                  to={`/projects/${project._id}`}
                  className={`group flex flex-col h-full bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-colors ${FOCUS}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold ${getTileColor(project.key)}`}
                      aria-hidden="true"
                    >
                      {project.key?.slice(0, 2)}
                    </span>

                    <span className="text-sm font-medium text-slate-500">
                      {project.key}
                    </span>
                  </div>

                  <h2 className="font-semibold text-lg mt-4 wrap-break-word group-hover:text-indigo-700 transition-colors">
                    {project.name}
                  </h2>

                  <p
                    className={`text-sm mt-1 line-clamp-2 ${
                      project.description ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {project.description || "No description yet."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create project */}
      {showCreateForm && (
        <Modal
          title="New project"
          description="A project holds the tickets for one product or team."
          onClose={closeCreateForm}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorNote message={error} />}

            <Field label="Project name" htmlFor="name">
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="E-commerce platform"
                required
                autoFocus
                className={INPUT}
              />
            </Field>

            <Field
              label="Project key"
              htmlFor="key"
              hint="Used in ticket IDs, like ECOM-1. Up to 10 characters."
            >
              <input
                id="key"
                type="text"
                name="key"
                value={formData.key}
                onChange={handleChange}
                placeholder="ECOM"
                required
                maxLength={10}
                className={`${INPUT} uppercase`}
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                rows="4"
                className={`${INPUT} resize-none`}
              />
            </Field>

            <Field
              label="Project members"
              hint="Select the users who should be part of this project."
            >
              <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <p className="px-3.5 py-3 text-sm text-slate-500">
                    Loading users...
                  </p>
                ) : users.length === 0 ? (
                  <p className="px-3.5 py-3 text-sm text-slate-500">
                    No registered users found.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const selected = formData.members.includes(user._id);

                      return (
                        <label
                          key={user._id}
                          className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleMemberChange(user._id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />

                          <Avatar name={user.name} />

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
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
                {creating ? "Creating..." : "Create project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageShell>
  );
};

export default Projects;
