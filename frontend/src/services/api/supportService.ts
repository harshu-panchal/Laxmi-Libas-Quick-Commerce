import api from "./config";

export interface ISupportTicketInput {
  category: string;
  subject: string;
  description: string;
  orderId?: string;
  priority?: "Low" | "Medium" | "High";
}

/**
 * Create a new customer support ticket
 */
export const createSupportTicket = async (data: ISupportTicketInput) => {
  try {
    const response = await api.post("/support", data);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create support ticket",
    };
  }
};

/**
 * Fetch all tickets for the currently logged-in user
 */
export const getMySupportTickets = async () => {
  try {
    const response = await api.get("/support/my-tickets");
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch support tickets",
    };
  }
};

/**
 * Fetch detailed support ticket information
 */
export const getSupportTicketDetails = async (ticketId: string) => {
  try {
    const response = await api.get(`/support/${ticketId}`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch ticket details",
    };
  }
};

/**
 * Append a customer response message to a support ticket
 */
export const addSupportTicketMessage = async (ticketId: string, message: string) => {
  try {
    const response = await api.post(`/support/${ticketId}/messages`, { message });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send message",
    };
  }
};
