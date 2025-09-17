import { axiosInstance } from "./axiosConfig";

export const teamService = {
  async getTeamMembers() {
    try {
      // For admin role, fetch marketing agents from the correct endpoint
      if (localStorage.getItem("userRole") === "admin") {
        const response = await axiosInstance.get("/api/leads/marketing-agents");
        return {
          success: response.data?.success || true,
          members: response.data?.data || [], // The marketing agents API returns data in response.data.data
          message: response.data?.message,
        };
      } else {
        // Keep original endpoint for other roles
        const response = await axiosInstance.get("/api/team/members");
        return {
          success: true,
          members: response.data?.members || [], // Ensure we always return an array
          message: response.data?.message,
        };
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      return {
        success: false,
        members: [],
        message:
          error.response?.data?.message || "Failed to fetch team members",
      };
    }
  },

  async addTeamMember(memberData) {
    try {
      const response = await axiosInstance.post(
        "/api/team/members",
        memberData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add team member"
      );
    }
  },

  async updateTeamMember(memberId, memberData) {
    try {
      const response = await axiosInstance.put(
        `/api/team/members/${memberId}`,
        memberData
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update team member"
      );
    }
  },

  async deleteTeamMember(memberId) {
    try {
      const response = await axiosInstance.delete(
        `/api/team/members/${memberId}`
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete team member"
      );
    }
  },
};
