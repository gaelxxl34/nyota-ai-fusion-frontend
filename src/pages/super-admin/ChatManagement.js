import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Menu,
  MenuItem as MenuItemComponent,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
  Badge,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  CloudDownload as LoadAllIcon,
  FilterList as FilterIcon,
  CloudDownload,
} from "@mui/icons-material";

// Custom hooks and components
import { useConversations } from "../../hooks/useConversations";
import ConversationFilters from "../../components/chat/ConversationFilters";
import EnhancedConversationList from "../../components/chat/EnhancedConversationList";
import StatsCards from "../../components/common/StatsCards";
import ConversationDetailsDialog from "../../components/chat/ConversationDetailsDialog";
import ChatAnalyticsDashboard from "../../components/chat/ChatAnalyticsDashboard";
import ChatSettingsPanel from "../../components/chat/ChatSettingsPanel";

// Utilities
import {
  generateCSVExport,
  downloadCSV,
  calculateConversationStats,
} from "../../utils/conversationUtils";

/**
 * Chat Management Component
 * Main component for managing WhatsApp conversations with clean architecture
 * Features: filtering, sorting, bulk operations, analytics, and settings
 */
const ChatManagement = () => {
  // Component state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConversationForDetails, setSelectedConversationForDetails] =
    useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [totalConversationsCount, setTotalConversationsCount] = useState(0);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuConversation, setMenuConversation] = useState(null);

  // Use conversations hook for data management
  const {
    conversations,
    filteredConversations,
    loading,
    error,
    lastRefresh,
    pagination,
    filters,
    deleteConversation,
    deleteConversations,
    updateFilter,
    loadMore,
    loadConversations,
    refresh,
  } = useConversations();

  // Debug logging
  console.log("ChatManagement - Conversations:", {
    all: conversations?.length || 0,
    filtered: filteredConversations?.length || 0,
    loading,
    error,
    filters,
    pagination,
  });

  // Update total conversations count when data changes
  useEffect(() => {
    if (pagination?.totalCount) {
      setTotalConversationsCount(pagination.totalCount);
    }
  }, [pagination]);

  // Load all conversations function
  const handleLoadAllConversations = async () => {
    setLoadingAll(true);
    try {
      // Calculate how many more conversations we need to load
      const remaining = (pagination?.totalCount || 0) - conversations.length;

      if (remaining > 0) {
        showSnackbar(`Loading ${remaining} remaining conversations...`, "info");

        // Load all remaining conversations by setting a high limit
        await loadConversations({
          resetPagination: false,
          limit: remaining,
          offset: conversations.length,
        });

        showSnackbar(
          `Successfully loaded all ${
            pagination?.totalCount || 0
          } conversations`,
          "success"
        );
      } else {
        showSnackbar("All conversations are already loaded", "info");
      }
    } catch (error) {
      showSnackbar(
        `Failed to load all conversations: ${error.message}`,
        "error"
      );
    } finally {
      setLoadingAll(false);
    }
  };

  // Calculate statistics from conversations
  const stats = React.useMemo(() => {
    const conversationStats = calculateConversationStats(
      filteredConversations
    ) || {
      active: 0,
      totalLeads: 0,
      responseRate: 0,
      issues: 0,
    };

    return [
      {
        title: "Total Conversations",
        value: loading
          ? "..."
          : (totalConversationsCount || conversations?.length || 0).toString(),
        icon: <ChatIcon />,
        color: "primary",
        subtitle: `${conversations?.length || 0} loaded`,
      },
      {
        title: "Filtered Results",
        value: loading
          ? "..."
          : (filteredConversations?.length || 0).toString(),
        icon: <FilterIcon />,
        color: "info",
        subtitle: "Matching filters",
      },
      {
        title: "Total Leads",
        value: loading ? "..." : (conversationStats.totalLeads || 0).toString(),
        icon: <PersonIcon />,
        color: "success",
        subtitle: "Active leads",
      },
      {
        title: "Issues Found",
        value: loading ? "..." : (conversationStats.issues || 0).toString(),
        icon: <WarningIcon />,
        color: "warning",
        subtitle: "Need attention",
      },
    ];
  }, [filteredConversations, conversations, totalConversationsCount, loading]);

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleExportConversations = () => {
    try {
      const csvContent = generateCSVExport(filteredConversations);
      const filename = `conversations_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      downloadCSV(csvContent, filename);

      showSnackbar(
        `Exported ${filteredConversations.length} conversations to CSV`,
        "success"
      );
    } catch (error) {
      showSnackbar(`Export failed: ${error.message}`, "error");
    }
  };

  const handleViewDetails = (conversation) => {
    setSelectedConversationForDetails(conversation);
    setDetailsDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = (conversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteConversation(conversationToDelete.phoneNumber);
      if (result.success) {
        showSnackbar(
          `Conversation with ${conversationToDelete.contactName} deleted successfully`,
          "success"
        );
      } else {
        showSnackbar(`Failed to delete conversation: ${result.error}`, "error");
      }
    } catch (error) {
      showSnackbar(`Failed to delete conversation: ${error.message}`, "error");
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedConversations.size === 0) {
      showSnackbar("Please select conversations to delete", "warning");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const phoneNumbers = Array.from(selectedConversations);
      const results = await deleteConversations(phoneNumbers);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (failureCount === 0) {
        showSnackbar(
          `Successfully deleted ${successCount} conversations`,
          "success"
        );
      } else {
        showSnackbar(
          `Deleted ${successCount} conversations, ${failureCount} failed`,
          "warning"
        );
      }

      setSelectedConversations(new Set());
    } catch (error) {
      showSnackbar(`Failed to delete conversations: ${error.message}`, "error");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleMenuOpen = (event, conversation) => {
    setAnchorEl(event.currentTarget);
    setMenuConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuConversation(null);
  };

  const handleConversationSelect = (phoneNumber) => {
    setSelectedConversations((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(phoneNumber)) {
        newSelected.delete(phoneNumber);
      } else {
        newSelected.add(phoneNumber);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedConversations.size === filteredConversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(
        new Set(filteredConversations.map((c) => c.phoneNumber))
      );
    }
  };

  // Helper function for showing snackbar messages
  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading conversations: {error}
          <Button onClick={handleRefresh} sx={{ ml: 2 }}>
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Chat Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalConversationsCount > 0 && (
              <>
                {conversations?.length || 0} of {totalConversationsCount}{" "}
                conversations loaded
                {conversations?.length !== totalConversationsCount && (
                  <>
                    {" "}
                    • {totalConversationsCount -
                      (conversations?.length || 0)}{" "}
                    remaining
                  </>
                )}
              </>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {/* Load All Conversations Button */}
          {conversations?.length < totalConversationsCount && (
            <Button
              variant="outlined"
              startIcon={<LoadAllIcon />}
              onClick={handleLoadAllConversations}
              disabled={loading || loadingAll}
              color="info"
            >
              Load All ({totalConversationsCount - (conversations?.length || 0)}{" "}
              more)
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || loadingAll}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportConversations}
            disabled={loading || filteredConversations.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Loading indicator for load all operation */}
      {loadingAll && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Loading all conversations...
          </Typography>
        </Box>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedConversations.size > 0 && (
        <Paper
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "primary.light",
            color: "primary.contrastText",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">
              {selectedConversations.size} conversation
              {selectedConversations.size !== 1 ? "s" : ""} selected
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedConversations(new Set())}
              sx={{
                borderColor: "primary.contrastText",
                color: "primary.contrastText",
                "&:hover": {
                  borderColor: "primary.contrastText",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Clear Selection
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleBulkDeleteClick}
              size="small"
            >
              Delete Selected
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportConversations}
              size="small"
              sx={{
                borderColor: "primary.contrastText",
                color: "primary.contrastText",
                "&:hover": {
                  borderColor: "primary.contrastText",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Export Selected
            </Button>
          </Box>
        </Paper>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                background: `linear-gradient(135deg, ${
                  stat.color === "primary"
                    ? "#1976d2, #42a5f5"
                    : stat.color === "success"
                    ? "#2e7d32, #66bb6a"
                    : stat.color === "warning"
                    ? "#ed6c02, #ffb74d"
                    : "#0288d1, #4fc3f7"
                })`,
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      {stat.title}
                    </Typography>
                    {stat.subtitle && (
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      opacity: 0.3,
                      transform: "scale(1.5)",
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Conversations" />
          <Tab label="Analytics" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <ConversationFilters
              filters={filters}
              onFilterChange={updateFilter}
              totalCount={conversations.length}
              filteredCount={filteredConversations.length}
            />
          </Paper>

          {/* Load More Button */}
          {pagination.hasMore && !loadingAll && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={loading}
                startIcon={<CloudDownload />}
              >
                Load More Conversations
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Loaded {conversations.length} of{" "}
                {pagination.totalCount || "many"} conversations
              </Typography>
            </Box>
          )}

          {/* Bulk Actions */}
          {filteredConversations.length > 0 && (
            <Paper sx={{ mb: 2, p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        selectedConversations.size ===
                          filteredConversations.length &&
                        filteredConversations.length > 0
                      }
                      indeterminate={
                        selectedConversations.size > 0 &&
                        selectedConversations.size <
                          filteredConversations.length
                      }
                      onChange={handleSelectAll}
                    />
                  }
                  label={`Select All (${selectedConversations.size} selected)`}
                />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredConversations.length} of{" "}
                  {conversations.length} loaded conversations
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Conversations List */}
          <Paper>
            <EnhancedConversationList
              conversations={filteredConversations}
              loading={loading}
              selectedConversations={selectedConversations}
              onConversationSelect={handleConversationSelect}
              onMenuOpen={handleMenuOpen}
              onLoadMore={loadMore}
              hasMore={pagination.hasMore}
              lastRefresh={lastRefresh}
            />
          </Paper>
        </Box>
      )}

      {activeTab === 1 && (
        <ChatAnalyticsDashboard conversations={conversations} />
      )}

      {activeTab === 2 && (
        <ChatSettingsPanel
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
        />
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItemComponent onClick={() => handleViewDetails(menuConversation)}>
          View Details
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleDeleteClick(menuConversation)}>
          <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
          Delete
        </MenuItemComponent>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the conversation with{" "}
            {conversationToDelete?.contactName || "this contact"}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Multiple Conversations</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedConversations.size}{" "}
            selected conversations? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Conversation Details Dialog */}
      <ConversationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        conversation={selectedConversationForDetails}
      />
    </Box>
  );
};

export default ChatManagement;
