import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Chip,
  AppBar,
  Toolbar,
  Tooltip,
} from "@mui/material";
import {
  WhatsApp as WhatsAppIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

import ConversationTabs from "../../components/chat/ConversationTabs";
import ChatLayout from "../../components/chat/ChatLayout";
import TabPanel from "../../components/chat/TabPanel";
import ErrorBoundary from "../../components/chat/ErrorBoundary";
import { axiosInstance } from "../../services/axiosConfig";
import ChatMessageHandler from "../../services/chatMessageHandler";
import ConversationService from "../../services/conversationService";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useAuth } from "../../contexts/AuthContext";
import { PERMISSIONS, LEAD_STAGES } from "../../config/roles.config";

const ChatConfig = () => {
  const { checkPermission, filterLeadsByRole, checkLeadStageAccess } =
    useRolePermissions();
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  // All the same state variables from the original file
  const [conversations, setConversations] = useState(new Map());
  const [conversationMetadata, setConversationMetadata] = useState(new Map());
  const [chatMessages, setChatMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [autoReplySettings, setAutoReplySettings] = useState(new Map());
  const [message, setMessage] = useState("");
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
  const allTabs = [
    {
      label: "New Contacts",
      type: "non_leads", // Special type for non-lead conversations
      color: "warning.main",
      icon: "📞",
      tabId: "new-contacts-tab",
    },
    {
      label: "Inquiries",
      statuses: ["INQUIRY", "CONTACTED", "NURTURE"],
      color: "primary.main",
      icon: "�",
      tabId: "inquiries-tab",
    },
    {
      label: "Interested",
      statuses: ["PRE_QUALIFIED", "FOLLOW_UP"],
      color: "info.main",
      icon: "🎯",
      tabId: "prequalified-tab",
    },
    {
      label: "Applied",
      statuses: ["APPLIED", "REVIEW", "PENDING_DOCS"],
      color: "success.main",
      icon: "📝",
      tabId: "applied-tab",
    },
    {
      label: "Admitted",
      statuses: ["ADMITTED", "ENROLLED", "SUCCESS"],
      color: "success.dark",
      icon: "🎉",
      tabId: "admitted-tab",
    },
  ];

  // Filter tabs based on user role permissions - only hide UI tabs, don't filter data
  const getFilteredTabs = () => {
    console.log("🔑 ChatConfig permission check for user:", userRole);

    return allTabs.filter((tab) => {
      // Always show New Contacts tab
      if (tab.type === "non_leads") {
        console.log(`  - Tab ${tab.label}: Always visible`);
        return true;
      }

      // For other tabs, check if user has access to at least one status
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

  // Get filtered conversations based on current tab - now using API filtering
  const getFilteredConversations = useCallback(() => {
    try {
      // Convert conversations Map to array for display
      // Filtering is now done at API level, so we just return all conversations
      const conversationsArray = Array.from(conversations.entries());

      return conversationsArray;
    } catch (error) {
      console.error("❌ Error filtering conversations:", error);
      return [];
    }
  }, [conversations]);

  // Get count of conversations for each tab - now using conversation counts
  const getTabCount = useCallback(
    (tabIndex) => {
      try {
        const tab = mainTabs[tabIndex];

        // Count conversations by their leadStatus
        let count = 0;
        conversations.forEach((messages, phoneNumber) => {
          const conversationData = conversationMetadata.get(phoneNumber);
          const leadStatus = conversationData?.leadStatus || "NO_LEAD";

          if (tab.type === "non_leads") {
            if (leadStatus === "NO_LEAD") count++;
          } else if (tab.statuses && tab.statuses.includes(leadStatus)) {
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

    setMessagesLoading(true);
    setActiveConversation(phoneNumber);

    try {
      // Fetch messages only when conversation is selected (lazy loading)
      const response = await axiosInstance.get(
        `/api/whatsapp/conversations/${encodeURIComponent(
          phoneNumber
        )}/messages?limit=50&offset=0`
      );

      if (response.data.success) {
        setChatMessages(response.data.messages || []);
      } else {
        console.error("Failed to fetch messages:", response.data.error);
        setChatMessages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
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

  // Optimized conversation fetching with pagination and filtering
  const fetchConversations = useCallback(
    async (loadMore = false, specificLeadStatus = null) => {
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
        const limit = 25;

        // Determine which lead status to filter by based on current tab
        let leadStatusFilter = specificLeadStatus;
        if (!leadStatusFilter && tabValue < mainTabs.length - 1) {
          const currentTab = mainTabs[tabValue];
          if (currentTab.type === "non_leads") {
            leadStatusFilter = "NO_LEAD";
          } else if (currentTab.statuses && currentTab.statuses.length > 0) {
            // For status-based tabs, we'll make separate calls for each status
            // For now, let's use the first status as primary filter
            leadStatusFilter = currentTab.statuses[0];
          }
        }

        let apiUrl = `/api/whatsapp/conversations?limit=${limit}&offset=${currentOffset}&status=active&includeClosed=false`;

        // Add lead status filter if specified
        if (leadStatusFilter && leadStatusFilter !== "NO_LEAD") {
          apiUrl += `&leadStatus=${leadStatusFilter}`;
        } else if (leadStatusFilter === "NO_LEAD") {
          apiUrl += `&leadStatus=NO_LEAD`;
        }

        console.log(`🔄 Fetching conversations: ${apiUrl}`);

        const response = await axiosInstance.get(apiUrl);

        if (response.data.success) {
          const apiConversations = response.data.conversations || [];
          const pagination = response.data.pagination || {};

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
            `✅ Loaded ${apiConversations.length} conversations, hasMore: ${hasMore}`
          );

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
      tabValue,
      mainTabs,
    ]
  );

  // Fetch conversations for specific lead status (used when tab changes)
  const fetchConversationsForTab = useCallback(
    async (tabIndex) => {
      if (tabIndex >= mainTabs.length - 1) return; // Skip Knowledge Base tab

      const tab = mainTabs[tabIndex];
      let leadStatusFilter = null;

      if (tab.type === "non_leads") {
        leadStatusFilter = "NO_LEAD";
      } else if (tab.statuses && tab.statuses.length > 0) {
        // For tabs with multiple statuses, we'll need to make separate calls
        // For now, let's fetch all and filter client-side, or you can modify API to accept array
        leadStatusFilter = tab.statuses[0]; // Use first status for now
      }

      await fetchConversations(false, leadStatusFilter);
    },
    [mainTabs, fetchConversations]
  );

  // Load more conversations for current tab
  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || loadingMoreConversations) return;

    setLoadingMoreConversations(true);

    // Determine current lead status filter based on active tab
    let leadStatusFilter = null;
    if (tabValue < mainTabs.length - 1) {
      const currentTab = mainTabs[tabValue];
      if (currentTab.type === "non_leads") {
        leadStatusFilter = "NO_LEAD";
      } else if (currentTab.statuses && currentTab.statuses.length > 0) {
        leadStatusFilter = currentTab.statuses[0];
      }
    }

    await fetchConversations(true, leadStatusFilter);
  }, [
    hasMoreConversations,
    loadingMoreConversations,
    tabValue,
    mainTabs,
    fetchConversations,
  ]);

  // Remove old fetchLeadStatuses since lead status now comes from API
  // const fetchLeadStatuses = useCallback(async () => { ... }, []);

  const getConversationsList = () => {
    try {
      const filteredConversations = getFilteredConversations();
      return filteredConversations
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
    if (!messageText.trim() || !activeConversation || loading) return;
    setLoading(true);

    // Create optimistic message for immediate UI feedback
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      content: messageText,
      sender: "admin",
      senderName: "Admin",
      timestamp: new Date(),
      status: "sending",
      type: "text",
      phoneNumber: activeConversation,
      profileName: "Admin",
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
      const response = await axiosInstance.post("/api/whatsapp/send-message", {
        to: activeConversation,
        message: messageText,
        messageType: "text",
      });
      if (response.data.success) {
        setMessage("");
        setSnackbar({
          open: true,
          message: "Message sent successfully",
          severity: "success",
        });
      } else {
        throw new Error(response.data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // Update optimistic message to failed status
      setConversations((prev) => {
        const newConversations = new Map(prev);
        const existingMessages = newConversations.get(activeConversation) || [];
        const updatedMessages = existingMessages.map((msg) =>
          msg.id === optimisticMessage.id ? { ...msg, status: "failed" } : msg
        );
        newConversations.set(activeConversation, updatedMessages);
        return newConversations;
      });

      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id ? { ...msg, status: "failed" } : msg
        )
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

  // Internal function without confirmation dialog
  const clearConversationInternal = async (phoneNumber) => {
    try {
      setLoading(true);
      await ConversationService.clearConversationMessages(phoneNumber);
      await fetchConversations();
      if (activeConversation === phoneNumber) {
        setChatMessages([]);
      }
      setSnackbar({
        open: true,
        message: `Chat history cleared for ${
          conversationMetadata.get(phoneNumber)?.contactName || phoneNumber
        }`,
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Error clearing conversation:", error);
      setSnackbar({
        open: true,
        message: "Failed to clear chat history",
        severity: "error",
      });
      throw error; // Re-throw so calling function can handle it
    } finally {
      setLoading(false);
    }
  };

  // Internal function without confirmation dialog
  const deleteConversationInternal = async (identifier) => {
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
        message: `Conversation deleted successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete conversation",
        severity: "error",
      });
      throw error; // Re-throw so calling function can handle it
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
      const newTab = mainTabs[newValue];
      setTabValue(newValue);
      if (searchTerm) {
        setSearchTerm("");
      }

      // Fetch conversations for the new tab
      fetchConversationsForTab(newValue);
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
    const newValue = event.target.value;
    setMessage(newValue);
    if (newValue.length > 0 && !userTyping) {
      setUserTyping(true);
    } else if (newValue.length === 0 && userTyping) {
      setUserTyping(false);
    }
  };

  const refreshConversations = () => {
    fetchConversations();
    setSnackbar({
      open: true,
      message: "Refreshing conversations...",
      severity: "info",
    });
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
                fetchConversationsForTab(tabValue);
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
        fetchConversationsForTab(tabValue);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [conversationMetadata, fetchConversationsForTab, tabValue]);

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
                  setSearchTerm={setSearchTerm}
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
