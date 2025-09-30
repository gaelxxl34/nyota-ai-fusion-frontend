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

  async getTeamMembersWithAuthData(members) {
    try {
      console.log("Enhancing team members with Firebase auth data...");
      const response = await axiosInstance.post("/api/team/members/auth-data", {
        memberEmails: members.map((m) => m.email).filter(Boolean),
      });

      if (response.data.success && response.data.authData) {
        // Merge auth data with team members
        const enhancedMembers = members.map((member) => {
          const authData = response.data.authData.find(
            (auth) => auth.email === member.email
          );
          return {
            ...member,
            lastSignIn: authData?.lastSignInTime || null,
            lastActivity:
              authData?.lastRefreshTime || authData?.lastSignInTime || null,
            firebaseUid: authData?.uid || null,
            emailVerified: authData?.emailVerified || false,
            disabled: authData?.disabled || false,
            authProvider: authData?.provider || "password",
            creationTime: authData?.creationTime || member.createdAt,
          };
        });

        console.log("Successfully enhanced members with auth data");
        return enhancedMembers;
      } else {
        console.warn("Auth data response was not successful:", response.data);
        return members;
      }
    } catch (error) {
      console.error("Error fetching Firebase auth data:", error);
      // Return original members if auth data fetch fails
      return members;
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
