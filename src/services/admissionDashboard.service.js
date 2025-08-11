/**
 * Admission Dashboard Service
 * Handles API calls for admission admin dashboard analytics
 */

import { axiosInstance } from "./axiosConfig";

class AdmissionDashboardService {
  /**
   * Get comprehensive admission dashboard data
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   * @returns {Promise<Object>} Dashboard data including KPIs, pipeline, and program analytics
   */
  async getDashboardData(timeRange = "weekly") {
    try {
      const response = await axiosInstance.get(
        "/api/analytics/admission-dashboard",
        {
          params: { timeRange },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching admission dashboard data:", error);
      throw error;
    }
  }

  /**
   * Get admission funnel statistics
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   * @returns {Promise<Object>} Funnel statistics
   */
  async getFunnelStats(timeRange = "weekly") {
    try {
      const response = await axiosInstance.get("/api/analytics/funnel-stats", {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      throw error;
    }
  }

  /**
   * Get conversion rates
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   * @returns {Promise<Object>} Conversion rates data
   */
  async getConversionRates(timeRange = "weekly") {
    try {
      const response = await axiosInstance.get(
        "/api/analytics/conversion-rates",
        {
          params: { timeRange },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
      throw error;
    }
  }

  /**
   * Export dashboard data
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   * @param {string} format - 'csv' or 'json'
   * @returns {Promise<Object>} Export data
   */
  async exportData(timeRange = "weekly", format = "csv") {
    try {
      const response = await axiosInstance.get("/api/analytics/export", {
        params: { timeRange, format },
        responseType: format === "csv" ? "blob" : "json",
      });

      if (format === "csv") {
        return response.data; // Return blob for CSV download
      }

      return response.data;
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const admissionDashboardService = new AdmissionDashboardService();
export default admissionDashboardService;
