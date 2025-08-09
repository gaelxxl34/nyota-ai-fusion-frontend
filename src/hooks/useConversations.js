import { useState, useEffect, useCallback } from "react";
import ConversationService from "../services/conversationService";

/**
 * Custom hook for managing conversations data and operations
 * Handles loading, filtering, pagination, and CRUD operations
 */
export const useConversations = (initialFilters = {}) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [pagination, setPagination] = useState({
    limit: 25,
    offset: 0,
    totalCount: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState({
    searchQuery: "",
    timeFilter: "all",
    statusFilter: "all",
    leadStatusFilter: "all",
    sortBy: "lastMessage",
    sortOrder: "desc",
    ...initialFilters,
  });

  // Load conversations from API
  const loadConversations = useCallback(
    async (options = {}) => {
      try {
        setLoading(true);
        setError(null);

        const apiOptions = {
          limit: pagination.limit,
          offset: options.resetPagination ? 0 : pagination.offset,
          status:
            filters.statusFilter === "all" ? "active" : filters.statusFilter,
          includeClosed:
            filters.statusFilter === "all" ||
            filters.statusFilter === "inactive",
          leadStatus:
            filters.leadStatusFilter === "all"
              ? null
              : filters.leadStatusFilter === "no_lead"
              ? "NO_LEAD"
              : filters.leadStatusFilter,
          ...options,
        };

        const data = await ConversationService.fetchConversations(apiOptions);

        // Check if we have the new conversations array format
        let conversationsList = [];
        if (Array.isArray(data.conversations)) {
          conversationsList = data.conversations;
        }
        // Fallback to old Maps format if needed
        else if (data.conversationMetadataMap) {
          // Convert Maps to Arrays for easier processing
          const metadataMap = data.conversationMetadataMap || new Map();
          const conversationsMap = data.conversationsMap || new Map();
          const unreadCountsMap = data.unreadCountsMap || new Map();

          // Use metadataMap as the source of truth for all conversations
          conversationsList = Array.from(metadataMap.entries()).map(
            ([phoneNumber, metadata]) => {
              const messages = conversationsMap.get(phoneNumber) || [];
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
                messageCount: messages?.length || 0,
                status: metadata.status || "active",
                unreadCount: unreadCountsMap.get(phoneNumber) || 0,
                aiEnabled: metadata.aiEnabled !== false,
                createdAt: metadata.createdAt || new Date(),
                updatedAt: new Date(),
                contactId: metadata.contactId || null,
              };
            }
          );
        }

        if (options.resetPagination) {
          setConversations(conversationsList);
          setPagination({
            ...pagination,
            offset: 0,
            totalCount: data.pagination?.totalCount || conversationsList.length,
            hasMore: data.pagination?.hasMore || false,
          });
        } else {
          setConversations((prev) => {
            const combined = [...prev, ...conversationsList];
            return combined;
          });
          setPagination({
            ...pagination,
            offset: pagination.offset + conversationsList.length,
            totalCount: data.pagination?.totalCount || conversationsList.length,
            hasMore: data.pagination?.hasMore || false,
          });
        }

        setLastRefresh(new Date());
      } catch (err) {
        // Log errors only in development
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading conversations:", err);
        }
        setError("Failed to load conversations from backend");
      } finally {
        setLoading(false);
      }
    },
    [pagination, filters]
  );

  // Filter and sort conversations
  const filterAndSortConversations = useCallback(() => {
    if (!Array.isArray(conversations) || conversations.length === 0) {
      setFilteredConversations([]);
      return;
    }

    let filtered = [...conversations];

    // Apply search filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.contactName?.toLowerCase().includes(query) ||
          conv.phoneNumber?.includes(query) ||
          conv.lastMessage?.toLowerCase().includes(query) ||
          conv.leadName?.toLowerCase().includes(query) ||
          conv.leadId?.toLowerCase().includes(query) ||
          conv.status?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.statusFilter && filters.statusFilter !== "all") {
      filtered = filtered.filter((conv) => {
        const convStatus = conv.status?.toLowerCase() || "active";
        return convStatus === filters.statusFilter.toLowerCase();
      });
    }

    // Apply lead status filter
    if (filters.leadStatusFilter && filters.leadStatusFilter !== "all") {
      if (filters.leadStatusFilter === "no_lead") {
        filtered = filtered.filter((conv) => !conv.leadId);
      } else {
        filtered = filtered.filter(
          (conv) =>
            conv.leadStatus?.toLowerCase() ===
            filters.leadStatusFilter.toLowerCase()
        );
      }
    }

    // Apply time filter
    if (filters.timeFilter && filters.timeFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (filters.timeFilter) {
        case "today":
          filtered = filtered.filter(
            (conv) => new Date(conv.lastMessageTime) >= today
          );
          break;
        case "week":
          filtered = filtered.filter(
            (conv) => new Date(conv.lastMessageTime) >= thisWeek
          );
          break;
        case "month":
          filtered = filtered.filter(
            (conv) => new Date(conv.lastMessageTime) >= thisMonth
          );
          break;
        default:
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "contactName":
          aValue = (a.contactName || "").toLowerCase();
          bValue = (b.contactName || "").toLowerCase();
          break;
        case "messageCount":
          aValue = a.messageCount || 0;
          bValue = b.messageCount || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "leadName":
          aValue = (a.leadName || "").toLowerCase();
          bValue = (b.leadName || "").toLowerCase();
          break;
        case "lastMessage":
        default:
          aValue = new Date(a.lastMessageTime || 0);
          bValue = new Date(b.lastMessageTime || 0);
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredConversations(filtered);
  }, [conversations, filters]);

  // Delete conversation
  const deleteConversation = useCallback(async (phoneNumber) => {
    try {
      await ConversationService.deleteConversationByPhone(phoneNumber);
      setConversations((prev) =>
        prev.filter((c) => c.phoneNumber !== phoneNumber)
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Delete multiple conversations
  const deleteConversations = useCallback(async (phoneNumbers) => {
    const results = [];
    for (const phoneNumber of phoneNumbers) {
      try {
        await ConversationService.deleteConversationByPhone(phoneNumber);
        results.push({ phoneNumber, success: true });
      } catch (error) {
        results.push({ phoneNumber, success: false, error: error.message });
      }
    }

    const successfulDeletes = results
      .filter((r) => r.success)
      .map((r) => r.phoneNumber);
    setConversations((prev) =>
      prev.filter((c) => !successfulDeletes.includes(c.phoneNumber))
    );

    return results;
  }, []);

  // Update filters
  const updateFilter = useCallback(
    (filterType, value) => {
      setFilters((prev) => ({
        ...prev,
        [filterType]: value,
      }));

      // Reset pagination when filters change
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPagination((prev) => ({ ...prev, offset: 0 }));

      // Reload conversations with new filters
      setTimeout(() => {
        loadConversations({ resetPagination: true });
      }, 100);
    },
    [loadConversations]
  );

  // Load more conversations (pagination)
  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      loadConversations();
    }
  }, [loading, pagination.hasMore, loadConversations]);

  // Refresh conversations
  const refresh = useCallback(() => {
    loadConversations({ resetPagination: true });
  }, [loadConversations]);

  // Filter conversations when data or filters change
  useEffect(() => {
    filterAndSortConversations();
  }, [filterAndSortConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations({ resetPagination: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    conversations,
    filteredConversations,
    loading,
    error,
    lastRefresh,
    pagination,
    filters,

    // Actions
    loadConversations,
    deleteConversation,
    deleteConversations,
    updateFilter,
    loadMore,
    refresh,

    // Helpers
    setFilters,
  };
};
