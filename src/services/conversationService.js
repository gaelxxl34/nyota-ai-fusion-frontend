/**
 * Conversation Management Service
 * Handles conversation state management and API interactions
 */

import { axiosInstance } from "./axiosConfig";
import ChatMessageHandler from "./chatMessageHandler";

class ConversationService {
  /**
   * Fetch conversations from backend API with pagination
   */
  static async fetchConversations(options = {}) {
    const {
      limit = 25, // Reduced from loading all at once
      offset = 0,
      status = "active",
      includeClosed = false,
      leadStatus = null, // New: filter by lead status
    } = options;

    console.log(
      `🔄 Fetching conversations from backend (limit: ${limit}, offset: ${offset}, leadStatus: ${leadStatus})...`
    );

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        status,
        includeClosed: includeClosed.toString(),
      });

      // Add leadStatus if provided
      if (leadStatus) {
        params.append("leadStatus", leadStatus);
      }

      const response = await axiosInstance.get(
        `/api/whatsapp/conversations?${params}`
      );
      console.log("📡 Backend API Response:", response.data);

      if (response.data.success) {
        const apiConversations = response.data.conversations || [];
        const pagination = response.data.pagination || {};

        console.log(
          `📋 Found ${apiConversations.length} conversations from backend (hasMore: ${pagination.hasMore}, nextOffset: ${pagination.nextOffset})`
        );

        const processedData = this.processConversationsData(apiConversations);

        // Convert Maps to array format
        // First check if we have conversationMetadataMap which contains ALL conversations
        const metadataMap = processedData.conversationMetadataMap || new Map();
        const conversationsMap = processedData.conversationsMap || new Map();
        const unreadCountsMap = processedData.unreadCountsMap || new Map();

        console.log("Processing Maps:", {
          metadataSize: metadataMap.size,
          conversationsSize: conversationsMap.size,
          unreadCountsSize: unreadCountsMap.size,
        });

        // Use metadataMap as the source of truth for all conversations
        const conversations = Array.from(metadataMap.entries()).map(
          ([phoneNumber, metadata]) => {
            const messages = conversationsMap.get(phoneNumber) || [];
            const unreadCount = unreadCountsMap.get(phoneNumber) || 0;
            const lastMessage =
              messages.length > 0 ? messages[messages.length - 1] : null;

            return {
              id: phoneNumber,
              phoneNumber,
              contactName:
                metadata.contactName || `Contact ${phoneNumber.slice(-4)}`,
              leadName: metadata.leadName || null,
              leadId: metadata.leadId || null,
              leadStatus: metadata.leadStatus || "NO_LEAD",
              lastMessage: lastMessage?.content || "No messages",
              lastMessageTime:
                lastMessage?.timestamp ||
                metadata.lastMessageTime ||
                new Date(),
              lastMessageFrom: lastMessage?.sender || null,
              messageCount: messages.length,
              status: metadata.status || "active",
              unreadCount: unreadCount,
              aiEnabled: metadata.aiEnabled !== false,
              createdAt: metadata.createdAt || new Date(),
              updatedAt: metadata.updatedAt || new Date(),
              responsesCount:
                messages.filter((msg) => msg.sender === "business").length || 0,
            };
          }
        );

        return {
          conversations,
          pagination: {
            hasMore: pagination.hasMore || false,
            limit: pagination.limit || limit,
            offset: pagination.offset || offset,
            nextOffset: pagination.nextOffset || offset + limit,
            totalCount: pagination.totalCount || 0,
            totalFetched: pagination.totalFetched || apiConversations.length,
            currentPage: pagination.currentPage || 1,
          },
        };
      }

      return {
        conversationsMap: new Map(),
        unreadCountsMap: new Map(),
        conversationMetadataMap: new Map(),
        pagination: {
          hasMore: false,
          limit,
          offset,
          nextOffset: offset,
          totalCount: 0,
          totalFetched: 0,
          currentPage: 1,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      throw error;
    }
  }

  /**
   * Process conversations data from API
   */
  static processConversationsData(apiConversations) {
    const conversationsMap = new Map();
    const unreadCountsMap = new Map();
    const conversationMetadataMap = new Map();

    for (const conversation of apiConversations) {
      const phoneNumber = ChatMessageHandler.normalizePhoneNumber(
        conversation.phoneNumber
      );

      if (!phoneNumber) {
        console.log(
          `⚠️ Skipping conversation ${conversation.id} - invalid phone number: ${conversation.phoneNumber}`
        );
        continue;
      }

      // Store conversation metadata including contact name
      conversationMetadataMap.set(phoneNumber, {
        id: conversation.id,
        contactName: conversation.contactName,
        contactId: conversation.contactId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      });

      console.log(
        `📞 Processing conversation for ${phoneNumber}, ID: ${
          conversation.id
        }, Contact: ${conversation.contactName || "Unknown"}`
      );

      // Fetch messages for this conversation
      this.fetchMessagesForConversation(
        conversation.id,
        phoneNumber,
        conversationsMap,
        unreadCountsMap
      );
    }

    return { conversationsMap, unreadCountsMap, conversationMetadataMap };
  }

  /**
   * Fetch messages for a specific conversation
   */
  static async fetchMessagesForConversation(
    conversationId,
    phoneNumber,
    conversationsMap,
    unreadCountsMap
  ) {
    try {
      const messagesResponse = await axiosInstance.get(
        `/api/whatsapp/conversations/${phoneNumber}/messages?limit=50`
      );

      if (messagesResponse.data.success) {
        const messages = messagesResponse.data.messages || [];
        console.log(
          `📨 Found ${messages.length} messages for conversation ${conversationId}`
        );

        // Process messages
        const processedMessages = messages
          .map((msg) => ChatMessageHandler.createMessageObject(msg))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        conversationsMap.set(phoneNumber, processedMessages);

        // Calculate unread count (messages from customer that are unread)
        const unreadCount = processedMessages.filter(
          (msg) =>
            msg.sender === "customer" && (!msg.status || msg.status !== "read")
        ).length;

        if (unreadCount > 0) {
          unreadCountsMap.set(phoneNumber, unreadCount);
          console.log(`📊 ${unreadCount} unread messages for ${phoneNumber}`);
        }
      }
    } catch (error) {
      console.error(
        `❌ Error fetching messages for conversation ${conversationId}:`,
        error
      );
      // Set empty messages array on error
      conversationsMap.set(phoneNumber, []);
    }
  }

  /**
   * Send message to a conversation
   */
  static async sendMessage(phoneNumber, messageText) {
    if (!phoneNumber || !messageText.trim()) {
      throw new Error("Phone number and message text are required");
    }

    try {
      console.log(`📤 Sending message to ${phoneNumber}: ${messageText}`);

      const response = await axiosInstance.post("/api/whatsapp/send-message", {
        phoneNumber: phoneNumber,
        message: messageText,
        messageType: "text",
      });

      if (response.data.success) {
        console.log("✅ Message sent successfully:", response.data);
        return {
          success: true,
          messageId: response.data.messageId,
          data: response.data,
        };
      } else {
        throw new Error(response.data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw new Error(
        error.response?.data?.error || error.message || "Failed to send message"
      );
    }
  }

  /**
   * Switch to a conversation
   */
  static switchConversation(
    phoneNumber,
    conversations,
    setActiveConversation,
    setChatMessages,
    setUnreadCounts
  ) {
    if (!phoneNumber) {
      console.warn(
        "⚠️ Cannot switch to conversation - phone number is null/empty"
      );
      return;
    }

    console.log(`🔄 Switching to conversation: ${phoneNumber}`);
    setActiveConversation(phoneNumber);

    const messages = conversations.get(phoneNumber) || [];
    setChatMessages([...messages]);

    // Mark messages as read
    setUnreadCounts((prev) => {
      const newCounts = new Map(prev);
      newCounts.set(phoneNumber, 0);
      return newCounts;
    });
  }

  /**
   * Get profile name for a conversation
   */
  static getProfileName(phoneNumber, conversationMetadata) {
    const metadata = conversationMetadata.get(phoneNumber);
    return (
      metadata?.contactName || `Contact ${phoneNumber?.slice(-4) || "Unknown"}`
    );
  }

  /**
   * Get conversations list for display
   */
  static getConversationsList(
    conversations,
    unreadCounts,
    conversationMetadata,
    searchTerm = ""
  ) {
    const conversationList = [];

    for (const [phoneNumber, messages] of conversations.entries()) {
      const metadata = conversationMetadata.get(phoneNumber);
      const profileName =
        metadata?.contactName || `Contact ${phoneNumber.slice(-4)}`;
      const unreadCount = unreadCounts.get(phoneNumber) || 0;

      // Filter by search term
      if (
        searchTerm &&
        !profileName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !phoneNumber.includes(searchTerm)
      ) {
        continue;
      }

      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      conversationList.push({
        phoneNumber,
        conversationId: metadata?.id, // Add conversation ID for unique identification
        profileName,
        lastMessage,
        unreadCount,
        messageCount: messages.length,
        metadata,
      });
    }

    // Sort by last message timestamp (most recent first)
    return conversationList.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || new Date(0);
      const timeB = b.lastMessage?.timestamp || new Date(0);
      return new Date(timeB) - new Date(timeA);
    });
  }

  /**
   * Get messages for a specific conversation
   */
  static async getConversationMessages(phoneNumber, options = {}) {
    const { limit = 50, offset = 0 } = options;

    console.log(`🔄 Fetching messages for conversation: ${phoneNumber}`);

    try {
      const response = await axiosInstance.get(
        `/api/whatsapp/conversations/${encodeURIComponent(
          phoneNumber
        )}/messages`,
        {
          params: { limit, offset },
        }
      );

      if (response.data.success) {
        console.log(
          `✅ Loaded ${response.data.messages.length} messages for ${phoneNumber}`
        );
        return {
          messages: response.data.messages || [],
          phoneNumber: response.data.phoneNumber,
          conversationId: response.data.conversationId,
          pagination: response.data.pagination || {},
        };
      }

      return {
        messages: [],
        phoneNumber,
        conversationId: null,
        pagination: {},
      };
    } catch (error) {
      console.error(`❌ Error fetching messages for ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Toggle auto-reply for a conversation
   */
  static toggleAutoReply(phoneNumber, autoReplySettings, setAutoReplySettings) {
    setAutoReplySettings((prev) => {
      const newSettings = new Map(prev);
      const currentSetting = newSettings.get(phoneNumber) || false;
      newSettings.set(phoneNumber, !currentSetting);
      console.log(
        `🤖 Auto-reply for ${phoneNumber}: ${
          !currentSetting ? "enabled" : "disabled"
        }`
      );
      return newSettings;
    });
  }

  /**
   * Clear all messages from a conversation (keep conversation)
   */
  static async clearConversationMessages(phoneNumber) {
    console.log(`🧹 Clearing messages for phone: ${phoneNumber}`);
    try {
      const encodedPhoneNumber = encodeURIComponent(phoneNumber);
      const response = await axiosInstance.patch(
        `/api/whatsapp/conversations/phone/${encodedPhoneNumber}/clear`
      );
      console.log("✅ Messages cleared successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error clearing messages:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation by conversation ID
   */
  static async deleteConversation(conversationId) {
    console.log(`🗑️ Deleting conversation: ${conversationId}`);
    try {
      const response = await axiosInstance.delete(
        `/api/whatsapp/conversations/${conversationId}`
      );
      console.log("✅ Conversation deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Delete a conversation by phone number
   */
  static async deleteConversationByPhone(phoneNumber) {
    console.log(`🗑️ Deleting conversation for phone: ${phoneNumber}`);
    try {
      const encodedPhoneNumber = encodeURIComponent(phoneNumber);
      const response = await axiosInstance.delete(
        `/api/whatsapp/conversations/phone/${encodedPhoneNumber}`
      );
      console.log("✅ Conversation deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting conversation by phone:", error);
      throw error;
    }
  }

  /**
   * Delete multiple conversations
   */
  static async deleteMultipleConversations(conversationIds) {
    console.log(`🗑️ Deleting ${conversationIds.length} conversations`);
    try {
      const response = await axiosInstance.delete(
        "/api/whatsapp/conversations",
        {
          data: { conversationIds },
        }
      );
      console.log(
        "✅ Multiple conversations deleted successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting multiple conversations:", error);
      throw error;
    }
  }

  /**
   * Delete conversation and update local state
   */
  static async deleteConversationWithStateUpdate(
    phoneNumber,
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    clearMessages
  ) {
    try {
      // Delete from backend
      await this.deleteConversationByPhone(phoneNumber);

      // Update local conversations state
      const updatedConversations = conversations.filter(
        (conv) => conv.phoneNumber !== phoneNumber
      );
      setConversations(updatedConversations);

      // Clear selected conversation if it was deleted
      if (selectedConversation?.phoneNumber === phoneNumber) {
        setSelectedConversation(null);
        if (clearMessages) {
          clearMessages();
        }
      }

      console.log(
        `✅ Conversation for ${phoneNumber} deleted and state updated`
      );
      return true;
    } catch (error) {
      console.error("❌ Error deleting conversation with state update:", error);
      throw error;
    }
  }
}

export default ConversationService;
