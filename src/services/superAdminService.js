import { axiosInstance } from "./axiosConfig";

export const superAdminService = {
  // User Management
  async getAllUsers() {
    try {
      const response = await axiosInstance.get("/super-admin/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  async createUser(userData) {
    try {
      const response = await axiosInstance.post("/super-admin/users", userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await axiosInstance.put(
        `/super-admin/users/${userId}`,
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
        `/super-admin/users/${userId}`
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
        `/super-admin/users/${userId}/reset-password`
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
      const response = await axiosInstance.get("/super-admin/stats");
      return response.data;
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
      const response = await axiosInstance.get("/super-admin/config");
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
      const response = await axiosInstance.put("/super-admin/config", config);
      return response.data;
    } catch (error) {
      console.error("Error updating system config:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update system config"
      );
    }
  },

  // System Stats
  async getSystemStats() {
    try {
      const response = await axiosInstance.get("/super-admin/stats");
      return response.data.stats;
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch system stats"
      );
    }
  },
};
