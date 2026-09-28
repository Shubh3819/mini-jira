import api from "./api";

// Get tickets
export const getTickets = async (params = {}) => {
  const response = await api.get("/tickets", {
    params,
  });

  return response.data;
};

// Get single ticket
export const getTicketById = async (ticketId) => {
  const response = await api.get(
    `/tickets/${ticketId}`,
  );

  return response.data;
};

// Create ticket
export const createTicket = async (ticketData) => {
  const response = await api.post(
    "/tickets",
    ticketData,
  );

  return response.data;
};

// Update ticket
export const updateTicket = async (
  ticketId,
  ticketData,
) => {
  const response = await api.put(
    `/tickets/${ticketId}`,
    ticketData,
  );

  return response.data;
};

// Delete ticket
export const deleteTicket = async (ticketId) => {
  const response = await api.delete(
    `/tickets/${ticketId}`,
  );

  return response.data;
};

// Assign ticket
export const assignTicket = async (
  ticketId,
  assignedTo,
) => {
  const response = await api.patch(
    `/tickets/${ticketId}/assign`,
    {
      assignedTo,
    },
  );

  return response.data;
};

// Update ticket status
export const updateTicketStatus = async (
  ticketId,
  status,
) => {
  const response = await api.patch(
    `/tickets/${ticketId}/status`,
    {
      status,
    },
  );

  return response.data;
};