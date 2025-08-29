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

  // ========== LEAD FORMS MANAGEMENT ==========

  // Get all lead forms
  async getLeadForms() {
    try {
      const response = await axiosInstance.get("/api/super-admin/lead-forms");
      return response.data;
    } catch (error) {
      console.error("Error fetching lead forms:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch lead forms"
      );
    }
  },

  // Create new lead form
  async createLeadForm(formData) {
    try {
      const response = await axiosInstance.post(
        "/api/super-admin/lead-forms",
        formData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating lead form:", error);
      throw error;
    }
  },

  // Update lead form
  async updateLeadForm(formId, formData) {
    try {
      const response = await axiosInstance.put(
        `/api/super-admin/lead-forms/${formId}`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating lead form:", error);
      throw error;
    }
  },

  // Delete lead form
  async deleteLeadForm(formId) {
    try {
      const response = await axiosInstance.delete(
        `/api/super-admin/lead-forms/${formId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting lead form:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete lead form"
      );
    }
  },

  // Get lead form statistics
  async getLeadFormStats(formId, timeRange = "30") {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/lead-forms/${formId}/stats?timeRange=${timeRange}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching lead form stats:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch lead form statistics"
      );
    }
  },

  // Test Meta webhook connection for a specific form
  async testLeadFormWebhook(formId) {
    try {
      const response = await axiosInstance.post(
        `/api/super-admin/lead-forms/${formId}/test-webhook`
      );
      return response.data;
    } catch (error) {
      console.error("Error testing webhook:", error);
      throw new Error(
        error.response?.data?.message || "Failed to test webhook"
      );
    }
  },
};
