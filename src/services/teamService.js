import { axiosInstance } from "./axiosConfig";

export const teamService = {
  async getTeamMembers() {
    try {
      const response = await axiosInstance.get("/organization/team");
      return {
        success: true,
        members: response.data?.members || [], // Ensure we always return an array
        message: response.data?.message,
      };
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
        "/organization/team",
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
        `/organization/team/${memberId}`,
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
        `/organization/team/${memberId}`
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
