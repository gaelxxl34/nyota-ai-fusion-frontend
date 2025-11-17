import { axiosInstance } from "./axiosConfig";

export const superAdminService = {
  // User Management
  async getAllUsers() {
    try {
      const response = await axiosInstance.get("/api/super-admin/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  async createUser(userData) {
    try {
      const response = await axiosInstance.post(
        "/api/super-admin/users",
        userData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await axiosInstance.put(
        `/api/super-admin/users/${userId}`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await axiosInstance.delete(
        `/api/super-admin/users/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error(error.response?.data?.message || "Failed to delete user");
    }
  },

  async bulkDeleteUsers(userIds) {
    try {
      const response = await axiosInstance.post(
        "/api/super-admin/users/bulk-delete",
        { userIds }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      throw new Error(
        error.response?.data?.message || "Failed to bulk delete users"
      );
    }
  },

  async resetUserPassword(userId) {
    try {
      const response = await axiosInstance.post(
        `/api/super-admin/users/${userId}/reset-password`
      );
      return response.data;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new Error(
        error.response?.data?.message || "Failed to reset password"
      );
    }
  },

  // System Statistics
  async getSystemStats() {
    try {
      const response = await axiosInstance.get("/api/super-admin/stats");
      return response.data.stats;
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch system stats"
      );
    }
  },

  // System Configuration
  async getSystemConfig() {
    try {
      const response = await axiosInstance.get("/api/super-admin/config");
      return response.data;
    } catch (error) {
      console.error("Error fetching system config:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch system config"
      );
    }
  },

  async updateSystemConfig(config) {
    try {
      const response = await axiosInstance.put(
        "/api/super-admin/config",
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error updating system config:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update system config"
      );
    }
  },

  // User Analytics
  async getUserAnalytics(timeRange = "30") {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/analytics/users?timeRange=${timeRange}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch user analytics"
      );
    }
  },

  // Lead Analytics
  async getLeadAnalytics(timeRange = "30") {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/analytics/leads?timeRange=${timeRange}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching lead analytics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch lead analytics"
      );
    }
  },

  // Performance Metrics
  async getPerformanceMetrics() {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/analytics/performance"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch performance metrics"
      );
    }
  },

  // Conversation Analytics
  async getConversationStats(forceRefresh = false) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/analytics/conversations${
          forceRefresh ? "?refresh=true" : ""
        }`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversation statistics:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch conversation statistics"
      );
    }
  },

  // Get simplified conversation counts for dashboard
  async getConversationCounts() {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/analytics/conversations/counts"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversation counts:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch conversation counts"
      );
    }
  },

  // ========== BULK ACTIONS ==========

  // Get all interested leads for bulk messaging
  async getInterestedLeads() {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/bulk-actions/interested-leads"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching interested leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch interested leads"
      );
    }
  },

  // Get all contacted leads for bulk messaging
  async getContactedLeads() {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/bulk-actions/contacted-leads"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching contacted leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch contacted leads"
      );
    }
  },

  // Start bulk messaging campaign
  async startBulkMessaging(campaignData) {
    try {
      const response = await axiosInstance.post(
        "/api/super-admin/bulk-actions/send-messages",
        campaignData
      );
      return response.data;
    } catch (error) {
      console.error("Error starting bulk messaging:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to start bulk messaging campaign"
      );
    }
  },

  // Get campaign status and logs
  async getCampaign(campaignId) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/bulk-actions/campaigns/${campaignId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching campaign:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch campaign"
      );
    }
  },

  // Get all campaigns
  async getAllCampaigns(limit = 20, offset = 0) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/bulk-actions/campaigns?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch campaigns"
      );
    }
  },

  // Delete a campaign
  async deleteCampaign(campaignId) {
    try {
      const response = await axiosInstance.delete(
        `/api/super-admin/bulk-actions/campaigns/${campaignId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete campaign"
      );
    }
  },

  // ========== FACEBOOK LEAD FORMS METHODS ==========

  // Get all Facebook lead forms from Meta API
  async getFacebookLeadForms(fetchAllLeads = false) {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/facebook-lead-forms",
        {
          params: {
            fetchAllLeads: fetchAllLeads,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Facebook lead forms:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch Facebook lead forms"
      );
    }
  },

  // Get all leads from all Facebook forms
  async getAllFacebookLeads(maxLeadsPerForm = 1000) {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/facebook-lead-forms/all-leads",
        {
          params: {
            maxLeadsPerForm: maxLeadsPerForm,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching all Facebook leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch all Facebook leads"
      );
    }
  },

  // Get detailed statistics for a specific Facebook lead form
  async getFacebookLeadFormStats(formId, pageAccessToken) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/facebook-lead-forms/${formId}/stats`,
        {
          params: {
            pageAccessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Facebook form statistics:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch form statistics"
      );
    }
  },

  // Get leads from a specific Facebook form
  async getFacebookLeadFormLeads(formId, pageAccessToken, limit = 25) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/facebook-lead-forms/${formId}/leads`,
        {
          params: {
            pageAccessToken,
            limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Facebook form leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch form leads"
      );
    }
  },

  // ========== LEADS MANAGEMENT ==========

  // Get all leads with pagination and filtering
  async getAllLeads(params = {}) {
    try {
      const response = await axiosInstance.get("/api/leads", {
        params: {
          limit: params.limit || 50,
          page: params.page || 1,
          status: params.status,
          sortBy: params.sortBy || "createdAt",
          sortOrder: params.sortOrder || "desc",
          search: params.search,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all leads:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch leads");
    }
  },
};
