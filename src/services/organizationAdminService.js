import { axiosInstance } from "./axiosConfig";

export const organizationAdminService = {
  async getDashboardStats() {
    try {
      const response = await axiosInstance.get("/organization/stats");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch stats");
    }
  },

  async getLeads() {
    try {
      const response = await axiosInstance.get("/organization/leads");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch leads");
    }
  },

  async updateLead(leadId, data) {
    try {
      const response = await axiosInstance.put(
        `/organization/leads/${leadId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update lead");
    }
  },
};
