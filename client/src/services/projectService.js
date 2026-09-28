import api from "./api";

// Get all projects for current user
export const getProjects = async () => {
  const response = await api.get("/projects");

  return response.data;
};

// Get all users
export const getUsers = async () => {
  const response = await api.get("/projects/users");

  return response.data;
};

// Get single project
export const getProjectById = async (projectId) => {
  const response = await api.get(
    `/projects/${projectId}`,
  );

  return response.data;
};

// Create project
export const createProject = async (projectData) => {
  const response = await api.post(
    "/projects",
    projectData,
  );

  return response.data;
};

// Update project
export const updateProject = async (
  projectId,
  projectData,
) => {
  const response = await api.put(
    `/projects/${projectId}`,
    projectData,
  );

  return response.data;
};

// Delete project
export const deleteProject = async (projectId) => {
  const response = await api.delete(
    `/projects/${projectId}`,
  );

  return response.data;
};

// Get project members
export const getProjectMembers = async (projectId) => {
  const response = await api.get(
    `/projects/${projectId}/members`,
  );

  return response.data;
};

// Add project member
export const addProjectMember = async (
  projectId,
  userId,
) => {
  const response = await api.post(
    `/projects/${projectId}/members`,
    {
      userId,
    },
  );

  return response.data;
};

// Remove project member
export const removeProjectMember = async (
  projectId,
  userId,
) => {
  const response = await api.delete(
    `/projects/${projectId}/members/${userId}`,
  );

  return response.data;
};