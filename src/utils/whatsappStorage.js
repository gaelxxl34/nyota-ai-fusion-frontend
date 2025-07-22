/**
 * WhatsApp Local Storage Utility
 * Manages storing and retrieving WhatsApp conversations and messages from localStorage
 */

const STORAGE_KEYS = {
  CONVERSATIONS: "whatsapp_conversations",
  MESSAGES: "whatsapp_messages",
  CONFIG: "whatsapp_config",
  LAST_SYNC: "whatsapp_last_sync",
  SETTINGS: "whatsapp_storage_settings",
};

const DEFAULT_SETTINGS = {
  maxMessagesPerConversation: 100, // Keep only last 100 messages per conversation
  maxConversations: 50, // Keep only 50 conversations
  syncInterval: 30000, // Sync every 30 seconds
  retentionDays: 30, // Keep messages for 30 days
  enableOfflineMode: true,
};

class WhatsAppStorage {
  constructor() {
    this.settings = this.getSettings();
  }

  // Settings Management
  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
        : DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error loading storage settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(this.settings)
      );
      return true;
    } catch (error) {
      console.error("Error updating storage settings:", error);
      return false;
    }
  }

  // Conversations Management
  getConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!stored) return [];

      const conversations = JSON.parse(stored);
      // Sort by last message time
      return conversations.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
    } catch (error) {
      console.error("Error loading conversations from storage:", error);
      return [];
    }
  }

  saveConversations(conversations) {
    try {
      // Limit number of conversations stored
      const limitedConversations = conversations
        .sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        )
        .slice(0, this.settings.maxConversations);

      localStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(limitedConversations)
      );
      this.updateLastSync();
      return true;
    } catch (error) {
      console.error("Error saving conversations to storage:", error);
      return false;
    }
  }

  updateConversation(conversationId, updates) {
    try {
      const conversations = this.getConversations();
      const index = conversations.findIndex(
        (conv) => conv.id === conversationId
      );

      if (index !== -1) {
        conversations[index] = { ...conversations[index], ...updates };
        return this.saveConversations(conversations);
      }
      return false;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return false;
    }
  }

  // Messages Management
  getMessages(conversationId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!stored) return [];

      const allMessages = JSON.parse(stored);
      const conversationMessages = allMessages[conversationId] || [];

      // Sort by timestamp
      return conversationMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    } catch (error) {
      console.error("Error loading messages from storage:", error);
      return [];
    }
  }

  saveMessages(conversationId, messages) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const allMessages = stored ? JSON.parse(stored) : {};

      // Apply retention policy - keep only recent messages
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.settings.retentionDays);

      const filteredMessages = messages
        .filter((msg) => new Date(msg.timestamp) > cutoffDate)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, this.settings.maxMessagesPerConversation);

      allMessages[conversationId] = filteredMessages;
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
      return true;
    } catch (error) {
      console.error("Error saving messages to storage:", error);
      return false;
    }
  }

  addMessage(conversationId, message) {
    try {
      const existingMessages = this.getMessages(conversationId);

      // Check if message already exists (prevent duplicates)
      const messageExists = existingMessages.some(
        (msg) =>
          msg.id === message.id ||
          (msg.timestamp === message.timestamp &&
            msg.content === message.content)
      );

      if (!messageExists) {
        existingMessages.push(message);
        return this.saveMessages(conversationId, existingMessages);
      }
      return true;
    } catch (error) {
      console.error("Error adding message to storage:", error);
      return false;
    }
  }

  // Sync Management
  getLastSync() {
    try {
      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return null;
    }
  }

  updateLastSync() {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      return true;
    } catch (error) {
      console.error("Error updating last sync time:", error);
      return false;
    }
  }

  shouldSync() {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;

    const timeSinceSync = Date.now() - lastSync.getTime();
    return timeSinceSync >= this.settings.syncInterval;
  }

  // Configuration Management
  getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading config from storage:", error);
      return null;
    }
  }

  saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error("Error saving config to storage:", error);
      return false;
    }
  }

  // Storage Management
  getStorageInfo() {
    try {
      const conversations = this.getConversations();
      const allMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messagesData = allMessages ? JSON.parse(allMessages) : {};

      let totalMessages = 0;
      Object.keys(messagesData).forEach((convId) => {
        totalMessages += messagesData[convId].length;
      });

      const storageSize = this.calculateStorageSize();

      return {
        conversationCount: conversations.length,
        totalMessages,
        storageSize,
        lastSync: this.getLastSync(),
        settings: this.settings,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return null;
    }
  }

  calculateStorageSize() {
    try {
      let totalSize = 0;
      Object.keys(STORAGE_KEYS).forEach((key) => {
        const item = localStorage.getItem(STORAGE_KEYS[key]);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      });
      return totalSize;
    } catch (error) {
      console.error("Error calculating storage size:", error);
      return 0;
    }
  }

  clearStorage() {
    try {
      Object.keys(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(STORAGE_KEYS[key]);
      });
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  }

  // Offline Detection
  isOnline() {
    return navigator.onLine;
  }

  // Export/Import for backup
  exportData() {
    try {
      const data = {};
      Object.keys(STORAGE_KEYS).forEach((key) => {
        const item = localStorage.getItem(STORAGE_KEYS[key]);
        if (item) {
          data[key] = JSON.parse(item);
        }
      });

      return {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data,
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  }

  importData(exportedData) {
    try {
      if (!exportedData || !exportedData.data) {
        throw new Error("Invalid export data format");
      }

      Object.keys(exportedData.data).forEach((key) => {
        if (STORAGE_KEYS[key]) {
          localStorage.setItem(
            STORAGE_KEYS[key],
            JSON.stringify(exportedData.data[key])
          );
        }
      });

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }
}

// Create and export singleton instance
const whatsappStorage = new WhatsAppStorage();
export default whatsappStorage;
