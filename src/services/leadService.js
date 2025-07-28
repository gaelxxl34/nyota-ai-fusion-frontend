import { axiosInstance } from "./axiosConfig";

export const leadService = {
  // Get all leads with optimized pagination and filters
  async getAllLeads(options = {}) {
    try {
      const {
        limit = 25,
        offset = 0,
        status,
        source,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      console.log(`🔄 Fetching leads with options:`, options);

      const params = {
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      // Only add filters if they have values
      if (status) params.status = status;
      if (source) params.source = source;
      if (search?.trim()) params.search = search.trim();

      const response = await axiosInstance.get("/api/leads", { params });

      console.log(
        `📡 Leads API Response: ${response.data.data?.length || 0} leads`
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching leads:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch leads");
    }
  },

  // Get leads by status with pagination
  async getLeadsByStatus(status, options = {}) {
    try {
      const { limit = 25, offset = 0 } = options;

      console.log(`🔄 Fetching leads by status: ${status}`);

      const response = await axiosInstance.get("/api/leads", {
        params: { status, limit, offset },
      });

      console.log(
        `📡 Status-filtered leads: ${response.data.data?.length || 0} leads`
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching leads by status:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch leads by status"
      );
    }
  },

  // Create a new lead
  async createLead(leadData) {
    try {
      // Extract contactInfo and separate additional data
      const { name, phone, email, ...additionalData } = leadData;

      const contactInfo = { name, phone, email };

      const response = await axiosInstance.post("/api/leads", {
        contactInfo,
        ...additionalData,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create lead");
    }
  },

  // Get lead by ID
  async getLeadById(id) {
    try {
      const response = await axiosInstance.get(`/api/leads/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch lead details"
      );
    }
  },

  // Update lead status
  async updateLeadStatus(
    leadId,
    status,
    notes = "",
    updatedBy = "frontend_user",
    forceUpdate = false
  ) {
    try {
      const response = await axiosInstance.put(`/api/leads/${leadId}/status`, {
        status,
        notes,
        updatedBy,
        forceUpdate,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update lead status"
      );
    }
  },

  // Find lead by email
  async findLeadByEmail(email) {
    try {
      const response = await axiosInstance.get(`/api/leads/email/${email}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, data: null };
      }
      throw new Error(
        error.response?.data?.message || "Failed to find lead by email"
      );
    }
  },

  // Find lead by phone
  async findLeadByPhone(phone) {
    try {
      const response = await axiosInstance.get(`/api/leads/phone/${phone}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, error: "Lead not found" };
      }
      throw new Error(
        error.response?.data?.message || "Failed to find lead by phone"
      );
    }
  },

  // Add interaction to lead
  async addInteraction(leadId, interactionData) {
    try {
      const response = await axiosInstance.post(
        `/api/leads/${leadId}/interactions`,
        interactionData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add interaction"
      );
    }
  },

  // Get lead statistics
  async getLeadStats(timeFrame = "week") {
    try {
      const response = await axiosInstance.get(`/api/leads/stats`, {
        params: { timeFrame },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch lead statistics"
      );
    }
  },

  // Send WhatsApp message and create/update lead
  async sendWhatsAppMessage(phone, message, leadData = null) {
    try {
      const response = await axiosInstance.post("/api/whatsapp/send-message", {
        to: phone,
        message,
        leadData,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to send WhatsApp message"
      );
    }
  },

  // Contact lead via WhatsApp (finds existing or creates new)
  async contactLeadViaWhatsApp(contactInfo, message) {
    try {
      // First try to find existing lead by email (primary identifier)
      let lead = null;
      if (contactInfo.email) {
        const existingLead = await this.findLeadByEmail(contactInfo.email);
        if (existingLead.success) {
          lead = existingLead.data;
        }
      }

      // If no lead found by email, try by phone as fallback
      if (!lead && contactInfo.phone) {
        const existingLead = await this.findLeadByPhone(contactInfo.phone);
        if (existingLead.success) {
          lead = existingLead.data;
        }
      }

      // If no lead exists, create one
      if (!lead) {
        const newLead = await this.createLead({
          ...contactInfo,
          source: "MANUAL",
          notes: "Lead created from inquiry form",
        });
        lead = newLead.data;
      }

      // Send WhatsApp message with lead data
      const messageResult = await this.sendWhatsAppMessage(
        contactInfo.phone,
        message,
        {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
        }
      );

      // Only update lead status to CONTACTED if message was actually delivered
      if (messageResult.success && messageResult.delivered) {
        await this.updateLeadStatus(
          lead.id,
          "CONTACTED",
          `WhatsApp message sent: "${message}"`,
          "inquiry_form"
        );

        // Add interaction record for successful delivery
        await this.addInteraction(lead.id, {
          type: "WHATSAPP",
          content: message,
          channel: "WHATSAPP",
          automated: false,
        });
      } else if (!messageResult.success) {
        // Log delivery failure but don't update lead status
        console.log(
          `❌ WhatsApp delivery failed for ${contactInfo.phone}: ${messageResult.error}`
        );

        // Add interaction record for failed delivery attempt
        await this.addInteraction(lead.id, {
          type: "WHATSAPP_FAILED",
          content: `Failed to send: "${message}" - ${messageResult.error}`,
          channel: "WHATSAPP",
          automated: false,
        });
      }

      return {
        success: true,
        lead: lead,
        messageResult: messageResult,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to contact lead"
      );
    }
  },

  // Update lead
  async updateLead(leadId, updateData) {
    try {
      const response = await axiosInstance.put(
        `/api/leads/${leadId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update lead");
    }
  },

  // Delete lead
  async deleteLead(leadId) {
    try {
      const response = await axiosInstance.delete(`/api/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete lead");
    }
  },

  // Add lead activity
  async addLeadActivity(leadId, activityData) {
    try {
      const response = await axiosInstance.post(
        `/api/leads/${leadId}/activities`,
        activityData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add lead activity"
      );
    }
  },

  // Export leads
  async exportLeads(options = {}) {
    try {
      const response = await axiosInstance.get("/api/leads/export", {
        params: options,
        responseType: "blob",
      });
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to export leads"
      );
    }
  },

  // Legacy methods for backward compatibility
  async getLeads(filters = {}) {
    return this.getAllLeads(filters);
  },

  // Get all applications
  async getApplications(filters = {}) {
    try {
      const response = await axiosInstance.get("/api/applications", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  },
};
