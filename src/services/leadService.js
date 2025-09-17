import { axiosInstance } from "./axiosConfig";

export const leadService = {
  // Get all leads with optimized pagination and filters
  async getAllLeads(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status,
        source,
        search,
        name,
        email,
        phone,
        program,
        dateRange,
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

      // Advanced search parameters
      if (name?.trim()) params.name = name.trim();
      if (email?.trim()) params.email = email.trim();
      if (phone?.trim()) params.phone = phone.trim();
      if (program?.trim()) params.program = program.trim();
      if (dateRange) params.dateRange = dateRange;

      const response = await axiosInstance.get("/api/leads", { params });

      if (!response) {
        throw new Error("Network error: No response received from server");
      }

      console.log(
        `📡 Leads API Response: ${response?.data?.data?.length || 0} leads`
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
      const {
        limit = 50,
        offset = 0,
        name,
        email,
        phone,
        program,
        source,
        dateRange,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      console.log(`🔄 Fetching leads by status: ${status}`);

      const params = {
        status,
        limit,
        offset,
        sortBy,
        sortOrder,
      };

      // Add search parameters
      if (name?.trim()) params.name = name.trim();
      if (email?.trim()) params.email = email.trim();
      if (phone?.trim()) params.phone = phone.trim();
      if (program?.trim()) params.program = program.trim();
      if (source?.trim()) params.source = source.trim();
      if (dateRange) params.dateRange = dateRange;

      const response = await axiosInstance.get("/api/leads", { params });

      if (!response) {
        throw new Error("Network error: No response received from server");
      }

      console.log(
        `📡 Status-filtered leads: ${response?.data?.data?.length || 0} leads`
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
  async createLead(leadData, userInfo = null) {
    try {
      // Extract contactInfo and separate additional data
      const { name, phone, email, ...additionalData } = leadData;

      const contactInfo = { name, phone, email };

      // Include user info if provided
      const requestData = {
        contactInfo,
        ...additionalData,
      };

      if (userInfo) {
        requestData.submittedBy = {
          uid: userInfo.uid,
          email: userInfo.email,
          name: userInfo.displayName || userInfo.email,
          role: userInfo.role,
          submittedAt: new Date().toISOString(),
        };
      }

      const response = await axiosInstance.post("/api/leads", requestData);
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

  // Get interactions for a lead
  async getInteractions(leadId, options = {}) {
    try {
      const { type, outcome, agent, limit = 50, offset = 0 } = options;
      const params = new URLSearchParams();

      if (type) params.append("type", type);
      if (outcome) params.append("outcome", outcome);
      if (agent) params.append("agent", agent);
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const response = await axiosInstance.get(
        `/api/leads/${leadId}/interactions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get interactions"
      );
    }
  },

  // Get lead statistics
  async getLeadStats(timeFrame = "week") {
    try {
      const response = await axiosInstance.get(`/api/leads/stats`, {
        params: { timeFrame },
      });

      if (!response) {
        throw new Error("Network error: No response received from server");
      }

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
  async contactLeadViaWhatsApp(
    contactInfo,
    message,
    userInfo = null,
    options = {}
  ) {
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
        const newLead = await this.createLead(
          {
            ...contactInfo,
            source: "MANUAL",
            notes: "Lead created from inquiry form",
          },
          userInfo
        );
        lead = newLead.data;
      }

      let messageResult;

      if (options.templateName) {
        // Use template message endpoint - server will enforce template content
        const payload = {
          to: contactInfo.phone,
          templateName: options.templateName,
          leadData: {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
          },
        };
        const response = await axiosInstance.post(
          "/api/whatsapp/send-template-message",
          payload
        );
        messageResult = response.data;
      } else {
        // Send WhatsApp message with lead data as plain text
        messageResult = await this.sendWhatsAppMessage(
          contactInfo.phone,
          message,
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
          }
        );
      }

      // Only add interaction record for successful delivery - don't change status
      if (
        messageResult.success &&
        (messageResult.delivered || messageResult.templateName)
      ) {
        // Add interaction record for successful delivery
        await this.addInteraction(lead.id, {
          type: "WHATSAPP",
          content: options.templateName
            ? `[TEMPLATE:${options.templateName}] ${message}`
            : message,
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

      if (!response) {
        throw new Error("Network error: No response received from server");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch applications"
      );
    }
  },

  // Get leads submitted by current user (for "For You" tab)
  async getMySubmittedLeads(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        name,
        email,
        phone,
        program,
        source,
        dateRange,
        sortBy = "createdAt",
        sortOrder = "desc",
        all = false,
      } = options;
      const params = { page, limit, sortBy, sortOrder };
      if (all) params.all = true;

      if (status) {
        params.status = status;
      }

      // Add search parameters
      if (name?.trim()) params.name = name.trim();
      if (email?.trim()) params.email = email.trim();
      if (phone?.trim()) params.phone = phone.trim();
      if (program?.trim()) params.program = program.trim();
      if (source?.trim()) params.source = source.trim();
      if (dateRange) params.dateRange = dateRange;

      const response = await axiosInstance.get("/api/leads/my-submissions", {
        params,
      });

      if (!response) {
        throw new Error("Network error: No response received from server");
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch your submitted leads"
      );
    }
  },

  // Lead Assignment Methods

  // Assign a lead to a user
  async assignLead(leadId, assignTo, notes = "") {
    try {
      const response = await axiosInstance.post(
        `/api/lead-assignment/${leadId}`,
        {
          assignTo,
          notes,
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error assigning lead:", error);
      throw new Error(error.response?.data?.message || "Failed to assign lead");
    }
  },

  // Bulk assign leads to a user
  async bulkAssignLeads(leadIds, assignTo, notes = "") {
    try {
      const response = await axiosInstance.post(`/api/lead-assignment/bulk`, {
        leadIds,
        assignTo,
        notes,
      });

      return response.data;
    } catch (error) {
      console.error("❌ Error bulk assigning leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to bulk assign leads"
      );
    }
  },

  // Get assigned leads for current user
  async getMyAssignedLeads(options = {}) {
    try {
      const {
        status,
        sortBy = "updatedAt",
        sortOrder = "desc",
        limit = 100,
        offset = 0,
      } = options;

      const params = { sortBy, sortOrder, limit, offset };
      if (status) params.status = status;

      const response = await axiosInstance.get(
        `/api/lead-assignment/my-assignments`,
        {
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching assigned leads:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch assigned leads"
      );
    }
  },

  // Get lead assignment history
  async getLeadAssignmentHistory(leadId) {
    try {
      const response = await axiosInstance.get(
        `/api/lead-assignment/${leadId}/history`
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching lead assignment history:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch lead assignment history"
      );
    }
  },

  // Get available agents for assignment
  async getAvailableAgents() {
    try {
      const response = await axiosInstance.get(
        `/api/lead-assignment/available-agents`
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching available agents:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch available agents"
      );
    }
  },
};
