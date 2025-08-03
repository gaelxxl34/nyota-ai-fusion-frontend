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
};
