import React, { useState } from "react";
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
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
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
    refresh,
  } = useConversations();

  // Debug logging
  console.log("ChatManagement - Conversations:", {
    all: conversations?.length || 0,
    filtered: filteredConversations?.length || 0,
    loading,
    error,
    filters,
  });

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
        title: "Active Conversations",
        value: loading ? "..." : (conversationStats.active || 0).toString(),
        icon: <ChatIcon />,
        color: "primary",
      },
      {
        title: "Total Leads",
        value: loading ? "..." : (conversationStats.totalLeads || 0).toString(),
        icon: <PersonIcon />,
        color: "success",
      },
      {
        title: "Response Rate",
        value: loading ? "..." : `${conversationStats.responseRate || 0}%`,
        icon: <AssessmentIcon />,
        color: "info",
      },
      {
        title: "Issues",
        value: loading ? "..." : (conversationStats.issues || 0).toString(),
        icon: <WarningIcon />,
        color: "warning",
      },
    ];
  }, [filteredConversations, loading]);

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
        <Typography variant="h4" gutterBottom>
          Chat Management
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
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
          {selectedConversations.size > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleBulkDeleteClick}
            >
              Delete Selected ({selectedConversations.size})
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics Cards */}
      <StatsCards stats={stats} />

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
          <ConversationFilters
            filters={filters}
            onFilterChange={updateFilter}
            totalCount={conversations.length}
            filteredCount={filteredConversations.length}
          />

          {/* Bulk Actions */}
          {filteredConversations.length > 0 && (
            <Box
              sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
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
                      selectedConversations.size < filteredConversations.length
                    }
                    onChange={handleSelectAll}
                  />
                }
                label={`Select All (${selectedConversations.size} selected)`}
              />
            </Box>
          )}

          {/* Conversations List */}
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
