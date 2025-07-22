import { axiosInstance } from "./axiosConfig";

export const organizationService = {
  async registerOrganization(orgData) {
    try {
      // Normalize the status value
      const normalizedData = {
        ...orgData,
        status:
          orgData.status?.charAt(0).toUpperCase() +
            orgData.status?.slice(1).toLowerCase() || "Active",
        createdAt: new Date().toISOString(),
      };

      const response = await axiosInstance.post(
        "/organizations",
        normalizedData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to register organization"
      );
    }
  },

  async getAllOrganizations() {
    try {
      const response = await axiosInstance.get("/organizations");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch organizations"
      );
    }
  },

  async updateOrganization(id, data) {
    try {
      const response = await axiosInstance.put(`/organizations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update organization error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update organization"
      );
    }
  },

  async deleteOrganization(id) {
    try {
      const response = await axiosInstance.delete(`/organizations/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete organization"
      );
    }
  },
};
