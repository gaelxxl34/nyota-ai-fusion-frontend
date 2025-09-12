import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import ChatLayout from "../../components/chat/ChatLayout";
import ConversationService from "../../services/conversationService";
import { useAuth } from "../../contexts/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { axiosInstance } from "../../services/axiosConfig";
import Swal from "sweetalert2";
import ChatMessageHandler from "../../services/chatMessageHandler";
import ConversationTabs from "../../components/chat/ConversationTabs";
import TabPanel from "../../components/chat/TabPanel";
import ErrorBoundary from "../../components/chat/ErrorBoundary";

const ChatConfig = () => {
  const { checkLeadStageAccess } = useRolePermissions();
  const { getUserRole, user } = useAuth();
  const userRole = getUserRole();

  // All the same state variables from the original file
  const [conversations, setConversations] = useState(new Map());
  const [conversationMetadata, setConversationMetadata] = useState(new Map());
  const [chatMessages, setChatMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [autoReplySettings, setAutoReplySettings] = useState(new Map());
  const [message, setMessage] = useState("");

  // Debug: Track all message state changes
  useEffect(() => {
    console.log("Message state changed:", message);
  }, [message]);

  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [tabValue, setTabValue] = useState(0);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [aiTyping, setAiTyping] = useState(new Map());
  const [userTyping, setUserTyping] = useState(false);
  // Note: leadStatuses now come directly from conversationMetadata.leadStatus

  // Pagination state
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [loadingMoreConversations, setLoadingMoreConversations] =
    useState(false);

  // Refs
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Define main tabs for each lead status plus Knowledge Base
  const allTabs = useMemo(
    () => [
      {
        label: "New Contact",
        statuses: ["NO_LEAD", "NEW", "INQUIRY", "INITIAL_CONTACT", "PROSPECT"],
        color: "warning.main",
        icon: "👋",
        tabId: "new-contact-tab",
      },
      {
        label: "Contacted",
        statuses: [
          "CONTACTED",
          "CONTACTED_VIA_WHATSAPP",
          "CONTACTED_VIA_PHONE",
          "CONTACTED_VIA_EMAIL",
          "REACHED_OUT",
          "OUTBOUND_CONTACT",
          "FIRST_CONTACT_MADE",
          "CONTACTED_TODAY",
          "CONTACTED_RECENTLY",
        ],
        color: "primary.main",
        icon: "💬",
        tabId: "contacted-tab",
      },
      {
        label: "Interested",
        statuses: [
          "INTERESTED",
          "PRE_QUALIFIED",
          "FOLLOW_UP",
          "HOT",
          "WARM",
          "ENGAGED",
        ],
        color: "info.main",
        icon: "🎯",
        tabId: "prequalified-tab",
      },
      {
        label: "Applied",
        statuses: [
          "APPLIED",
          "REVIEW",
          "PENDING_DOCS",
          "APPLICATION_SUBMITTED",
          "IN_REVIEW",
          "DOCUMENTATION_PENDING",
          "UNDER_REVIEW",
        ],
        color: "success.main",
        icon: "📝",
        tabId: "applied-tab",
      },
      {
        label: "Admitted",
        statuses: [
          "ADMITTED",
          "ENROLLED",
          "SUCCESS",
          "ACCEPTED",
          "COMPLETED",
          "FINALIZED",
        ],
        color: "success.dark",
        icon: "🎉",
        tabId: "admitted-tab",
      },
    ],
    []
  );

  // Filter tabs based on user role permissions - only hide UI tabs, don't filter data
  const getFilteredTabs = () => {
    console.log("🔑 ChatConfig permission check for user:", userRole);

    return allTabs.filter((tab) => {
      // For tabs with statuses, check if user has access to at least one status
      if (tab.statuses && tab.statuses.length > 0) {
        const hasAccess = tab.statuses.some((status) => {
          const access = checkLeadStageAccess(status);
          console.log(`  - Tab ${tab.label}, Status ${status}: ${access}`);
          return access;
        });
        return hasAccess;
      }

      return true;
    });
  };

  const mainTabs = getFilteredTabs();

  // Utility functions (keep all the original utility functions but simplified)
  const normalizePhoneNumber = useCallback((phoneNumber) => {
    if (!phoneNumber) return null;
    return phoneNumber.toString().replace(/\D/g, "").replace(/^0+/, "");
  }, []);

  // Get filtered conversations based on current tab - client-side filtering
  const getFilteredConversations = useCallback(() => {
    try {
      if (tabValue >= mainTabs.length) {
        return [];
      }

      const currentTab = mainTabs[tabValue];
      const conversationsArray = Array.from(conversations.entries());

      // If no statuses defined for tab, return all conversations
      if (!currentTab.statuses || currentTab.statuses.length === 0) {
        return conversationsArray;
      }

      // Filter conversations by lead status for current tab
      const filtered = conversationsArray.filter(([phoneNumber, messages]) => {
        const metadata = conversationMetadata.get(phoneNumber);
        const leadStatus = metadata?.leadStatus || "NO_LEAD";
        return currentTab.statuses.includes(leadStatus);
      });

      return filtered;
    } catch (error) {
      console.error("❌ Error filtering conversations:", error);
      return [];
    }
  }, [conversations, conversationMetadata, tabValue, mainTabs]);

  // Get count of conversations for each tab
  const getTabCount = useCallback(
    (tabIndex) => {
      try {
        const tab = mainTabs[tabIndex];

        // Count conversations by their leadStatus
        let count = 0;
        conversations.forEach((messages, phoneNumber) => {
          const conversationData = conversationMetadata.get(phoneNumber);
          const leadStatus = conversationData?.leadStatus || "NO_LEAD";

          // Check if the conversation's lead status is included in the tab's statuses
          if (tab.statuses && tab.statuses.includes(leadStatus)) {
            count++;
          }
        });

        return count;
      } catch (error) {
        console.error("❌ Error getting tab count:", error);
        return 0;
      }
    },
    [mainTabs, conversations, conversationMetadata]
  );

  // Optimized conversation switching with lazy message loading
  const switchConversation = useCallback(async (phoneNumber) => {
    if (!phoneNumber) {
      setActiveConversation(null);
      setChatMessages([]);
      return;
    }

    console.log(`🔄 Switching to conversation: ${phoneNumber}`);
    setMessagesLoading(true);
    setActiveConversation(phoneNumber);

    try {
      // Fetch messages only when conversation is selected (lazy loading)
      const apiUrl = `/api/whatsapp/conversations/${encodeURIComponent(
        phoneNumber
      )}/messages?limit=50&offset=0`;

      console.log(`📞 Fetching messages from: ${apiUrl}`);

      const response = await axiosInstance.get(apiUrl);

      console.log(`📥 API Response:`, {
        success: response.data.success,
        messagesCount: response.data.messages?.length || 0,
        messages: response.data.messages,
        phoneNumber: response.data.phoneNumber,
        error: response.data.error,
      });

      if (response.data.success) {
        const messages = response.data.messages || [];
        console.log(`✅ Setting ${messages.length} messages for display`);
        setChatMessages(messages);
      } else {
        console.error("❌ API returned error:", response.data.error);
        setChatMessages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setChatMessages([]);
    } finally {
      setMessagesLoading(false);
    }

    // Mark messages as read
    setUnreadCounts((prev) => {
      const newCounts = new Map(prev);
      newCounts.set(phoneNumber, 0);
      return newCounts;
    });
  }, []);

  // Optimized conversation fetching - fetch all conversations without status filtering
  const fetchConversations = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) {
          setConversationsLoading(true);
          // Reset pagination state for fresh load
          setHasMoreConversations(true);
          setLoadingMoreConversations(false);
        } else {
          setLoadingMoreConversations(true);
        }

        const currentOffset = loadMore ? conversations.size : 0;
        const limit = 500; // Much larger limit for faster loading

        // Fetch all conversations without lead status filtering - we'll filter client-side
        let apiUrl = `/api/whatsapp/conversations?limit=${limit}&offset=${currentOffset}&status=active&includeClosed=false`;

        console.log(`🔄 Fetching conversations: ${apiUrl}`);

        const response = await axiosInstance.get(apiUrl);

        if (response.data.success) {
          const apiConversations = response.data.conversations || [];
          const pagination = response.data.pagination || {};

          console.log(
            `✅ Loaded ${apiConversations.length} conversations, hasMore: ${
              pagination.hasMore
            }, total available: ${pagination.totalCount || "unknown"}`
          );

          // Debug: Log all unique statuses to ensure proper tab mapping
          const allStatuses = new Set();
          apiConversations.forEach((conversation) => {
            allStatuses.add(conversation.leadStatus || "NO_LEAD");
          });
          const statusArray = Array.from(allStatuses).sort();
          console.log(
            `📊 All unique lead statuses in current batch:`,
            statusArray
          );

          // Check if any statuses are not mapped to tabs
          const allTabStatuses = new Set();
          allTabs.forEach((tab) => {
            tab.statuses?.forEach((status) => allTabStatuses.add(status));
          });
          const unmappedStatuses = statusArray.filter(
            (status) => !allTabStatuses.has(status)
          );
          if (unmappedStatuses.length > 0) {
            console.warn(`⚠️ Unmapped lead statuses found:`, unmappedStatuses);
            console.warn(
              `💡 Consider adding these to the tabs configuration for better organization`
            );

            // Show notification about unmapped statuses
            setSnackbar({
              open: true,
              message: `Found ${
                unmappedStatuses.length
              } unmapped lead statuses: ${unmappedStatuses.join(", ")}`,
              severity: "warning",
            });
          }

          const newConversationsMap = loadMore
            ? new Map(conversations)
            : new Map();
          const newUnreadCountsMap = loadMore
            ? new Map(unreadCounts)
            : new Map();
          const newConversationMetadataMap = loadMore
            ? new Map(conversationMetadata)
            : new Map();

          for (const conversation of apiConversations) {
            const phoneNumber = normalizePhoneNumber(conversation.phoneNumber);
            if (!phoneNumber) continue;

            // Store conversation metadata (including leadStatus from API)
            newConversationMetadataMap.set(phoneNumber, {
              id: conversation.id,
              contactName: conversation.contactName,
              contactId: conversation.contactId,
              status: conversation.status,
              leadStatus: conversation.leadStatus || "NO_LEAD", // From API
              leadId: conversation.leadId,
              aiEnabled: conversation.aiEnabled !== false,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              lastMessage: conversation.lastMessage,
              lastMessageTime: conversation.lastMessageTime,
              messageCount: conversation.messageCount || 0,
            });

            // Store empty messages array - messages will be loaded on demand
            if (!newConversationsMap.has(phoneNumber)) {
              newConversationsMap.set(phoneNumber, []);
            }

            // Set unread count from API
            newUnreadCountsMap.set(phoneNumber, conversation.unreadCount || 0);
          }

          // Update state with new data
          setConversations(newConversationsMap);
          setUnreadCounts(newUnreadCountsMap);
          setConversationMetadata(newConversationMetadataMap);

          // Update pagination state based on response
          const hasMore =
            pagination.hasMore !== undefined
              ? pagination.hasMore
              : apiConversations.length === limit;
          setHasMoreConversations(hasMore);

          console.log(
            `✅ Updated state - Conversations: ${newConversationsMap.size}, hasMore: ${hasMore}`
          );

          // If we're on initial load and there are more conversations, automatically load them for better search
          if (!loadMore && hasMore && newConversationsMap.size < 2000) {
            // Auto-load up to 2000 conversations
            console.log(
              `🔄 Auto-loading more conversations for comprehensive search... (${newConversationsMap.size} loaded so far)`
            );
            setTimeout(() => {
              fetchConversations(true);
            }, 50); // Reduced delay for faster loading
          }

          // Return first phone number for auto-selection
          if (!loadMore && apiConversations.length > 0) {
            const firstPhoneNumber = normalizePhoneNumber(
              apiConversations[0].phoneNumber
            );
            return firstPhoneNumber;
          }
        } else {
          console.error(
            "❌ Failed to fetch conversations:",
            response.data.message
          );
        }
      } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        if (!loadMore) {
          // Initialize with empty data on error
          setConversations(new Map());
          setUnreadCounts(new Map());
          setConversationMetadata(new Map());
        }
      } finally {
        if (loadMore) {
          setLoadingMoreConversations(false);
        } else {
          setConversationsLoading(false);
        }
      }
    },
    [
      conversations,
      unreadCounts,
      conversationMetadata,
      normalizePhoneNumber,
      allTabs,
    ]
  );

  // Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || loadingMoreConversations) return;

    setLoadingMoreConversations(true);
    await fetchConversations(true);
  }, [hasMoreConversations, loadingMoreConversations, fetchConversations]);

  // Simple search handler without debouncing
  const handleSearchTermChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  };

  // Load ALL remaining conversations for comprehensive search
  const loadAllConversations = useCallback(async () => {
    if (!hasMoreConversations) return;

    setSnackbar({
      open: true,
      message: "Loading all conversations at once...",
      severity: "info",
    });

    try {
      // Use the special loadAll endpoint for maximum efficiency
      const apiUrl = `/api/whatsapp/conversations?loadAll=true&status=active&includeClosed=false`;

      console.log(`🚀 Loading ALL conversations at once...`);
      const response = await axiosInstance.get(apiUrl);

      if (response.data.success) {
        const allConversations = response.data.conversations || [];

        console.log(
          `✅ Loaded ${allConversations.length} conversations in one request!`
        );

        const newConversationsMap = new Map();
        const newUnreadCountsMap = new Map();
        const newConversationMetadataMap = new Map();

        for (const conversation of allConversations) {
          const phoneNumber = normalizePhoneNumber(conversation.phoneNumber);
          if (!phoneNumber) continue;

          // Store conversation metadata (including leadStatus from API)
          newConversationMetadataMap.set(phoneNumber, {
            id: conversation.id,
            contactName: conversation.contactName,
            contactId: conversation.contactId,
            status: conversation.status,
            leadStatus: conversation.leadStatus || "NO_LEAD",
            leadId: conversation.leadId,
            aiEnabled: conversation.aiEnabled !== false,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            lastMessage: conversation.lastMessage,
            lastMessageTime: conversation.lastMessageTime,
            messageCount: conversation.messageCount || 0,
          });

          // Store empty messages array - messages will be loaded on demand
          newConversationsMap.set(phoneNumber, []);

          // Set unread count from API
          newUnreadCountsMap.set(phoneNumber, conversation.unreadCount || 0);
        }

        // Update state with all data
        setConversations(newConversationsMap);
        setUnreadCounts(newUnreadCountsMap);
        setConversationMetadata(newConversationMetadataMap);
        setHasMoreConversations(false); // All loaded

        setSnackbar({
          open: true,
          message: `🎉 Loaded ALL ${newConversationsMap.size} conversations! Search now covers everything.`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Error loading all conversations:", error);
      setSnackbar({
        open: true,
        message: "Failed to load all conversations. Please try again.",
        severity: "error",
      });
    }
  }, [normalizePhoneNumber, hasMoreConversations]);

  const getConversationsList = () => {
    try {
      const filteredConversations = getFilteredConversations();

      // Debug for all tabs to ensure proper status mapping
      const currentTab = mainTabs[tabValue];
      console.log(`🔍 Tab "${currentTab?.label}" Debug:`, {
        totalConversations: conversations.size,
        filteredCount: filteredConversations.length,
        tabStatuses: currentTab?.statuses,
        tabIndex: tabValue,
      });

      // Count conversations for each status in current tab
      if (currentTab?.statuses) {
        const statusCounts = {};
        currentTab.statuses.forEach((status) => {
          statusCounts[status] = 0;
        });

        conversations.forEach((messages, phoneNumber) => {
          const metadata = conversationMetadata.get(phoneNumber);
          const leadStatus = metadata?.leadStatus || "NO_LEAD";
          if (currentTab.statuses.includes(leadStatus)) {
            statusCounts[leadStatus] = (statusCounts[leadStatus] || 0) + 1;
          }
        });

        console.log(
          `📊 Status breakdown for "${currentTab.label}":`,
          statusCounts
        );
      }

      // Apply search filter if search term exists
      let finalConversations = filteredConversations;
      if (searchTerm && searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        finalConversations = filteredConversations.filter(
          ([phoneNumber, messages]) => {
            const metadata = conversationMetadata.get(phoneNumber);
            const contactName = metadata?.contactName || "";
            const lastMessage = metadata?.lastMessage || "";
            const leadStatus = metadata?.leadStatus || "";

            // Enhanced search: phone number, contact name, last message, lead status, and recent messages
            return (
              phoneNumber.includes(searchTerm) ||
              contactName.toLowerCase().includes(lowerSearchTerm) ||
              lastMessage.toLowerCase().includes(lowerSearchTerm) ||
              leadStatus.toLowerCase().includes(lowerSearchTerm) ||
              // Also search through recent messages in the conversation
              messages.some(
                (msg) =>
                  msg.content &&
                  msg.content.toLowerCase().includes(lowerSearchTerm)
              )
            );
          }
        );

        console.log(
          `🔍 Search results: ${finalConversations.length} conversations found for "${searchTerm}"`
        );
      }

      return finalConversations
        .filter(([phoneNumber, messages]) => phoneNumber && phoneNumber.trim())
        .map(([phoneNumber, messages]) => {
          const metadata = conversationMetadata.get(phoneNumber);
          return {
            phoneNumber,
            messages,
            lastMessage: metadata?.lastMessage || "",
            lastMessageTime: metadata?.lastMessageTime || new Date(),
            unreadCount: unreadCounts.get(phoneNumber) || 0,
            leadStatus: metadata?.leadStatus || "NO_LEAD",
            contactName:
              metadata?.contactName || `Contact ${phoneNumber.slice(-4)}`,
          };
        })
        .sort((a, b) => {
          // Sort by last message time, most recent first
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });
    } catch (error) {
      console.error("❌ Error in getConversationsList:", error);
      return [];
    }
  };

  const getProfileName = (phoneNumber) => {
    try {
      if (!phoneNumber) return "Unknown Contact";
      const metadata = conversationMetadata.get(phoneNumber);
      if (
        metadata?.contactName &&
        metadata.contactName !== `Contact ${phoneNumber.slice(-4)}`
      ) {
        return metadata.contactName;
      }
      return `Contact ${phoneNumber.slice(-4)}`;
    } catch (error) {
      console.error("❌ Error in getProfileName:", error);
      return "Unknown Contact";
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !activeConversation || loading) {
      return;
    }
    setLoading(true);

    // Get current user's display name
    const currentUserName =
      user?.name || user?.firstName || user?.email?.split("@")[0] || "Admin";
    console.log("🔍 Current user sending message:", { user, currentUserName });

    // Create optimistic message for immediate UI feedback
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      content: messageText,
      sender: "admin",
      senderName: currentUserName,
      timestamp: new Date(),
      status: "sending",
      type: "text",
      phoneNumber: activeConversation,
      profileName: currentUserName,
      isAI: false,
      isAdmin: true,
    };

    // Add optimistic message immediately
    setConversations((prev) => {
      const newConversations = new Map(prev);
      const existingMessages = newConversations.get(activeConversation) || [];
      const updatedMessages = [...existingMessages, optimisticMessage].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      newConversations.set(activeConversation, updatedMessages);
      return newConversations;
    });

    setChatMessages((prev) => {
      const updatedMessages = [...prev, optimisticMessage].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      return updatedMessages;
    });

    try {
      // Get current user's display name
      const currentUserName =
        user?.name || user?.firstName || user?.email?.split("@")[0] || "Admin";

      const response = await axiosInstance.post("/api/whatsapp/send-message", {
        to: activeConversation,
        message: messageText,
        messageType: "text",
        senderName: currentUserName, // Include sender name in the request
        leadData: {
          // Include any additional data that might be needed
          contactName: getProfileName(activeConversation),
        },
      });

      if (response.data.success) {
        console.log("✅ Message sent successfully, response:", response.data);

        // Remove the optimistic message
        setConversations((prev) => {
          const newConversations = new Map(prev);
          const existingMessages =
            newConversations.get(activeConversation) || [];
          const updatedMessages = existingMessages.filter(
            (msg) => msg.id !== optimisticMessage.id
          );
          newConversations.set(activeConversation, updatedMessages);
          return newConversations;
        });

        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );

        // Refresh the conversation messages to get the real message from server
        console.log("🔄 Refreshing conversation after message send...");
        setTimeout(() => {
          console.log("🔄 Calling switchConversation to refresh messages...");
          switchConversation(activeConversation);
        }, 500);

        // Clear the input field
        console.log("Clearing message after successful send");
        setMessage("");
        setSnackbar({
          open: true,
          message: "Message sent successfully",
          severity: "success",
        });
      } else {
        // API returned success: false - remove optimistic message
        setConversations((prev) => {
          const newConversations = new Map(prev);
          const existingMessages =
            newConversations.get(activeConversation) || [];
          const updatedMessages = existingMessages.filter(
            (msg) => msg.id !== optimisticMessage.id
          );
          newConversations.set(activeConversation, updatedMessages);
          return newConversations;
        });

        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );

        // Show error message
        setSnackbar({
          open: true,
          message: response.data.error || "Failed to send message",
          severity: "error",
        });

        throw new Error(response.data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // Remove the failed optimistic message entirely from UI
      setConversations((prev) => {
        const newConversations = new Map(prev);
        const existingMessages = newConversations.get(activeConversation) || [];
        const updatedMessages = existingMessages.filter(
          (msg) => msg.id !== optimisticMessage.id
        );
        newConversations.set(activeConversation, updatedMessages);
        return newConversations;
      });

      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );

      setSnackbar({
        open: true,
        message: "Failed to send message",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = (phoneNumber) => {
    // Get contact name for better UX
    const contactName =
      conversationMetadata.get(phoneNumber)?.contactName || phoneNumber;

    Swal.fire({
      title: "Clear Conversation?",
      html: `Are you sure you want to clear all messages with <strong>${contactName}</strong>?<br><small>This action cannot be undone.</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      background: "#fff",
      customClass: {
        popup: "swal2-popup",
        title: "swal2-title",
        content: "swal2-content",
      },
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return; // User cancelled
      }

      try {
        setLoading(true);
        await ConversationService.clearConversationMessages(phoneNumber);
        await fetchConversations();
        if (activeConversation === phoneNumber) {
          setChatMessages([]);
        }
        setSnackbar({
          open: true,
          message: `Chat history cleared for ${contactName}`,
          severity: "success",
        });
      } catch (error) {
        console.error("❌ Error clearing conversation:", error);
        setSnackbar({
          open: true,
          message: "Failed to clear chat history",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const deleteConversation = (identifier) => {
    // Get contact name for better UX
    let contactName = identifier;
    if (
      typeof identifier === "string" &&
      identifier.length > 15 &&
      !identifier.startsWith("+")
    ) {
      // This is a conversation ID, find the phone number
      for (const [phone, metadata] of conversationMetadata.entries()) {
        if (metadata?.id === identifier) {
          contactName = metadata?.contactName || phone;
          break;
        }
      }
    } else {
      // This is a phone number
      contactName =
        conversationMetadata.get(identifier)?.contactName || identifier;
    }

    Swal.fire({
      title: "Delete Conversation?",
      html: `Are you sure you want to permanently delete the conversation with <strong>${contactName}</strong>?<br><small>This action cannot be undone.</small>`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "#fff",
      customClass: {
        popup: "swal2-popup",
        title: "swal2-title",
        content: "swal2-content",
      },
    }).then(async (result) => {
      if (!result.isConfirmed) {
        return; // User cancelled
      }

      try {
        setLoading(true);
        let phoneNumber = identifier;
        if (
          typeof identifier === "string" &&
          identifier.length > 15 &&
          !identifier.startsWith("+")
        ) {
          await ConversationService.deleteConversation(identifier);
          for (const [phone, metadata] of conversationMetadata.entries()) {
            if (metadata?.id === identifier) {
              phoneNumber = phone;
              break;
            }
          }
        } else {
          await ConversationService.deleteConversationByPhone(identifier);
          phoneNumber = identifier;
        }
        await fetchConversations();
        if (activeConversation === phoneNumber) {
          switchConversation(null);
        }
        setSnackbar({
          open: true,
          message: `Conversation with ${contactName} deleted successfully`,
          severity: "success",
        });
      } catch (error) {
        console.error("❌ Error deleting conversation:", error);
        setSnackbar({
          open: true,
          message: "Failed to delete conversation",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const toggleAutoReply = async (phoneNumber) => {
    const originalSetting = autoReplySettings.has(phoneNumber)
      ? autoReplySettings.get(phoneNumber)
      : true;
    const newSetting = !originalSetting;

    try {
      setAutoReplySettings((prev) => {
        const newSettings = new Map(prev);
        newSettings.set(phoneNumber, newSetting);
        return newSettings;
      });

      const response = await axiosInstance.post(
        "/api/whatsapp/ai/toggle-conversation",
        {
          phoneNumber: phoneNumber.trim(),
          enabled: newSetting,
        }
      );

      if (response.data.success && response.data.data) {
        const actualSetting = response.data.data.aiEnabled;
        setAutoReplySettings((prev) => {
          const newSettings = new Map(prev);
          newSettings.set(phoneNumber, actualSetting);
          return newSettings;
        });
        setSnackbar({
          open: true,
          message: `Auto-reply ${
            actualSetting ? "enabled" : "disabled"
          } for ${getProfileName(phoneNumber)}`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("❌ Error in toggleAutoReply:", error);
      setAutoReplySettings((prev) => {
        const newSettings = new Map(prev);
        newSettings.set(phoneNumber, originalSetting);
        return newSettings;
      });
      setSnackbar({
        open: true,
        message: "Error updating auto-reply setting",
        severity: "error",
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    if (
      typeof newValue !== "number" ||
      newValue < 0 ||
      newValue >= mainTabs.length
    ) {
      console.warn("⚠️ Invalid tab value:", newValue);
      return;
    }
    if (newValue === tabValue) return;

    try {
      setTabValue(newValue);
      // Keep search term when switching tabs to maintain search functionality across tabs
      // if (searchTerm) {
      //   setSearchTerm("");
      // }

      // Select first conversation from the new tab if none is selected or current is not visible
      setTimeout(() => {
        const conversationsList = getConversationsList();
        if (conversationsList.length > 0) {
          // Check if current conversation is still visible in new tab
          const currentConversationVisible = conversationsList.some(
            (conv) => conv.phoneNumber === activeConversation
          );

          // If current conversation is not visible in new tab, select the first one
          if (!currentConversationVisible) {
            switchConversation(conversationsList[0].phoneNumber);
          }
        } else {
          // No conversations in this tab, clear selection
          switchConversation(null);
        }
      }, 100); // Small delay to ensure filtering is complete

      console.log(
        `📊 Switched to tab: ${mainTabs[newValue]?.label}${
          searchTerm ? ` with search: "${searchTerm}"` : ""
        }`
      );
    } catch (error) {
      console.error("❌ Error in handleTabChange:", error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(message);
      setUserTyping(false);
    }
  };

  const handleInputChange = (event) => {
    console.log("Input change event:", {
      value: event.target.value,
      currentMessage: message,
      eventType: event.type,
    });

    const newValue = event.target.value;
    setMessage(newValue);

    if (newValue.length > 0 && !userTyping) {
      setUserTyping(true);
    } else if (newValue.length === 0 && userTyping) {
      setUserTyping(false);
    }
  };

  const refreshConversations = async () => {
    try {
      setSnackbar({
        open: true,
        message: "Refreshing conversations...",
        severity: "info",
      });

      await fetchConversations();

      setSnackbar({
        open: true,
        message: "Conversations refreshed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Error refreshing conversations:", error);
      setSnackbar({
        open: true,
        message: "Failed to refresh conversations",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleStartConversation = () => {
    if (activeConversation) {
      // Focus on the message input to encourage typing
      document.querySelector('input[placeholder*="Type"]')?.focus();
    }
  };

  const handleTemplateMessageSent = async (phoneNumber, result) => {
    try {
      console.log(
        `🔄 Template message sent for ${phoneNumber}, refreshing conversation...`
      );

      // Wait a moment for the message to be processed by the backend
      setTimeout(async () => {
        // Refresh the specific conversation messages
        if (activeConversation === phoneNumber) {
          await switchConversation(phoneNumber);
        }

        // Optionally refresh the conversations list to update last message
        // await fetchConversations(false);

        setSnackbar({
          open: true,
          message: `Template message sent to ${getProfileName(phoneNumber)}`,
          severity: "success",
        });
      }, 1000); // 1 second delay to ensure backend processing is complete
    } catch (error) {
      console.error("❌ Error handling template message sent:", error);
      setSnackbar({
        open: true,
        message: "Template message sent, but failed to refresh conversation",
        severity: "warning",
      });
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    const loadInitialConversations = async () => {
      const firstPhoneNumber = await fetchConversations();
      if (firstPhoneNumber && !activeConversation) {
        switchConversation(firstPhoneNumber);
      }
    };
    loadInitialConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update total unread count
  useEffect(() => {
    const total = Array.from(unreadCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalUnreadMessages(total);
  }, [unreadCounts]);

  // Note: Lead statuses now come directly from API, no separate fetching needed

  // SSE setup
  useEffect(() => {
    let eventSource = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource(
          `${process.env.REACT_APP_API_BASE_URL}/api/whatsapp/messages/stream`
        );

        eventSource.onopen = () => {
          // SSE connection established
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "incoming_message":
                ChatMessageHandler.processIncomingMessage(
                  data.data,
                  setConversations,
                  setChatMessages,
                  activeConversationRef,
                  setUnreadCounts
                );
                break;
              case "ai_reply":
                ChatMessageHandler.processAIReply(
                  data.data,
                  setConversations,
                  setChatMessages,
                  activeConversationRef,
                  setAiTyping
                );
                break;
              case "ai_typing":
                ChatMessageHandler.handleAITyping(data.data, setAiTyping);
                break;
              case "lead_status_update":
                // Refresh conversations to get updated lead status
                fetchConversations(false);
                break;
              default:
                break;
            }
          } catch (error) {
            console.error("❌ Error parsing SSE message:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("❌ SSE connection error:", error);
          if (eventSource.readyState === EventSource.CLOSED) {
            setTimeout(setupSSE, 5000);
          }
        };
      } catch (error) {
        console.error("❌ Error setting up SSE:", error);
      }
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic refresh of conversations (backup mechanism)
  useEffect(() => {
    const interval = setInterval(() => {
      if (conversationMetadata.size > 0) {
        fetchConversations(false);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [conversationMetadata, fetchConversations]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "grey.50",
      }}
    >
      {/* Header */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <WhatsAppIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WhatsApp Chat Management
          </Typography>

          <Tooltip title="Total unread messages">
            <Chip
              icon={<NotificationsIcon />}
              label={totalUnreadMessages}
              color={totalUnreadMessages > 0 ? "error" : "default"}
              sx={{ mr: 2 }}
            />
          </Tooltip>

          {hasMoreConversations && (
            <Tooltip title="Load all conversations for comprehensive search">
              <Button
                color="inherit"
                variant="outlined"
                size="small"
                onClick={loadAllConversations}
                disabled={loadingMoreConversations}
                sx={{ mr: 2, borderColor: "rgba(255,255,255,0.5)" }}
              >
                {loadingMoreConversations
                  ? "Loading..."
                  : `Load All (${conversations.size}+)`}
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Refresh conversations">
            <Button
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={refreshConversations}
            >
              Refresh
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <ConversationTabs
        tabValue={tabValue}
        onTabChange={handleTabChange}
        tabs={mainTabs}
        getTabCount={getTabCount}
      />

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: "hidden", p: 2 }}>
        {mainTabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            <Box sx={{ height: "100%", overflow: "hidden" }}>
              <ErrorBoundary>
                <ChatLayout
                  conversations={conversations}
                  activeConversation={activeConversation}
                  chatMessages={chatMessages}
                  unreadCounts={unreadCounts}
                  autoReplySettings={autoReplySettings}
                  message={message}
                  setMessage={setMessage}
                  loading={loading}
                  searchTerm={searchTerm}
                  setSearchTerm={handleSearchTermChange}
                  onConversationSelect={switchConversation}
                  onConversationClear={clearConversation}
                  onConversationDelete={deleteConversation}
                  onAutoReplyToggle={toggleAutoReply}
                  onSendMessage={sendMessage}
                  onKeyPress={handleKeyPress}
                  onInputChange={handleInputChange}
                  getConversationsList={getConversationsList}
                  getProfileName={getProfileName}
                  aiTyping={aiTyping}
                  userTyping={userTyping}
                  conversationsLoading={conversationsLoading}
                  messagesLoading={messagesLoading}
                  onRefresh={refreshConversations}
                  onStartConversation={handleStartConversation}
                  hasMoreConversations={hasMoreConversations}
                  loadingMoreConversations={loadingMoreConversations}
                  onLoadMore={loadMoreConversations}
                  onTemplateMessageSent={handleTemplateMessageSent}
                  currentUser={user}
                />
              </ErrorBoundary>
            </Box>
          </TabPanel>
        ))}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatConfig;
