import { axiosInstance } from "./axiosConfig";

export const userService = {
  async getOrganizationUsers(organizationId) {
    try {
      const response = await axiosInstance.get(
        `/users/organization/${organizationId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },

  async getAllUsers() {
    try {
      const response = await axiosInstance.get("/users");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  },
};
