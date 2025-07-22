import { axiosInstance } from "./axiosConfig";

export const webhookService = {
  async getContacts(organizationId = null) {
    try {
      const params = organizationId ? { organizationId } : {};
      const response = await axiosInstance.get("/api/webhook/contacts", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch contacts"
      );
    }
  },

  async getApplications(organizationId = null) {
    try {
      const params = organizationId ? { organizationId } : {};
      const response = await axiosInstance.get("/api/webhook/applications", {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  },

  async processWebhookData(webhookData) {
    try {
      const response = await axiosInstance.post(
        "/api/webhook/receive",
        webhookData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to process webhook data"
      );
    }
  },
};
