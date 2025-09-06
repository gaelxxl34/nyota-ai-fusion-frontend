import { useState, useEffect, useCallback, useMemo } from "react";
import { leadService } from "../services/leadService";

/**
 * Custom hook for lead management with optimized state management and real-time updates
 * Promotes code reusability across different components
 */
export const useLeadManagement = ({
  autoRefresh = true,
  refreshInterval = 120000, // 2 minutes
  initialFilters = {},
  initialSortBy = "createdAt",
  initialSortOrder = "desc",
  pageSize = 50,
} = {}) => {
  // State management
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    bySource: {},
    byProgram: {},
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and sorting state
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    program: "",
    dateRange: "month",
    search: "",
    ...initialFilters,
  });
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Optimized fetch function with error handling and retry logic
  const fetchLeads = useCallback(
    async (options = {}) => {
      const { loadMore = false, forceRefresh = false } = options;

      try {
        if (!loadMore) {
          setLoading(true);
          setError("");
        }

        const offset = loadMore ? leads.length : 0;
        const queryParams = {
          limit: pageSize,
          offset,
          sortBy,
          sortOrder,
          ...filters,
        };

        // Remove empty filters to optimize query
        Object.keys(queryParams).forEach(
          (key) =>
            (!queryParams[key] || queryParams[key] === "") &&
            delete queryParams[key]
        );

        console.log(`🔍 Fetching leads with params:`, queryParams);

        const response = await leadService.getAllLeads(queryParams);

        if (!response || !response.data) {
          throw new Error("Invalid response from lead service");
        }

        const newLeads = response.data;
        const hasMoreData = response.pagination?.hasMore || false;
        // Set pagination total for stats calculation

        // Update leads list
        if (loadMore) {
          setLeads((prev) => {
            const existingIds = new Set(prev.map((lead) => lead.id));
            const uniqueNewLeads = newLeads.filter(
              (lead) => !existingIds.has(lead.id)
            );
            return [...prev, ...uniqueNewLeads];
          });
        } else {
          setLeads(newLeads);
        }

        setHasMore(hasMoreData);

        // Fetch or update stats
        if (!loadMore || forceRefresh) {
          const statsResponse = await leadService.getLeadStats();
          if (statsResponse?.data) {
            const statsData = statsResponse.data;
            const conversionRate = statsData.total
              ? Math.round(
                  ((statsData.byStatus?.ENROLLED || 0) / statsData.total) * 100
                )
              : 0;

            setStats({
              ...statsData,
              conversionRate,
            });
          }
        }

        console.log(`✅ Successfully fetched ${newLeads.length} leads`);
      } catch (err) {
        console.error("❌ Error fetching leads:", err);
        setError(err.message || "Failed to fetch leads");

        // Implement retry logic for network errors
        if (
          err.message?.includes("network") ||
          err.message?.includes("timeout")
        ) {
          console.log("🔄 Network error detected, will retry...");
          setTimeout(() => {
            if (!loadMore) fetchLeads({ ...options, forceRefresh: true });
          }, 3000);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [leads.length, sortBy, sortOrder, filters, pageSize]
  );

  // Initialize data and setup auto-refresh
  useEffect(() => {
    fetchLeads({ forceRefresh: true });

    if (!autoRefresh) return;

    console.log(`🔄 Setting up auto-refresh every ${refreshInterval}ms`);
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing leads data...");
      setRefreshing(true);
      fetchLeads({ forceRefresh: true });
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      console.log("🛑 Auto-refresh cleared");
    };
  }, [autoRefresh, refreshInterval, fetchLeads]);

  // Refetch when filters (except search) or sorting changes
  useEffect(() => {
    // Don't refetch for search filter changes as it's handled client-side
    const shouldRefetch = leads.length > 0 || !loading;
    if (shouldRefetch) {
      setLeads([]);
      setHasMore(true);
      fetchLeads({ forceRefresh: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.source,
    filters.program,
    filters.dateRange,
    sortBy,
    sortOrder,
  ]);

  // Memoized filtered and processed data
  const processedData = useMemo(() => {
    let filteredLeads = leads;

    // Client-side search filtering for better UX
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredLeads = leads.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm) ||
          lead.phone?.includes(searchTerm) ||
          (typeof lead.program === "string" &&
            lead.program?.toLowerCase().includes(searchTerm)) ||
          (typeof lead.program === "object" &&
            lead.program !== null &&
            (lead.program.name?.toLowerCase().includes(searchTerm) ||
              lead.program.code?.toLowerCase().includes(searchTerm))) ||
          lead.id?.toLowerCase().includes(searchTerm)
      );
    }

    return {
      leads: filteredLeads,
      count: filteredLeads.length,
      totalCount: stats.total,
    };
  }, [leads, filters.search, stats.total]);

  // Helper functions
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      console.log(`🔧 Filter updated: ${key} = ${value}`);
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: "",
      source: "",
      program: "",
      dateRange: "month",
      search: "",
    });
    console.log("🧹 All filters cleared");
  }, []);

  const updateSort = useCallback((field, order = "desc") => {
    setSortBy(field);
    setSortOrder(order);
    console.log(`📊 Sort updated: ${field} ${order}`);
  }, []);

  const refresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    setRefreshing(true);
    setLeads([]);
    setHasMore(true);
    fetchLeads({ forceRefresh: true });
  }, [fetchLeads]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log("📖 Loading more leads...");
      fetchLeads({ loadMore: true });
    }
  }, [loading, hasMore, fetchLeads]);

  // Lead management actions
  const updateLead = useCallback(async (leadId, updates) => {
    try {
      const response = await leadService.updateLead(leadId, updates);
      if (response?.data) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, ...response.data } : lead
          )
        );
        console.log(`✅ Lead ${leadId} updated successfully`);
        return response.data;
      }
    } catch (err) {
      console.error(`❌ Error updating lead ${leadId}:`, err);
      setError(err.message || "Failed to update lead");
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (leadId) => {
    try {
      await leadService.deleteLead(leadId);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      console.log(`🗑️ Lead ${leadId} deleted successfully`);
    } catch (err) {
      console.error(`❌ Error deleting lead ${leadId}:`, err);
      setError(err.message || "Failed to delete lead");
      throw err;
    }
  }, []);

  const createLead = useCallback(async (leadData) => {
    try {
      const response = await leadService.createLead(leadData);
      if (response?.data) {
        setLeads((prev) => [response.data, ...prev]);
        setStats((prev) => ({ ...prev, total: prev.total + 1 }));
        console.log("✅ New lead created successfully");
        return response.data;
      }
    } catch (err) {
      console.error("❌ Error creating lead:", err);
      setError(err.message || "Failed to create lead");
      throw err;
    }
  }, []);

  // Analytics helpers
  const getStatusColor = useCallback((status) => {
    const colors = {
      INQUIRY: "primary",
      INTERESTED: "warning", // Current status system
      PRE_QUALIFIED: "warning", // Legacy status for backward compatibility
      APPLIED: "info",
      MISSING_DOCUMENT: "error",
      IN_REVIEW: "primary",
      QUALIFIED: "success",
      ADMITTED: "secondary",
      ENROLLED: "success",
      DEFERRED: "warning",
      EXPIRED: "error",
      REJECTED: "error", // Legacy status
      NURTURE: "warning", // Legacy status
    };
    return colors[status] || "default";
  }, []);

  const getSourceIcon = useCallback((source) => {
    // Return the source type for the component to handle icon rendering
    return source;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return "Invalid Date";
    }
  }, []);

  // Export data function
  const exportLeads = useCallback(
    async (format = "csv") => {
      try {
        console.log(`📊 Exporting leads as ${format}...`);
        const response = await leadService.exportLeads({
          format,
          filters,
          sortBy,
          sortOrder,
        });

        if (response?.data) {
          // Create and download file
          const blob = new Blob([response.data], {
            type: format === "csv" ? "text/csv" : "application/json",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `leads_export_${
            new Date().toISOString().split("T")[0]
          }.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log("✅ Leads exported successfully");
        }
      } catch (err) {
        console.error("❌ Error exporting leads:", err);
        setError(err.message || "Failed to export leads");
        throw err;
      }
    },
    [filters, sortBy, sortOrder]
  );

  return {
    // Data
    leads: processedData.leads,
    stats,
    loading,
    error,
    hasMore,
    refreshing,

    // Filters and sorting
    filters,
    sortBy,
    sortOrder,

    // Actions
    updateFilter,
    clearFilters,
    updateSort,
    refresh,
    loadMore,

    // CRUD operations
    updateLead,
    deleteLead,
    createLead,

    // Utilities
    getStatusColor,
    getSourceIcon,
    formatDate,
    exportLeads,

    // Computed values
    filteredCount: processedData.count,
    totalCount: processedData.totalCount,
    conversionRate: stats.conversionRate,

    // State setters for advanced use cases
    setError,
    setLeads,
  };
};

export default useLeadManagement;
