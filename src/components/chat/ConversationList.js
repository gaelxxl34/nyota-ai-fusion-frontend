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
} from "@mui/material";
import {
  Person as PersonIcon,
  SmartToy as AIIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
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
                    onConversationClear(conversation.phoneNumber);
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
                    onConversationDelete(conversation.phoneNumber);
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
    </List>
  );
};

export default ConversationList;
