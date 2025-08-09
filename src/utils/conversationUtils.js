/**
 * Utility functions for conversation management
 * Provides common operations and data transformations
 */

/**
 * Generate CSV content from conversations data
 */
export const generateCSVExport = (conversations) => {
  const csvData = conversations.map((conv) => ({
    "Contact Name": conv.contactName || "Unknown",
    "Lead Name": conv.leadName || "N/A",
    "Phone Number": conv.phoneNumber || "N/A",
    Status: conv.status || "active",
    "Lead Status": conv.leadStatus || "NO_LEAD",
    "Message Count": conv.messageCount || 0,
    "Unread Count": conv.unreadCount || 0,
    "Last Message": (conv.lastMessage || "No messages").replace(/,/g, ";"),
    "Last Message Time": new Date(
      conv.lastMessageTime || new Date()
    ).toLocaleString(),
    "Last Message From": conv.lastMessageFrom || "N/A",
    "AI Enabled": conv.aiEnabled ? "Yes" : "No",
    "Lead ID": conv.leadId || "N/A",
    "Contact ID": conv.contactId || "N/A",
    "Created At": new Date(conv.createdAt || new Date()).toLocaleString(),
    "Updated At": new Date(conv.updatedAt || new Date()).toLocaleString(),
  }));

  if (csvData.length === 0) {
    throw new Error("No conversations to export");
  }

  const csvContent = [
    Object.keys(csvData[0]).join(","),
    ...csvData.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    ),
  ].join("\n");

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "N/A";

  // Remove non-digit characters
  const cleaned = phoneNumber.toString().replace(/\D/g, "");

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phoneNumber; // Return original if we can't format
};

/**
 * Get lead status color
 */
export const getLeadStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "new":
      return "info";
    case "qualified":
      return "success";
    case "contacted":
      return "warning";
    case "converted":
      return "success";
    case "lost":
      return "error";
    default:
      return "default";
  }
};

/**
 * Get conversation status color
 */
export const getConversationStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "inactive":
      return "default";
    case "closed":
      return "error";
    default:
      return "primary";
  }
};

/**
 * Calculate conversation statistics
 */
export const calculateConversationStats = (conversations) => {
  if (!Array.isArray(conversations)) return null;

  const stats = {
    total: conversations.length,
    active: 0,
    totalLeads: 0,
    responseRate: 0,
    issues: 0,
    totalMessages: 0,
    totalResponses: 0,
  };

  conversations.forEach((conv) => {
    // Active conversations (those with activity in last 24 hours)
    const lastMessageTime = new Date(conv.lastMessageTime || 0);
    const isActive =
      Date.now() - lastMessageTime.getTime() <= 24 * 60 * 60 * 1000;
    if (isActive) stats.active++;

    // Total leads (conversations with assigned leads)
    if (conv.leadId && conv.leadStatus !== "NO_LEAD") {
      stats.totalLeads++;
    }

    // Message counts for response rate
    const messageCount = conv.messageCount || 0;
    const responsesCount = conv.responsesCount || 0; // Assuming this exists in your data
    stats.totalMessages += messageCount;
    stats.totalResponses += responsesCount;

    // Issues (unread messages or pending responses)
    if ((conv.unreadCount || 0) > 0 || (conv.pendingResponses || 0) > 0) {
      stats.issues++;
    }
  });

  // Calculate response rate
  stats.responseRate =
    stats.totalMessages > 0
      ? Math.round((stats.totalResponses / stats.totalMessages) * 100)
      : 0;
  stats.avgMessagesPerConversation =
    stats.total > 0 ? Math.round(stats.totalMessages / stats.total) : 0;

  return stats;
};

/**
 * Format relative time
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Unknown";

  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now - messageTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return messageTime.toLocaleDateString();
};

/**
 * Debounce function for search input
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;

  // Basic validation - adjust based on your requirements
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return (
    phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, "").length >= 10
  );
};

/**
 * Sanitize text for CSV export
 */
export const sanitizeForCSV = (text) => {
  if (!text) return "";
  return text.toString().replace(/,/g, ";").replace(/"/g, '""');
};

/**
 * Get display name for conversation
 */
export const getConversationDisplayName = (conversation) => {
  return (
    conversation.leadName ||
    conversation.contactName ||
    `Contact ${conversation.phoneNumber?.slice(-4) || "Unknown"}`
  );
};

/**
 * Check if conversation matches search query
 */
export const matchesSearchQuery = (conversation, query) => {
  if (!query.trim()) return true;

  const searchText = query.toLowerCase();
  const searchFields = [
    conversation.contactName,
    conversation.leadName,
    conversation.phoneNumber,
    conversation.lastMessage,
    conversation.leadId,
    conversation.status,
  ];

  return searchFields.some(
    (field) => field && field.toString().toLowerCase().includes(searchText)
  );
};
