/**
 * Suzy Sheets API Service
 * Handles all API calls for the Suzy Sheets feature
 */

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  ) + "/api";

/**
 * Get all admitted leads
 * @returns {Promise<{success: boolean, data: Array, cached: boolean}>}
 */
export const getAdmittedLeads = async () => {
  try {
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${API_BASE_URL}/suzy-sheets/admitted-leads`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch admitted leads");
    }

    return await response.json();
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
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${API_BASE_URL}/suzy-sheets/lead/${leadId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch lead detail");
    }

    return await response.json();
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
    const token = localStorage.getItem("authToken");

    const response = await fetch(
      `${API_BASE_URL}/suzy-sheets/lead/${leadId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update lead status");
    }

    return await response.json();
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
    const token = localStorage.getItem("authToken");

    const response = await fetch(
      `${API_BASE_URL}/suzy-sheets/lead/${leadId}/notes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update lead notes");
    }

    return await response.json();
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
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${API_BASE_URL}/suzy-sheets/refresh-cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to refresh cache");
    }

    return await response.json();
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
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${API_BASE_URL}/suzy-sheets/cache-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to get cache stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting cache stats:", error);
    throw error;
  }
};
