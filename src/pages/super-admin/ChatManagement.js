import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Alert,
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
} from "@mui/material";
import {
  Search as SearchIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import ConversationService from "../../services/conversationService";

const ChatManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState("today");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete functionality state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuConversation, setMenuConversation] = useState(null);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading conversations in ChatManagement...");

      const data = await ConversationService.fetchConversations();

      // Convert the conversations map to array format for display
      const conversationsList = Array.from(data.conversationsMap.entries()).map(
        ([phoneNumber, messages]) => {
          const metadata = data.conversationMetadataMap.get(phoneNumber) || {};
          const lastMessage = messages[messages.length - 1];

          return {
            id: phoneNumber,
            phoneNumber,
            contactName:
              metadata.contactName || `Contact ${phoneNumber.slice(-4)}`,
            lastMessage: lastMessage?.content || "No messages",
            lastMessageTime: lastMessage?.timestamp || new Date(),
            messageCount: messages.length,
            status: metadata.status || "Active",
            unreadCount: data.unreadCountsMap.get(phoneNumber) || 0,
            leadId: metadata.leadId,
          };
        }
      );

      setConversations(conversationsList);
      console.log(`✅ Loaded ${conversationsList.length} conversations`);
    } catch (err) {
      console.error("❌ Error loading conversations:", err);
      setError("Failed to load conversations from backend");
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic stats based on conversations
  const stats = [
    {
      title: "Active Conversations",
      value: loading
        ? "..."
        : conversations.filter((c) => c.status === "Active").length.toString(),
      icon: <ChatIcon />,
      color: "#2196f3",
    },
    {
      title: "Total Messages",
      value: loading
        ? "..."
        : conversations.reduce((sum, c) => sum + c.messageCount, 0).toString(),
      icon: <AssessmentIcon />,
      color: "#4caf50",
    },
    {
      title: "Unread Messages",
      value: loading
        ? "..."
        : conversations.reduce((sum, c) => sum + c.unreadCount, 0).toString(),
      icon: <WarningIcon />,
      color: "#ff9800",
    },
    {
      title: "Connected Leads",
      value: loading
        ? "..."
        : conversations.filter((c) => c.leadId).length.toString(),
      icon: <PersonIcon />,
      color: "#9c27b0",
    },
  ];

  const recentChats = [
    {
      id: 1,
      organization: "Tech Solutions Inc",
      status: "Active",
      startTime: new Date(),
      messages: 45,
      performance: 98,
    },
    // Add more mock data
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Delete functionality handlers
  const handleDeleteClick = (conversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await ConversationService.deleteConversationByPhone(
        conversationToDelete.phoneNumber
      );

      // Update local state
      setConversations((prev) =>
        prev.filter((c) => c.phoneNumber !== conversationToDelete.phoneNumber)
      );

      setSnackbarMessage(
        `Conversation with ${conversationToDelete.contactName} deleted successfully`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(`Failed to delete conversation: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedConversations.size === 0) {
      setSnackbarMessage("Please select conversations to delete");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setLoading(true);
      const phoneNumbers = Array.from(selectedConversations);

      // Delete each conversation
      for (const phoneNumber of phoneNumbers) {
        await ConversationService.deleteConversationByPhone(phoneNumber);
      }

      // Update local state
      setConversations((prev) =>
        prev.filter((c) => !selectedConversations.has(c.phoneNumber))
      );
      setSelectedConversations(new Set());

      setSnackbarMessage(
        `Successfully deleted ${phoneNumbers.length} conversations`
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(`Failed to delete conversations: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
    if (selectedConversations.size === conversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(
        new Set(conversations.map((c) => c.phoneNumber))
      );
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Chat Management
        </Typography>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" />
          <Tab label="Active Sessions" />
          <Tab label="Chat Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search chats..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <Select
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
              >
                <MenuItem value="all">All Organizations</MenuItem>
                <MenuItem value="tech">Tech Solutions Inc</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                {loading ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Skeleton
                        variant="circular"
                        width={40}
                        height={40}
                        sx={{ mr: 2 }}
                      />
                      <Skeleton variant="text" width="60%" height={24} />
                    </Box>
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          color: stat.color,
                          mr: 2,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant="h6" color="textSecondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {stat.value}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Conversations List */}
      <Paper sx={{ p: 2, maxHeight: "600px", overflow: "auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Active Conversations</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {conversations.length > 0 && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        selectedConversations.size === conversations.length &&
                        conversations.length > 0
                      }
                      indeterminate={
                        selectedConversations.size > 0 &&
                        selectedConversations.size < conversations.length
                      }
                      onChange={handleSelectAll}
                    />
                  }
                  label="Select All"
                />
                {selectedConversations.size > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleBulkDeleteClick}
                    size="small"
                  >
                    Delete Selected ({selectedConversations.size})
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        {loading ? (
          <List>
            {[...Array(5)].map((_, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Skeleton variant="text" width="30%" height={24} />
                        <Skeleton
                          variant="rectangular"
                          width={60}
                          height={24}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        <Skeleton variant="text" width="15%" height={16} />
                        <Skeleton variant="text" width="15%" height={16} />
                        <Skeleton variant="text" width="20%" height={16} />
                      </Box>
                    }
                  />
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : conversations.length === 0 ? (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No conversations found
          </Typography>
        ) : (
          <List>
            {conversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, conversation)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <Checkbox
                    checked={selectedConversations.has(
                      conversation.phoneNumber
                    )}
                    onChange={() =>
                      handleConversationSelect(conversation.phoneNumber)
                    }
                    sx={{ mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body1">
                          {conversation.contactName}
                        </Typography>
                        <Chip
                          size="small"
                          label={conversation.status}
                          color={
                            conversation.status === "Active"
                              ? "success"
                              : "default"
                          }
                        />
                        {conversation.unreadCount > 0 && (
                          <Chip
                            size="small"
                            label={conversation.unreadCount}
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", flex: 1, gap: 2, mt: 1 }}>
                        <Typography variant="caption">
                          Phone: {conversation.phoneNumber}
                        </Typography>
                        <Typography variant="caption">
                          Messages: {conversation.messageCount}
                        </Typography>
                        <Typography variant="caption">
                          Last:{" "}
                          {new Date(
                            conversation.lastMessageTime
                          ).toLocaleString()}
                        </Typography>
                        {conversation.leadId && (
                          <Typography variant="caption" color="primary">
                            Lead: {conversation.leadId.slice(0, 8)}...
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => handleDeleteClick(menuConversation)}>
          <DeleteIcon sx={{ mr: 1 }} color="error" />
          Delete Conversation
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
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
            <strong>{conversationToDelete?.contactName}</strong>?
            <br />
            This will permanently remove all{" "}
            {conversationToDelete?.messageCount || 0} messages and cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
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
            Are you sure you want to delete{" "}
            <strong>{selectedConversations.size}</strong> conversations?
            <br />
            This will permanently remove all associated messages and cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<DeleteSweepIcon />}
          >
            Delete All Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Chat Sessions Table */}
      <Paper sx={{ p: 2 }}>
        <List>
          {recentChats.map((chat) => (
            <React.Fragment key={chat.id}>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" size="small">
                    <SettingsIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">
                        {chat.organization}
                      </Typography>
                      <Chip
                        size="small"
                        label={chat.status}
                        color={chat.status === "Active" ? "success" : "default"}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Typography variant="caption">
                        Started: {chat.startTime.toLocaleTimeString()}
                      </Typography>
                      <Typography variant="caption">
                        Messages: {chat.messages}
                      </Typography>
                      <Typography variant="caption">
                        Performance: {chat.performance}%
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ChatManagement;
