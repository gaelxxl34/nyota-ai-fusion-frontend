import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  SmartToy as AIIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import ConversationService from "../../services/conversationService";
import ConversationListSkeleton from "./ConversationListSkeleton";
import EmptyState from "./EmptyState";

const ConversationList = ({
  conversations,
  activeConversation,
  unreadCounts,
  autoReplySettings,
  onConversationSelect,
  onConversationClear,
  onConversationDelete,
  onAutoReplyToggle,
  getProfileName,
  searchTerm,
  loading = false,
  onRefresh,
  hasMoreConversations = false,
  loadingMoreConversations = false,
  onLoadMore,
}) => {
  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const profileName = getProfileName(conv.phoneNumber).toLowerCase();
    const phoneNumber = conv.phoneNumber.toLowerCase();
    const lastMessage = conv.lastMessage.toLowerCase();
    return (
      profileName.includes(searchTerm.toLowerCase()) ||
      phoneNumber.includes(searchTerm.toLowerCase()) ||
      lastMessage.includes(searchTerm.toLowerCase())
    );
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return "";
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  };

  // Confirmation dialog for clearing conversation
  const handleClearConversation = (phoneNumber, contactName) => {
    Swal.fire({
      title: "Clear Conversation?",
      html: `Are you sure you want to clear all messages from <strong>${contactName}</strong>?<br><br><small>This will remove all messages but keep the conversation.</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f44336",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      focusCancel: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show loading state
          Swal.fire({
            title: "Clearing...",
            text: "Please wait while we clear the conversation.",
            icon: "info",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Call the backend operation directly
          await ConversationService.clearConversationMessages(phoneNumber);

          // Refresh the conversations list
          if (onRefresh) {
            await onRefresh();
          }

          // Show success message
          Swal.fire({
            title: "Cleared!",
            text: `All messages have been cleared from ${contactName}.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("❌ Error clearing conversation:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to clear the conversation. Please try again.",
            icon: "error",
          });
        }
      }
    });
  };

  // Confirmation dialog for deleting conversation
  const handleDeleteConversation = (phoneNumber, contactName) => {
    Swal.fire({
      title: "Delete Conversation?",
      html: `Are you sure you want to permanently delete the conversation with <strong>${contactName}</strong>?<br><br><small class="text-danger">This action cannot be undone!</small>`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      focusCancel: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show loading state
          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we delete the conversation.",
            icon: "info",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Call the backend operation directly
          await ConversationService.deleteConversationByPhone(phoneNumber);

          // Refresh the conversations list
          if (onRefresh) {
            await onRefresh();
          }

          // Show success message
          Swal.fire({
            title: "Deleted!",
            text: `The conversation with ${contactName} has been deleted.`,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("❌ Error deleting conversation:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to delete the conversation. Please try again.",
            icon: "error",
          });
        }
      }
    });
  };

  // Show skeleton loading while conversations are loading
  if (loading) {
    return <ConversationListSkeleton count={8} />;
  }

  if (filteredConversations.length === 0) {
    return (
      <EmptyState
        type="conversations"
        searchTerm={searchTerm}
        onAction={onRefresh}
      />
    );
  }

  return (
    <List
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        p: 0,
        height: "100%",
        overflow: "auto",
        maxHeight: "100vh",
      }}
    >
      {filteredConversations.map((conversation) => {
        const unreadCount = unreadCounts.get(conversation.phoneNumber) || 0;
        const isActive = activeConversation === conversation.phoneNumber;
        const aiEnabled =
          autoReplySettings.get(conversation.phoneNumber) !== false;
        const profileName = getProfileName(conversation.phoneNumber);

        return (
          <ListItem
            key={conversation.phoneNumber}
            sx={{
              cursor: "pointer",
              bgcolor: isActive ? "action.selected" : "transparent",
              borderLeft: isActive ? 3 : 0,
              borderLeftColor: "primary.main",
              "&:hover": {
                bgcolor: isActive ? "action.selected" : "action.hover",
              },
              px: 2,
              py: 1.5,
            }}
            onClick={() => onConversationSelect(conversation.phoneNumber)}
          >
            <ListItemAvatar>
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: isActive ? "primary.main" : "grey.300",
                    width: 40,
                    height: 40,
                  }}
                >
                  <PersonIcon />
                </Avatar>
              </Badge>
            </ListItemAvatar>

            <ListItemText
              sx={{ flex: 1, ml: 1 }}
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "primary.main" : "text.primary",
                    }}
                  >
                    {profileName}
                  </Typography>
                  {aiEnabled && (
                    <Tooltip title="AI Auto-reply enabled">
                      <AIIcon sx={{ fontSize: 16, color: "success.main" }} />
                    </Tooltip>
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {truncateMessage(conversation.lastMessage)}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(conversation.lastMessageTime)}
                    </Typography>
                    <Chip
                      label={conversation.leadStatus || "INQUIRY"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor: "grey.100",
                        color: "grey.700",
                      }}
                    />
                  </Box>
                </Box>
              }
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Tooltip title={aiEnabled ? "Disable AI" : "Enable AI"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAutoReplyToggle(conversation.phoneNumber);
                  }}
                  sx={{
                    color: aiEnabled ? "success.main" : "grey.400",
                    "&:hover": {
                      bgcolor: aiEnabled ? "success.light" : "grey.100",
                    },
                  }}
                >
                  <AIIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Clear chat">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearConversation(
                      conversation.phoneNumber,
                      profileName
                    );
                  }}
                  sx={{ color: "warning.main" }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete conversation">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(
                      conversation.phoneNumber,
                      profileName
                    );
                  }}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItem>
        );
      })}

      {/* Load More Button */}
      {hasMoreConversations && (
        <ListItem sx={{ justifyContent: "center", py: 2 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loadingMoreConversations}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              minWidth: 120,
            }}
            startIcon={
              loadingMoreConversations ? <CircularProgress size={16} /> : null
            }
          >
            {loadingMoreConversations ? "Loading..." : "Load More"}
          </Button>
        </ListItem>
      )}
    </List>
  );
};

export default ConversationList;
