import { axiosInstance } from "./axiosConfig";

const analyticsService = {
  /**
   * Get analytics overview data
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   */
  async getOverview(timeRange = "daily") {
    try {
      const response = await axiosInstance.get("/api/analytics/overview", {
        params: { timeRange },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      throw error;
    }
  },

  /**
   * Get lead progression data over time
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   */
  async getLeadProgression(timeRange = "daily") {
    try {
      const response = await axiosInstance.get(
        "/api/analytics/lead-progression",
        {
          params: { timeRange },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching lead progression:", error);
      throw error;
    }
  },

  /**
   * Get agent performance metrics
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   */
  async getAgentPerformance(timeRange = "daily") {
    try {
      const response = await axiosInstance.get(
        "/api/analytics/agent-performance",
        {
          params: { timeRange },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      throw error;
    }
  },

  /**
   * Get conversion rates between stages
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   */
  async getConversionRates(timeRange = "daily") {
    try {
      const response = await axiosInstance.get(
        "/api/analytics/conversion-rates",
        {
          params: { timeRange },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
      throw error;
    }
  },

  /**
   * Get all analytics data in one call
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   */
  async getAllAnalytics(timeRange = "daily") {
    try {
      console.log("Fetching all analytics with timeRange:", timeRange);

      // Fetch each endpoint individually to better handle errors
      let overview, progression, agentPerformance, conversionRates;

      try {
        overview = await this.getOverview(timeRange);
      } catch (err) {
        console.error("Failed to fetch overview:", err);
        overview = null;
      }

      try {
        progression = await this.getLeadProgression(timeRange);
      } catch (err) {
        console.error("Failed to fetch progression:", err);
        progression = null;
      }

      try {
        agentPerformance = await this.getAgentPerformance(timeRange);
      } catch (err) {
        console.error("Failed to fetch agent performance:", err);
        agentPerformance = null;
      }

      try {
        conversionRates = await this.getConversionRates(timeRange);
      } catch (err) {
        console.error("Failed to fetch conversion rates:", err);
        conversionRates = null;
      }

      const result = {
        overview,
        progression,
        agentPerformance,
        conversionRates,
      };

      console.log("Analytics data fetched:", result);
      return result;
    } catch (error) {
      console.error("Error fetching all analytics:", error);
      throw error;
    }
  },

  /**
   * Export analytics data
   * @param {string} timeRange - 'daily', 'weekly', or 'monthly'
   * @param {string} format - 'csv' or 'json'
   */
  async exportAnalytics(timeRange = "daily", format = "csv") {
    try {
      const response = await axiosInstance.get("/api/analytics/export", {
        params: { timeRange, format },
        responseType: format === "csv" ? "blob" : "json",
      });

      if (format === "csv") {
        // Create a download link for CSV
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics-${timeRange}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      return response.data;
    } catch (error) {
      console.error("Error exporting analytics:", error);
      throw error;
    }
  },
};

export { analyticsService };
