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

import ConversationTabs from "../../components/chat/ConversationTabs";
import ChatLayout from "../../components/chat/ChatLayout";
import TabPanel from "../../components/chat/TabPanel";
import KnowledgeBaseTab from "../../components/chat/KnowledgeBaseTab";
import ErrorBoundary from "../../components/chat/ErrorBoundary";
import { axiosInstance } from "../../services/axiosConfig";
import ChatMessageHandler from "../../services/chatMessageHandler";
import ConversationService from "../../services/conversationService";

const ChatConfig = () => {
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
  const [leadStatuses, setLeadStatuses] = useState(new Map());

  // Refs
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Define main tabs for each lead status plus Knowledge Base
  const mainTabs = [
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
      label: "Pre-Qualified",
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
    {
      label: "Knowledge Base",
      statuses: [],
      color: "primary.main",
      icon: "📚",
      tabId: "knowledge-tab",
    },
  ];

  // Utility functions (keep all the original utility functions but simplified)
  const normalizePhoneNumber = useCallback((phoneNumber) => {
    if (!phoneNumber) return null;
    return phoneNumber.toString().replace(/\D/g, "").replace(/^0+/, "");
  }, []);

  const fetchLeadStatuses = useCallback(async () => {
    try {
      const statusMap = new Map();
      const conversationPhones = Array.from(conversationMetadata.keys());

      for (const phoneNumber of conversationPhones) {
        try {
          const response = await axiosInstance.get(
            `/api/leads/phone/${normalizePhoneNumber(phoneNumber)}`
          );
          if (response.data.success && response.data.data) {
            const leadStatus = response.data.data.status || "INQUIRY";
            statusMap.set(phoneNumber, leadStatus);
          } else {
            statusMap.set(phoneNumber, "NO_LEAD");
          }
        } catch (error) {
          statusMap.set(phoneNumber, "NO_LEAD");
        }
      }

      setLeadStatuses(statusMap);
    } catch (error) {
      console.error("❌ Error fetching lead statuses:", error);
    }
  }, [conversationMetadata, normalizePhoneNumber]);

  // Get filtered conversations based on current tab
  const getFilteredConversations = useCallback(() => {
    try {
      if (tabValue === mainTabs.length - 1) {
        return []; // Knowledge Base tab doesn't show conversations
      }

      const currentTab = mainTabs[tabValue];

      // Handle "New Contacts" tab (non-leads)
      if (currentTab.type === "non_leads") {
        const filteredEntries = Array.from(conversations.entries()).filter(
          ([phoneNumber, messages]) => {
            const leadStatus = leadStatuses.get(phoneNumber);
            const isNonLead = !leadStatus || leadStatus === "NO_LEAD";
            return isNonLead;
          }
        );

        return filteredEntries;
      }

      // Handle status-based tabs
      const targetStatuses = currentTab.statuses;

      const filteredEntries = Array.from(conversations.entries()).filter(
        ([phoneNumber, messages]) => {
          const leadStatus = leadStatuses.get(phoneNumber);
          const hasLead = leadStatus && leadStatus !== "NO_LEAD";
          const matches = hasLead && targetStatuses.includes(leadStatus);
          return matches;
        }
      );

      return filteredEntries;
    } catch (error) {
      console.error("❌ Error filtering conversations:", error);
      return [];
    }
  }, [tabValue, mainTabs, conversations, leadStatuses]);

  // Get count of conversations for each tab
  const getTabCount = useCallback(
    (tabIndex) => {
      try {
        if (tabIndex >= mainTabs.length - 1) return 0; // Knowledge Base tab

        const tab = mainTabs[tabIndex];

        // Handle "New Contacts" tab (non-leads)
        if (tab.type === "non_leads") {
          const count = Array.from(leadStatuses.values()).filter(
            (status) => !status || status === "NO_LEAD"
          ).length;
          return count;
        }

        // Handle status-based tabs
        const count = Array.from(leadStatuses.values()).filter(
          (status) =>
            status && status !== "NO_LEAD" && tab.statuses.includes(status)
        ).length;

        return count;
      } catch (error) {
        console.error("❌ Error getting tab count:", error);
        return 0;
      }
    },
    [mainTabs, leadStatuses]
  );

  // All the original functions but simplified (fetchConversations, switchConversation, etc.)
  // I'll include the essential ones here:

  const switchConversation = useCallback(
    (phoneNumber) => {
      if (!phoneNumber) {
        setActiveConversation(null);
        setChatMessages([]);
        return;
      }

      setMessagesLoading(true);
      setActiveConversation(phoneNumber);

      // Simulate brief loading for messages (since they're loaded instantly from memory)
      setTimeout(() => {
        const messages = conversations.get(phoneNumber) || [];
        setChatMessages([...messages]);
        setMessagesLoading(false);
      }, 200);

      // Mark messages as read
      setUnreadCounts((prev) => {
        const newCounts = new Map(prev);
        newCounts.set(phoneNumber, 0);
        return newCounts;
      });
    },
    [conversations]
  );

  const fetchConversations = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) {
          setConversationsLoading(true);
        }

        const currentOffset = loadMore ? conversations.size : 0;
        const limit = 25;

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
          status: "active",
          includeClosed: "false",
        });

        const response = await axiosInstance.get(
          `/api/whatsapp/conversations?${params}`
        );

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

            newConversationMetadataMap.set(phoneNumber, {
              id: conversation.id,
              contactName: conversation.contactName,
              contactId: conversation.contactId,
              status: conversation.status,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
              aiEnabled: conversation.aiEnabled !== false,
            });

            try {
              const messagesResponse = await axiosInstance.get(
                `/api/whatsapp/conversations/${conversation.phoneNumber}/messages`
              );
              if (messagesResponse.data.success) {
                const messages = messagesResponse.data.messages.map((msg) => {
                  let timestamp = msg.timestamp;
                  if (typeof timestamp === "string") {
                    timestamp = new Date(timestamp);
                  } else if (timestamp && timestamp._seconds) {
                    timestamp = new Date(
                      timestamp._seconds * 1000 +
                        (timestamp._nanoseconds || 0) / 1000000
                    );
                  }

                  // Properly determine sender type based on message data
                  let sender = "admin";
                  let senderName = "Admin";
                  let isAI = false;
                  let isAdmin = false;

                  if (msg.direction === "incoming") {
                    sender = "customer";
                    senderName =
                      msg.senderName ||
                      msg.profileName ||
                      `Contact ${phoneNumber.slice(-4)}`;
                  } else if (msg.direction === "outgoing") {
                    // For outgoing messages, use the following priority:
                    // 1. Explicit isAI field (most reliable)
                    // 2. senderName === "Miryam"
                    // 3. automated === true with AI content markers
                    // 4. Content-based detection (fallback)
                    if (
                      msg.isAI === true ||
                      msg.senderName === "Miryam" ||
                      (msg.automated === true &&
                        msg.content &&
                        (msg.content.includes("I'm Miryam") ||
                          msg.content.includes("AI assistant") ||
                          msg.content.includes(
                            "Welcome to International University"
                          ) ||
                          msg.content.includes("university family"))) ||
                      (msg.automated !== false &&
                        msg.content &&
                        (msg.content.includes("I'm Miryam") ||
                          msg.content.includes("AI assistant") ||
                          msg.content.includes(
                            "Welcome to International University"
                          ) ||
                          msg.content.includes("university family")))
                    ) {
                      sender = "ai";
                      senderName = "Miryam";
                      isAI = true;
                    } else {
                      // Manual admin message (automated === false or no AI content)
                      sender = "admin";
                      senderName = msg.senderName || "Admin";
                      isAdmin = true;
                    }
                  } else {
                    // Fallback for messages without proper direction
                    // Use isAI field as primary indicator
                    if (msg.isAI === true || msg.senderName === "Miryam") {
                      sender = "ai";
                      senderName = "Miryam";
                      isAI = true;
                    } else {
                      sender = "admin";
                      senderName = msg.senderName || "Admin";
                      isAdmin = true;
                    }
                  }

                  return {
                    ...msg,
                    sender: sender,
                    senderName: senderName,
                    timestamp: timestamp || new Date(),
                    id:
                      msg.messageId ||
                      msg.id ||
                      `msg-${Date.now()}-${Math.random()}`,
                    profileName: senderName,
                    isAI: isAI,
                    isAdmin: isAdmin,
                  };
                });

                newConversationsMap.set(phoneNumber, messages);

                // Calculate unread count
                const unreadCount = messages.filter(
                  (msg) => msg.direction === "incoming" && !msg.read
                ).length;
                newUnreadCountsMap.set(phoneNumber, unreadCount);
              }
            } catch (msgError) {
              console.error(
                `❌ Error fetching messages for ${phoneNumber}:`,
                msgError
              );
              newConversationsMap.set(phoneNumber, []);
              newUnreadCountsMap.set(phoneNumber, 0);
            }
          }

          // Update state with new data
          setConversations(newConversationsMap);
          setUnreadCounts(newUnreadCountsMap);
          setConversationMetadata(newConversationMetadataMap);

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
        setConversationsLoading(false);
      }
    },
    [conversations, unreadCounts, conversationMetadata, normalizePhoneNumber]
  );

  const getConversationsList = () => {
    try {
      const filteredConversations = getFilteredConversations();
      return filteredConversations
        .filter(([phoneNumber, messages]) => phoneNumber && phoneNumber.trim())
        .map(([phoneNumber, messages]) => ({
          phoneNumber,
          messages,
          lastMessage:
            messages.length > 0 ? messages[messages.length - 1].content : "",
          lastMessageTime:
            messages.length > 0
              ? messages[messages.length - 1].timestamp
              : new Date(),
          unreadCount: unreadCounts.get(phoneNumber) || 0,
          leadStatus: leadStatuses.get(phoneNumber) || "INQUIRY",
        }));
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
      const messages = conversations.get(phoneNumber) || [];
      if (messages.length > 0) {
        const incomingMessagesWithProfile = messages
          .filter(
            (msg) =>
              msg.sender === "customer" &&
              msg.profileName &&
              msg.profileName !== "Unknown"
          )
          .reverse();
        if (incomingMessagesWithProfile.length > 0) {
          return incomingMessagesWithProfile[0].profileName;
        }
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

  const clearConversation = async (phoneNumber) => {
    try {
      setLoading(true);
      await ConversationService.clearConversationMessages(phoneNumber);
      await fetchConversations();
      if (activeConversation === phoneNumber) {
        setChatMessages([]);
      }
      setSnackbar({
        open: true,
        message: `Chat history cleared for ${phoneNumber}`,
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
  };

  const deleteConversation = async (identifier) => {
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
        message: `Conversation with ${phoneNumber} deleted successfully`,
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

  // Fetch lead statuses when conversations change
  useEffect(() => {
    if (conversationMetadata.size > 0) {
      fetchLeadStatuses();
    }
  }, [conversationMetadata, fetchLeadStatuses]);

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
                fetchLeadStatuses();
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

  // Periodic refresh of lead statuses (backup mechanism)
  useEffect(() => {
    const interval = setInterval(() => {
      if (conversationMetadata.size > 0) {
        fetchLeadStatuses();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [conversationMetadata, fetchLeadStatuses]);

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
              {index === mainTabs.length - 1 ? (
                <KnowledgeBaseTab />
              ) : (
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
                  />
                </ErrorBoundary>
              )}
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
