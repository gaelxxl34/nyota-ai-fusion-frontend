import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  WhatsApp as WhatsAppIcon,
  Message as MessageIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from "@mui/icons-material";

const EmptyState = ({
  type = "conversations",
  title,
  subtitle,
  icon: CustomIcon,
  actionText,
  onAction,
  searchTerm,
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case "conversations":
        return {
          icon: QuestionAnswerIcon,
          title: searchTerm
            ? "No conversations match your search"
            : "No conversations yet",
          subtitle: searchTerm
            ? "Try adjusting your search terms or start a new conversation"
            : "When customers message you via WhatsApp, their conversations will appear here. Start engaging with your audience!",
          actionText: searchTerm ? null : "Refresh Conversations",
        };
      case "messages":
        return {
          icon: MessageIcon,
          title: "No messages yet",
          subtitle:
            "This conversation is ready to begin. Send the first message to get things started!",
          actionText: "Start Conversation",
        };
      case "noSelection":
        return {
          icon: ChatIcon,
          title: "Select a conversation to start chatting",
          subtitle:
            "Choose from your active conversations in the sidebar to view messages and continue the discussion.",
          actionText: null,
        };
      case "error":
        return {
          icon: PersonIcon,
          title: "Something went wrong",
          subtitle:
            "We couldn't load the data. Please try refreshing the page or check your connection.",
          actionText: "Try Again",
        };
      default:
        return {
          icon: PersonIcon,
          title: "Nothing to show",
          subtitle: "Check back later for updates.",
          actionText: null,
        };
    }
  };

  const defaultContent = getDefaultContent();
  const Icon = CustomIcon || defaultContent.icon;
  const displayTitle = title || defaultContent.title;
  const displaySubtitle = subtitle || defaultContent.subtitle;
  const displayActionText = actionText || defaultContent.actionText;

  const getIconColor = () => {
    switch (type) {
      case "conversations":
        return "#25D366"; // WhatsApp green
      case "messages":
        return "#128C7E"; // Darker WhatsApp green
      case "noSelection":
        return "#075E54"; // WhatsApp dark green
      case "error":
        return "#ff5722"; // Error red
      default:
        return "text.secondary";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        padding: 4,
        textAlign: "center",
        minHeight: type === "conversations" ? 300 : 200,
      }}
    >
      {/* Decorative Background */}
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 3,
          bgcolor: "rgba(0, 0, 0, 0.02)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          maxWidth: 400,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: `${getIconColor()}15`, // 15% opacity
              border: `2px solid ${getIconColor()}30`, // 30% opacity
            }}
          >
            <Icon
              sx={{
                fontSize: 36,
                color: getIconColor(),
              }}
            />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          color="text.primary"
          sx={{
            mb: 2,
            fontWeight: 600,
            fontSize: "1.1rem",
          }}
        >
          {displayTitle}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: displayActionText ? 3 : 0,
            lineHeight: 1.6,
            fontSize: "0.9rem",
          }}
        >
          {displaySubtitle}
        </Typography>

        {/* Action Button */}
        {displayActionText && (
          <Button
            variant="contained"
            onClick={onAction}
            startIcon={type === "conversations" ? <WhatsAppIcon /> : undefined}
            sx={{
              bgcolor: getIconColor(),
              color: "white",
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              py: 1,
              "&:hover": {
                bgcolor:
                  type === "conversations"
                    ? "#128C7E"
                    : type === "messages"
                    ? "#075E54"
                    : type === "error"
                    ? "#d84315"
                    : "primary.dark",
              },
            }}
          >
            {displayActionText}
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default EmptyState;
