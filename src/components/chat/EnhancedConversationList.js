import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Divider,
  Box,
  Typography,
  Chip,
  Checkbox,
  IconButton,
} from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";

/**
 * Individual conversation item component
 * Displays conversation details with consistent formatting
 */
const ConversationItem = ({
  conversation,
  isSelected = false,
  onSelect,
  onMenuOpen,
  onClick,
}) => {
  // Safety check for invalid conversation data
  if (!conversation || !conversation.phoneNumber) {
    console.error("Invalid conversation data:", conversation);
    return null;
  }

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelect?.(conversation.phoneNumber);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onMenuOpen?.(e, conversation);
  };

  return (
    <ListItem
      secondaryAction={
        <IconButton edge="end" size="small" onClick={handleMenuClick}>
          <MoreVertIcon />
        </IconButton>
      }
      sx={{
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
      onClick={() => onClick?.(conversation)}
    >
      <Checkbox
        checked={isSelected}
        onChange={handleCheckboxChange}
        sx={{ mr: 1 }}
      />
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{ fontWeight: 500 }}
            >
              {conversation.leadName || conversation.contactName}
            </Typography>
            <Chip
              size="small"
              label={conversation.status || "Active"}
              color={
                (conversation.status || "active").toLowerCase() === "active"
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
            {conversation.leadId && (
              <Chip
                size="small"
                label={conversation.leadStatus || "Lead"}
                color="primary"
                variant="outlined"
              />
            )}
            {!conversation.aiEnabled && (
              <Chip
                size="small"
                label="AI Off"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: "flex", flex: 1, gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Phone: {conversation.phoneNumber}
            </Typography>
            {conversation.leadName &&
              conversation.leadName !== conversation.contactName && (
                <Typography variant="caption" color="primary">
                  Contact: {conversation.contactName}
                </Typography>
              )}
            <Typography variant="caption" color="text.secondary">
              Messages: {conversation.messageCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last: {new Date(conversation.lastMessageTime).toLocaleString()}
            </Typography>
            {conversation.lastMessageFrom && (
              <Typography variant="caption" color="text.secondary">
                From: {conversation.lastMessageFrom}
              </Typography>
            )}
            {conversation.leadId && (
              <Typography variant="caption" color="primary">
                Lead ID: {conversation.leadId.slice(0, 8)}...
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

/**
 * Loading skeleton for conversation items
 */
const ConversationItemSkeleton = () => (
  <ListItem>
    <ListItemText
      primary={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
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
);

/**
 * Enhanced conversation list component
 * Handles display of conversations with loading and empty states
 */
const EnhancedConversationList = ({
  conversations = [],
  loading = false,
  selectedConversations = new Set(),
  onConversationSelect,
  onConversationClick,
  onMenuOpen,
  searchQuery = "",
  timeFilter = "all",
}) => {
  if (loading) {
    return (
      <List>
        {[...Array(5)].map((_, index) => (
          <React.Fragment key={index}>
            <ConversationItemSkeleton />
            <Divider />
          </React.Fragment>
        ))}
      </List>
    );
  }

  console.log("EnhancedConversationList - Received conversations:", {
    count: conversations?.length || 0,
    data: conversations,
  });

  if (!conversations || conversations.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {searchQuery || timeFilter !== "all"
            ? "No conversations match your filters"
            : "No conversations found"}
        </Typography>
        {(searchQuery || timeFilter !== "all") && (
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <List>
      {conversations.map((conversation) => (
        <React.Fragment key={conversation.id}>
          <ConversationItem
            conversation={conversation}
            isSelected={selectedConversations.has(conversation.phoneNumber)}
            onSelect={onConversationSelect}
            onMenuOpen={onMenuOpen}
            onClick={onConversationClick}
          />
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
};

export default EnhancedConversationList;
