/**
 * Application Service
 * Handles application form submissions and lead management
 */

import { axiosInstance } from "./axiosConfig";

class ApplicationService {
  constructor() {
    this.apiUrl = "/api/applications";
  }

  /**
   * Submit an application form
   * @param {Object} applicationData - Application form data
   * @returns {Promise} API response
   */
  async submitApplication(applicationData) {
    try {
      const response = await axiosInstance.post(
        `${this.apiUrl}/submit`,
        applicationData
      );
      return {
        success: true,
        data: response.data,
        application: response.data.application,
        lead: response.data.lead,
        whatsappMessage: response.data.whatsappMessage,
      };
    } catch (error) {
      console.error("Application submission error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to submit application",
      };
    }
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise} API response
   */
  async getApplication(applicationId) {
    try {
      const response = await axiosInstance.get(
        `${this.apiUrl}/${applicationId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get application error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch application",
      };
    }
  }

  /**
   * Get applications by email
   * @param {string} email - Applicant email
   * @returns {Promise} API response
   */
  async getApplicationsByEmail(email) {
    try {
      const response = await axiosInstance.get(
        `${this.apiUrl}/email/${encodeURIComponent(email)}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get applications by email error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch applications",
      };
    }
  }

  /**
   * Get applications by phone number
   * @param {string} phoneNumber - Applicant phone number
   * @returns {Promise} API response
   */
  async getApplicationsByPhone(phoneNumber) {
    try {
      const response = await axiosInstance.get(
        `${this.apiUrl}/phone/${encodeURIComponent(phoneNumber)}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get applications by phone error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch applications",
      };
    }
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise} API response
   */
  async updateApplicationStatus(applicationId, status, notes = "") {
    try {
      const response = await axiosInstance.put(
        `${this.apiUrl}/${applicationId}/status`,
        {
          status,
          notes,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Update application status error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update application status",
      };
    }
  }

  /**
   * Get all applications with pagination
   * @param {Object} options - Query options (limit, status, etc.)
   * @returns {Promise} API response
   */
  async getApplications(options = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (options.limit) queryParams.append("limit", options.limit);
      if (options.status) queryParams.append("status", options.status);
      if (options.program) queryParams.append("program", options.program);
      if (options.intake) queryParams.append("intake", options.intake);

      const response = await axiosInstance.get(
        `${this.apiUrl}?${queryParams.toString()}`
      );
      return {
        success: true,
        data: response.data,
        applications: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error("Get applications error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch applications",
      };
    }
  }

  /**
   * Get application statistics
   * @returns {Promise} API response
   */
  async getApplicationStats() {
    try {
      const response = await axiosInstance.get(`${this.apiUrl}/stats`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get application stats error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch application stats",
      };
    }
  }
}

// Export singleton instance
export const applicationService = new ApplicationService();
export default applicationService;
