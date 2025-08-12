/**
 * Application Service
 * Handles application form submissions and lead management
 */

import axios from "axios";
import { axiosInstance } from "./axiosConfig";

class ApplicationService {
  constructor() {
    this.apiUrl = "/api/applications"; // Full API path since baseURL is just the host
  }

  /**
   * Submit an application form
   * @param {Object} applicationData - Application form data
   * @param {Object} userInfo - User info of the person submitting
   * @returns {Promise} API response
   */
  async submitApplication(
    applicationData,
    userInfo = null,
    forceSubmit = false
  ) {
    try {
      // Format the current date in a simple readable format
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const ampm = now.getHours() >= 12 ? "pm" : "am";
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const formattedDate = `${hours}${ampm} ${
        months[now.getMonth()]
      } ${now.getDate()}, ${now.getFullYear()}`;

      // Include user info if provided
      const requestData = {
        ...applicationData,
        forceSubmit, // Add forceSubmit flag
        submittedAt: formattedDate, // Add submission date in simple format
      };

      if (userInfo) {
        requestData.submittedBy = {
          uid: userInfo.uid,
          email: userInfo.email,
          name: userInfo.displayName || userInfo.email,
          role: userInfo.role,
          submittedAt: formattedDate,
        };
      }

      const response = await axiosInstance.post(
        `${this.apiUrl}/submit`,
        requestData
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

      // Handle duplicate detection response (status 409)
      if (
        error.response?.status === 409 &&
        error.response?.data?.duplicatesFound
      ) {
        return {
          success: false,
          duplicatesFound: true,
          existingData: error.response.data.existingData,
          message:
            error.response.data.message ||
            "Matching records found with the same email or phone number",
        };
      }

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
   * Submit a manual application form (internal form)
   * @param {Object} applicationData - Application form data
   * @param {Object} userInfo - User info of the person submitting
   * @returns {Promise} API response
   */
  async submitManualApplication(
    applicationData,
    userInfo = null,
    forceSubmit = false
  ) {
    try {
      // Format the current date in a simple readable format
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const ampm = now.getHours() >= 12 ? "pm" : "am";
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const formattedDate = `${hours}${ampm} ${
        months[now.getMonth()]
      } ${now.getDate()}, ${now.getFullYear()}`;

      // Check if we have files to upload
      const hasFiles =
        applicationData.passportPhoto instanceof File ||
        applicationData.academicDocuments instanceof File ||
        applicationData.identificationDocuments instanceof File ||
        Array.isArray(applicationData.academicDocuments) ||
        Array.isArray(applicationData.identificationDocuments);

      let requestData;
      let config = {};

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Add all non-file fields
        Object.keys(applicationData).forEach((key) => {
          const value = applicationData[key];
          if (
            value !== null &&
            value !== undefined &&
            !(value instanceof File) &&
            !Array.isArray(value)
          ) {
            formData.append(key, value.toString());
          }
        });

        // Add file fields
        if (applicationData.passportPhoto instanceof File) {
          formData.append("passportPhoto", applicationData.passportPhoto);
        }

        if (applicationData.academicDocuments instanceof File) {
          formData.append(
            "academicDocuments",
            applicationData.academicDocuments
          );
        } else if (
          Array.isArray(applicationData.academicDocuments) &&
          applicationData.academicDocuments[0] instanceof File
        ) {
          formData.append(
            "academicDocuments",
            applicationData.academicDocuments[0]
          );
        }

        if (applicationData.identificationDocuments instanceof File) {
          formData.append(
            "identificationDocument",
            applicationData.identificationDocuments
          );
        } else if (
          Array.isArray(applicationData.identificationDocuments) &&
          applicationData.identificationDocuments[0] instanceof File
        ) {
          formData.append(
            "identificationDocument",
            applicationData.identificationDocuments[0]
          );
        }

        // Add metadata
        formData.append("forceSubmit", forceSubmit.toString());
        formData.append("submittedAt", formattedDate);

        if (userInfo) {
          formData.append(
            "submittedBy",
            JSON.stringify({
              uid: userInfo.uid,
              email: userInfo.email,
              name: userInfo.displayName || userInfo.email,
              role: userInfo.role,
              submittedAt: formattedDate,
            })
          );
        }

        requestData = formData;
        config = {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };
      } else {
        // Use JSON for submissions without files
        requestData = {
          ...applicationData,
          forceSubmit,
          submittedAt: formattedDate,
        };

        if (userInfo) {
          requestData.submittedBy = {
            uid: userInfo.uid,
            email: userInfo.email,
            name: userInfo.displayName || userInfo.email,
            role: userInfo.role,
            submittedAt: formattedDate,
          };
        }
      }

      // Use the manual application endpoint
      const response = await axiosInstance.post(
        `${this.apiUrl}/submit-manual`,
        requestData,
        config
      );
      return {
        success: true,
        data: response.data,
        application: response.data.application,
        lead: response.data.lead,
      };
    } catch (error) {
      console.error("Application submission error:", error);

      // Handle duplicate detection response (status 409)
      if (
        error.response?.status === 409 &&
        error.response?.data?.duplicatesFound
      ) {
        return {
          success: false,
          duplicatesFound: true,
          existingData: error.response.data.existingData,
          message:
            error.response.data.message ||
            "Matching records found with the same email or phone number",
        };
      }

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
      console.log(`Fetching application by ID: ${applicationId}`);
      const response = await axiosInstance.get(
        `${this.apiUrl}/${applicationId}`
      );
      console.log(`Application data response:`, response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get application error:", error);
      // Check if it's a 404 error - this means the application wasn't found
      if (error.response?.status === 404) {
        return {
          success: false,
          notFound: true,
          message: "Application not found",
        };
      }
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
   * Get application by Lead ID
   * @param {string} leadId - Lead ID
   * @returns {Promise} API response
   */
  async getApplicationByLeadId(leadId) {
    try {
      console.log(`Fetching application for leadId: ${leadId}`);
      const response = await axiosInstance.get(`${this.apiUrl}/lead/${leadId}`);
      console.log(`Application by leadId response:`, response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get application by lead ID error:", error);
      // Check if it's a 404 error - this is expected if no application exists yet
      if (error.response?.status === 404) {
        return {
          success: false,
          notFound: true,
          message: "No application found for this lead",
        };
      }
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch application for this lead",
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
      console.log("Raw backend response:", response.data);

      // Backend already returns { success: true, data: [...] }
      // So we return the backend response directly
      return response.data;
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
   * @param {Object} updatedBy - User who made the update
   * @returns {Promise} API response
   */
  async updateApplicationStatus(
    applicationId,
    status,
    notes = "",
    updatedBy = null
  ) {
    try {
      const response = await axiosInstance.put(
        `${this.apiUrl}/${applicationId}/status`,
        {
          status,
          notes,
          updatedBy,
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
   * Update existing application
   * @param {string} applicationId - Application ID
   * @param {object|FormData} applicationData - Updated application data, can be JSON or FormData for file uploads
   * @param {object} config - Optional axios config for FormData requests
   * @returns {Promise} API response
   */
  async updateApplication(applicationId, applicationData, config = {}) {
    try {
      const response = await axiosInstance.put(
        `${this.apiUrl}/${applicationId}`,
        applicationData,
        config
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Update application error:", error);
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
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch application stats",
      };
    }
  }

  /**
   * Get application document URL for viewing by email
   * @param {string} email - The email of the applicant
   * @param {string} documentType - The type of document to view (academicDocuments, identificationDocument, passportPhoto)
   * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
   */
  async getApplicationDocumentByEmail(email, documentType) {
    try {
      console.log(
        `ApplicationService: Fetching document for email ${email}, type: ${documentType}`
      );

      const requestUrl = `${this.apiUrl}/email/${encodeURIComponent(
        email
      )}/document/${documentType}`;
      console.log(`ApplicationService: Request URL: ${requestUrl}`);

      // Try with the standard axios instance
      const response = await axiosInstance.get(requestUrl);
      console.log(
        `ApplicationService: Document fetch successful:`,
        response.data
      );

      // Backend returns { success: true, url: "...", documentType: "...", applicationId: "..." }
      // Return the backend response directly
      return response.data;
    } catch (error) {
      console.error(
        `ApplicationService: Error fetching document by email:`,
        error.response || error
      );

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to retrieve document",
      };
    }
  }

  /**
   * Update application by email
   * @param {string} email - Email of the applicant
   * @param {object|FormData} applicationData - Updated application data, can be JSON or FormData for file uploads
   * @param {object} config - Optional axios config for FormData requests
   * @returns {Promise} API response
   */
  async updateApplicationByEmail(email, applicationData, config = {}) {
    try {
      const response = await axiosInstance.put(
        `${this.apiUrl}/email/${encodeURIComponent(email)}`,
        applicationData,
        config
      );
      // Backend returns { success: true, data: {...}, message: "..." }
      return response.data;
    } catch (error) {
      console.error("Update application by email error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update application",
      };
    }
  }

  /**
   * Get application document URL for viewing
   * @param {string} applicationId - The ID of the application
   * @param {string} documentType - The type of document to view (academicDocuments, identificationDocument, passportPhoto)
   * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
   */
  /**
   * Test API connectivity by making a simple request
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testApiConnection() {
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";
    console.log(`Using API base URL: ${apiBaseUrl}`);

    try {
      console.log("Testing API connection...");
      // Make a simple request to the API health endpoint
      const response = await axios.get(`${apiBaseUrl}/api/applications/health`);
      console.log("API connectivity test result:", response.data);
      return {
        success: true,
        message: "Connection successful",
        data: response.data,
      };
    } catch (healthError) {
      console.error("API health endpoint test failed:", healthError);

      // Try to make a direct request to applications endpoint as a fallback
      try {
        console.log("Trying direct request to applications endpoint...");
        const directResponse = await axios.get(
          `${apiBaseUrl}/api/applications`
        );
        console.log("Direct API request result:", directResponse.status);
        return {
          success: true,
          message: "Direct connection successful",
          data: { status: directResponse.status },
        };
      } catch (directError) {
        console.error("Direct API request failed:", directError);

        // Try without /api prefix as a last resort
        try {
          console.log("Trying without /api prefix...");
          const noApiResponse = await axios.get(`${apiBaseUrl}/applications`);
          console.log(
            "Request without /api prefix succeeded:",
            noApiResponse.status
          );
          return {
            success: true,
            message: "Connection successful without /api prefix",
            data: { status: noApiResponse.status },
          };
        } catch (noApiError) {
          console.error("Request without /api prefix also failed:", noApiError);
          return {
            success: false,
            message: `API connectivity test failed: ${
              healthError.message || "Unknown error"
            }`,
            errors: {
              health: healthError.message,
              direct: directError.message,
              noApi: noApiError.message,
            },
          };
        }
      }
    }
  }

  async getApplicationDocument(applicationId, documentType) {
    try {
      // Test API connection first
      await this.testApiConnection();

      console.log(
        `ApplicationService: Fetching document for application ${applicationId}, type: ${documentType}`
      );
      // The axiosInstance has baseURL = baseUrl, so we use full API path
      const requestUrl = `${this.apiUrl}/${applicationId}/document/${documentType}`;
      console.log(`ApplicationService: Request URL: ${requestUrl}`);
      console.log(
        `ApplicationService: Full URL: ${axiosInstance.defaults.baseURL}${requestUrl}`
      );

      // Try first with the standard axios instance
      const response = await axiosInstance.get(requestUrl);
      console.log(
        `ApplicationService: Document fetch successful:`,
        response.data
      );

      // Check for url property in different potential formats
      let documentUrl = null;
      if (response.data.url) {
        documentUrl = response.data.url;
      } else if (response.data.documentUrl) {
        documentUrl = response.data.documentUrl;
      } else if (response.data.data && response.data.data.url) {
        documentUrl = response.data.data.url;
      } else if (
        typeof response.data === "string" &&
        (response.data.startsWith("http") || response.data.startsWith("data:"))
      ) {
        documentUrl = response.data;
      }

      if (!documentUrl) {
        console.warn(
          `ApplicationService: Response successful but missing URL property:`,
          response.data
        );
        throw new Error("Document URL not found in response");
      }

      console.log(
        `ApplicationService: Found document URL: ${documentUrl.substring(
          0,
          50
        )}...`
      );

      return {
        success: true,
        url: documentUrl,
      };
    } catch (error) {
      console.error(
        `ApplicationService: Error fetching document:`,
        error.response || error
      );

      // Log detailed information about the error
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error(`Response Data:`, error.response.data);
      }

      // Try direct axios request without using axiosInstance to test connectivity
      try {
        console.log(
          `Trying direct request to: ${
            process.env.REACT_APP_API_BASE_URL || "http://localhost:3000"
          }/api/applications/${applicationId}/document/${documentType}`
        );
        const directResponse = await axios.get(
          `${
            process.env.REACT_APP_API_BASE_URL || "http://localhost:3000"
          }/api/applications/${applicationId}/document/${documentType}`
        );
        console.log("Direct request succeeded:", directResponse.data);
        return {
          success: true,
          url: directResponse.data.url,
        };
      } catch (directError) {
        console.error("Direct request also failed:", directError);
      }

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to retrieve document",
      };
    }
  }
}

// Export singleton instance
export const applicationService = new ApplicationService();
export default applicationService;
