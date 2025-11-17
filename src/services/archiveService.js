import { axiosInstance } from "./axiosConfig";

export const archiveService = {
  async getCollections() {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/archive/collections"
      );
      return response.data || { collections: [] };
    } catch (error) {
      console.error("Error fetching archive collections", error);
      throw new Error(
        error.response?.data?.message || "Unable to load archive collections"
      );
    }
  },

  async getFilters(collectionId) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/archive/filters/${collectionId}`
      );
      return response.data || { filters: { years: [], intakes: [] } };
    } catch (error) {
      console.error("Error fetching archive filters", error);
      throw new Error(
        error.response?.data?.message || "Unable to load archive filters"
      );
    }
  },

  async getJobs(limit = 20) {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/archive/jobs",
        {
          params: { limit },
        }
      );
      return response.data || { jobs: [] };
    } catch (error) {
      console.error("Error fetching archive jobs", error);
      throw new Error(
        error.response?.data?.message || "Unable to load archive jobs"
      );
    }
  },

  async getJob(jobId) {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/archive/jobs/${jobId}`
      );
      return response.data || { job: null };
    } catch (error) {
      console.error("Error fetching archive job", error);
      throw new Error(
        error.response?.data?.message || "Unable to load archive job"
      );
    }
  },

  async createJob(payload) {
    try {
      const response = await axiosInstance.post(
        "/api/super-admin/archive/jobs",
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error creating archive job", error);
      throw new Error(
        error.response?.data?.message || "Unable to execute archive operation"
      );
    }
  },

  async checkArchiveExists(collectionId, year, intake) {
    try {
      const response = await axiosInstance.get(
        "/api/super-admin/archive/check-exists",
        {
          params: { collectionId, year, intake },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking archive existence", error);
      throw new Error(
        error.response?.data?.message || "Unable to check archive existence"
      );
    }
  },

  async deleteArchive(archiveId) {
    try {
      const response = await axiosInstance.delete(
        `/api/super-admin/archive/${encodeURIComponent(archiveId)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting archive", error);
      throw new Error(
        error.response?.data?.message || "Unable to delete archive"
      );
    }
  },

  async downloadArchive(archiveId, format = "csv") {
    try {
      const response = await axiosInstance.get(
        `/api/super-admin/archive/${encodeURIComponent(archiveId)}/download`,
        {
          params: { format },
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error downloading archive", error);
      throw new Error(
        error.response?.data?.message || "Unable to download archive"
      );
    }
  },
};
