/**
 * Suzy Sheets API Service
 * Handles all API calls for the Suzy Sheets feature
 */

import { axiosInstance } from "./axiosConfig";

/**
 * Get all admitted leads
 * @returns {Promise<{success: boolean, data: Array, cached: boolean}>}
 */
export const getAdmittedLeads = async () => {
  try {
    const response = await axiosInstance.get("/api/suzy-sheets/admitted-leads");
    return response.data;
  } catch (error) {
    console.error("Error fetching admitted leads:", error);
    throw error;
  }
};

/**
 * Get a single lead detail
 * @param {string} leadId - The ID of the lead
 * @returns {Promise<{success: boolean, data: Object, cached: boolean}>}
 */
export const getLeadDetail = async (leadId) => {
  try {
    const response = await axiosInstance.get(`/api/suzy-sheets/lead/${leadId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching lead detail for ${leadId}:`, error);
    throw error;
  }
};

/**
 * Update lead status (ENROLLED, DEFERRED, EXPIRED)
 * @param {string} leadId - The ID of the lead
 * @param {string} status - The new status
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const updateLeadStatus = async (leadId, status) => {
  try {
    const response = await axiosInstance.patch(
      `/api/suzy-sheets/lead/${leadId}/status`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating status for lead ${leadId}:`, error);
    throw error;
  }
};

/**
 * Update Suzy's notes for a lead
 * @param {string} leadId - The ID of the lead
 * @param {string} notes - The notes content
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const updateLeadNotes = async (leadId, notes) => {
  try {
    const response = await axiosInstance.patch(
      `/api/suzy-sheets/lead/${leadId}/notes`,
      { notes }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating notes for lead ${leadId}:`, error);
    throw error;
  }
};

/**
 * Force refresh the admitted leads cache (admin only)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const refreshCache = async () => {
  try {
    const response = await axiosInstance.post("/api/suzy-sheets/refresh-cache");
    return response.data;
  } catch (error) {
    console.error("Error refreshing cache:", error);
    throw error;
  }
};

/**
 * Get cache statistics (admin only)
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export const getCacheStats = async () => {
  try {
    const response = await axiosInstance.get("/api/suzy-sheets/cache-stats");
    return response.data;
  } catch (error) {
    console.error("Error getting cache stats:", error);
    throw error;
  }
};
