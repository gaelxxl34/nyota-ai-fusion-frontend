import { axiosInstance } from "./axiosConfig";

export const adminService = {
  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const response = await axiosInstance.get("/admin/stats");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch stats");
    }
  },

  // Lead Management
  async getLeads(filters = {}) {
    try {
      const response = await axiosInstance.get("/admin/leads", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch leads");
    }
  },

  async updateLead(leadId, data) {
    try {
      const response = await axiosInstance.put(`/admin/leads/${leadId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update lead");
    }
  },

  async deleteLead(leadId) {
    try {
      const response = await axiosInstance.delete(`/admin/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete lead");
    }
  },

  // Team Management (for Admin role)
  async getTeamMembers() {
    try {
      const response = await axiosInstance.get("/admin/team");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch team members"
      );
    }
  },

  async inviteTeamMember(memberData) {
    try {
      const response = await axiosInstance.post(
        "/admin/team/invite",
        memberData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to invite team member"
      );
    }
  },

  async updateTeamMember(memberId, data) {
    try {
      const response = await axiosInstance.put(`/admin/team/${memberId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update team member"
      );
    }
  },

  async removeTeamMember(memberId) {
    try {
      const response = await axiosInstance.delete(`/admin/team/${memberId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to remove team member"
      );
    }
  },

  // Application Management
  async getApplications(filters = {}) {
    try {
      const response = await axiosInstance.get("/admin/applications", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  },

  async updateApplication(applicationId, data) {
    try {
      const response = await axiosInstance.put(
        `/admin/applications/${applicationId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update application"
      );
    }
  },

  // Analytics
  async getAnalytics(dateRange) {
    try {
      const response = await axiosInstance.get("/admin/analytics", {
        params: dateRange,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch analytics"
      );
    }
  },

  // Settings
  async getSettings() {
    try {
      const response = await axiosInstance.get("/admin/settings");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch settings"
      );
    }
  },

  async updateSettings(settings) {
    try {
      const response = await axiosInstance.put("/admin/settings", settings);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update settings"
      );
    }
  },
};
