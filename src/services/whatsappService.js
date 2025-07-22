import { axiosInstance as axios } from "./axiosConfig";
import whatsappStorage from "../utils/whatsappStorage";

class WhatsAppService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupOnlineListener();
  }

  setupOnlineListener() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("📶 Connection restored - syncing data...");
      this.syncWithServer();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("📱 Offline mode activated");
    });
  }

  // Get all WhatsApp conversations with local storage integration
  async getConversations() {
    try {
      // Always return local data first for immediate UI update
      const localConversations = whatsappStorage.getConversations();

      if (!this.isOnline) {
        console.log("📱 Offline - returning cached conversations");
        return {
          success: true,
          conversations: localConversations,
          source: "cache",
          isOffline: true,
        };
      }

      // If online and should sync, fetch from server
      if (whatsappStorage.shouldSync()) {
        try {
          console.log("🔄 Syncing conversations with server...");
          const response = await axios.get("/api/whatsapp/conversations");

          if (
            response.data &&
            response.data.success &&
            response.data.conversations
          ) {
            // Merge server data with local data
            const mergedConversations = this.mergeConversations(
              localConversations,
              response.data.conversations
            );

            // Save to local storage
            whatsappStorage.saveConversations(mergedConversations);

            console.log("✅ Conversations synced and cached");
            return {
              success: true,
              conversations: mergedConversations,
              source: "server",
              synced: true,
            };
          }
        } catch (error) {
          console.warn("⚠️ Server sync failed, using cached data:", error);
        }
      }

      // Return local data if sync not needed or failed
      return {
        success: true,
        conversations: localConversations,
        source: "cache",
        lastSync: whatsappStorage.getLastSync(),
      };
    } catch (error) {
      console.error("Error fetching WhatsApp conversations:", error);
      return {
        success: false,
        error: error.message,
        conversations: whatsappStorage.getConversations(), // Fallback to local
      };
    }
  }

  // Get messages for a specific conversation with local storage
  async getMessages(conversationId) {
    try {
      // Always return local data first
      const localMessages = whatsappStorage.getMessages(conversationId);

      if (!this.isOnline) {
        console.log(
          `📱 Offline - returning cached messages for ${conversationId}`
        );
        return {
          success: true,
          messages: localMessages,
          source: "cache",
          isOffline: true,
        };
      }

      // If online, try to sync new messages
      try {
        const lastMessage =
          localMessages.length > 0
            ? localMessages[localMessages.length - 1]
            : null;

        let endpoint = `/api/whatsapp/conversations/${conversationId}/messages`;
        if (lastMessage) {
          endpoint += `?since=${lastMessage.timestamp}`;
        }

        console.log(`🔄 Fetching new messages for ${conversationId}...`);
        const response = await axios.get(endpoint);

        if (response.data && response.data.success && response.data.messages) {
          // Merge new messages with local messages
          const mergedMessages = this.mergeMessages(
            localMessages,
            response.data.messages
          );

          // Save to local storage
          whatsappStorage.saveMessages(conversationId, mergedMessages);

          console.log(`✅ Messages synced for ${conversationId}`);
          return {
            success: true,
            messages: mergedMessages,
            source: "server",
            newMessages: response.data.messages.length,
          };
        }
      } catch (error) {
        console.warn(
          `⚠️ Server sync failed for messages ${conversationId}, using cached:`,
          error
        );
      }

      // Return local data if sync failed or no new messages
      return {
        success: true,
        messages: localMessages,
        source: "cache",
      };
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      return {
        success: false,
        error: error.message,
        messages: whatsappStorage.getMessages(conversationId), // Fallback to local
      };
    }
  }

  // Send a WhatsApp message with local storage integration
  async sendMessage(to, message, messageType = "text") {
    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        content: message,
        sender: "agent",
        timestamp: new Date().toISOString(),
        status: "sending",
        isOptimistic: true,
      };

      // Find conversation and add optimistic message
      const conversations = whatsappStorage.getConversations();
      const conversation = conversations.find(
        (conv) => conv.phoneNumber === to || conv.to === to
      );

      if (conversation) {
        whatsappStorage.addMessage(conversation.id, optimisticMessage);

        // Update conversation last message
        whatsappStorage.updateConversation(conversation.id, {
          lastMessage: message,
          lastMessageTime: optimisticMessage.timestamp,
        });
      }

      if (!this.isOnline) {
        // Queue message for later sending
        this.queueMessage(to, message, messageType);
        return {
          success: false,
          error: "Offline - message queued for sending",
          queued: true,
          optimisticMessage,
        };
      }

      // Send to server
      const response = await axios.post("/api/whatsapp/send-message", {
        to,
        message,
        messageType,
      });

      if (response.data && response.data.success) {
        // Replace optimistic message with real message
        if (conversation && response.data.messageId) {
          const realMessage = {
            ...optimisticMessage,
            id: response.data.messageId,
            status: "sent",
            isOptimistic: false,
          };

          // Update in storage
          const messages = whatsappStorage.getMessages(conversation.id);
          const updatedMessages = messages.map((msg) =>
            msg.id === optimisticMessage.id ? realMessage : msg
          );
          whatsappStorage.saveMessages(conversation.id, updatedMessages);
        }

        return response.data;
      } else {
        // Mark optimistic message as failed
        if (conversation) {
          const messages = whatsappStorage.getMessages(conversation.id);
          const updatedMessages = messages.map((msg) =>
            msg.id === optimisticMessage.id ? { ...msg, status: "failed" } : msg
          );
          whatsappStorage.saveMessages(conversation.id, updatedMessages);
        }

        return (
          response.data || { success: false, error: "Failed to send message" }
        );
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mark conversation as read with local storage
  async markConversationAsRead(conversationId) {
    try {
      // Update local storage immediately
      whatsappStorage.updateConversation(conversationId, {
        unreadCount: 0,
        lastReadTime: new Date().toISOString(),
      });

      if (this.isOnline) {
        // Sync with server
        const response = await axios.patch(
          `/api/whatsapp/conversations/${conversationId}/mark-read`
        );
        return response.data;
      }

      return { success: true, source: "cache" };
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      return { success: false, error: error.message };
    }
  }

  // Get WhatsApp configuration with local storage
  async getConfig() {
    try {
      // Check local storage first
      const localConfig = whatsappStorage.getConfig();

      if (!this.isOnline) {
        return {
          success: true,
          config: localConfig,
          source: "cache",
        };
      }

      // Fetch from server if online
      const response = await axios.get("/api/whatsapp/config");

      if (response.data && response.data.success) {
        // Save to local storage
        whatsappStorage.saveConfig(response.data.config);
        return response.data;
      }

      // Fallback to local config
      return {
        success: true,
        config: localConfig,
        source: "cache",
      };
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      return {
        success: false,
        error: error.message,
        config: whatsappStorage.getConfig(), // Fallback
      };
    }
  }

  // Format phone number for WhatsApp (remove + and spaces)
  formatPhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^\d]/g, "");
  }

  // Format message timestamp
  formatMessageTime(timestamp) {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now - messageTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  }

  // Get conversation display name
  getConversationDisplayName(conversation) {
    return (
      conversation.contactName ||
      conversation.customerName ||
      conversation.metadata?.profileName ||
      `WhatsApp User ${conversation.phoneNumber?.slice(-4) || "Unknown"}`
    );
  }

  // Get message status icon
  getMessageStatusIcon(status) {
    switch (status) {
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓"; // In real implementation, this would be blue
      case "failed":
        return "❌";
      default:
        return "⏳";
    }
  }

  // Check if message is from customer or AI
  isCustomerMessage(message) {
    return message.sender === "customer";
  }

  // Check if message is from AI
  isAIMessage(message) {
    return message.sender === "ai";
  }

  // Get avatar URL for conversation
  getConversationAvatar(conversation) {
    // Return a default WhatsApp-style avatar
    // You can enhance this to use actual profile pictures if available
    const firstLetter = this.getConversationDisplayName(conversation)
      .charAt(0)
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=25D366&color=fff&size=40`;
  }

  // Poll for new messages (for real-time updates)
  startPolling(conversationId, callback, interval = 5000) {
    const poll = async () => {
      try {
        const result = await this.getMessages(conversationId);
        callback(result.messages);
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber) {
    const cleaned = this.formatPhoneNumber(phoneNumber);
    return cleaned.length >= 8 && cleaned.length <= 15;
  }

  // Extract message preview for conversation list
  getMessagePreview(content, maxLength = 50) {
    if (!content) return "No message";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + "...";
  }

  // Utility methods for merging data
  mergeConversations(localConversations, serverConversations) {
    const merged = [...localConversations];

    serverConversations.forEach((serverConv) => {
      const existingIndex = merged.findIndex(
        (conv) => conv.id === serverConv.id
      );

      if (existingIndex !== -1) {
        // Update existing conversation with server data
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...serverConv,
          // Keep local unread count if it's higher (offline messages)
          unreadCount: Math.max(
            merged[existingIndex].unreadCount || 0,
            serverConv.unreadCount || 0
          ),
        };
      } else {
        // Add new conversation
        merged.push(serverConv);
      }
    });

    return merged;
  }

  mergeMessages(localMessages, serverMessages) {
    const merged = [...localMessages];

    serverMessages.forEach((serverMsg) => {
      const exists = merged.some(
        (msg) =>
          msg.id === serverMsg.id ||
          (msg.timestamp === serverMsg.timestamp &&
            msg.content === serverMsg.content)
      );

      if (!exists) {
        merged.push(serverMsg);
      }
    });

    return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Queue management for offline messages
  queueMessage(phoneNumber, message, messageType = "text") {
    try {
      const queue = JSON.parse(
        localStorage.getItem("whatsapp_message_queue") || "[]"
      );
      queue.push({
        id: Date.now(),
        to: phoneNumber,
        message,
        messageType,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("whatsapp_message_queue", JSON.stringify(queue));
    } catch (error) {
      console.error("Error queuing message:", error);
    }
  }

  // Sync queued messages when online
  async syncQueuedMessages() {
    try {
      const queue = JSON.parse(
        localStorage.getItem("whatsapp_message_queue") || "[]"
      );

      if (queue.length === 0) return;

      console.log(`📤 Syncing ${queue.length} queued messages...`);

      for (const queuedMsg of queue) {
        try {
          await this.sendMessage(
            queuedMsg.to,
            queuedMsg.message,
            queuedMsg.messageType
          );
        } catch (error) {
          console.error("Error sending queued message:", error);
        }
      }

      // Clear queue after sending
      localStorage.removeItem("whatsapp_message_queue");
      console.log("✅ Queued messages synced");
    } catch (error) {
      console.error("Error syncing queued messages:", error);
    }
  }

  // Full sync with server
  async syncWithServer() {
    if (!this.isOnline) return;

    try {
      console.log("🔄 Starting full sync with server...");

      // Sync conversations
      await this.getConversations();

      // Sync queued messages
      await this.syncQueuedMessages();

      // Sync messages for active conversations
      const conversations = whatsappStorage.getConversations();
      for (const conv of conversations.slice(0, 10)) {
        // Sync top 10 conversations
        await this.getMessages(conv.id);
      }

      console.log("✅ Full sync completed");
    } catch (error) {
      console.error("Error during full sync:", error);
    }
  }

  // Storage management methods
  getStorageInfo() {
    return whatsappStorage.getStorageInfo();
  }

  clearStorage() {
    return whatsappStorage.clearStorage();
  }

  updateStorageSettings(settings) {
    return whatsappStorage.updateSettings(settings);
  }

  exportData() {
    return whatsappStorage.exportData();
  }

  importData(data) {
    return whatsappStorage.importData(data);
  }

  // Get queued messages count
  getQueuedMessagesCount() {
    try {
      const queue = JSON.parse(
        localStorage.getItem("whatsapp_message_queue") || "[]"
      );
      return queue.length;
    } catch (error) {
      return 0;
    }
  }
}

const whatsappServiceInstance = new WhatsAppService();
export default whatsappServiceInstance;
