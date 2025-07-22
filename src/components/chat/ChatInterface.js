import React, { useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  AdminPanelSettings as AdminIcon,
  ArrowBack as BackIcon,
  Done as CheckIcon,
  DoneAll as DoubleCheckIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import ChatMessagesSkeleton from "./ChatMessagesSkeleton";
import EmptyState from "./EmptyState";

const ChatInterface = ({
  activeConversation,
  chatMessages,
  message,
  setMessage,
  loading,
  onSendMessage,
  onKeyPress,
  onInputChange,
  onBack,
  getProfileName,
  aiTyping,
  userTyping,
  messagesLoading = false,
  onStartConversation,
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getMessageAvatar = (msg) => {
    switch (msg.sender) {
      case "customer":
        return (
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
        );
      case "ai":
        return (
          <Avatar sx={{ bgcolor: "#4caf50", width: 32, height: 32 }}>
            <AIIcon sx={{ fontSize: 18, color: "white" }} />
          </Avatar>
        );
      case "admin":
        return (
          <Avatar sx={{ bgcolor: "#2196f3", width: 32, height: 32 }}>
            <AdminIcon sx={{ fontSize: 18, color: "white" }} />
          </Avatar>
        );
      default:
        return (
          <Avatar sx={{ bgcolor: "grey.400", width: 32, height: 32 }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
        );
    }
  };

  const getMessageAlignment = (sender) => {
    // Incoming messages (customer) on the left, outgoing (AI/admin) on the right
    return sender === "customer" ? "flex-start" : "flex-end";
  };

  const getMessageColor = (sender) => {
    switch (sender) {
      case "customer":
        return "#ffffff"; // White for incoming messages
      case "ai":
        return "#d4f6c8"; // Light green for Miryam (AI) messages
      case "admin":
        return "#e1f5fe"; // Light blue for admin/agent messages
      default:
        return "#ffffff"; // Default to white
    }
  };

  const getMessageBorderColor = (sender) => {
    switch (sender) {
      case "customer":
        return "#e0e0e0"; // Light gray border for incoming
      case "ai":
        return "#4caf50"; // Green border for AI messages
      case "admin":
        return "#2196f3"; // Blue border for admin messages
      default:
        return "#e0e0e0";
    }
  };

  if (!activeConversation) {
    return <EmptyState type="noSelection" />;
  }

  // Show loading skeleton while messages are being fetched
  if (messagesLoading) {
    return <ChatMessagesSkeleton />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      {/* Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "#075E54", // WhatsApp header green
          color: "white",
          borderBottom: "1px solid #128C7E",
        }}
      >
        <IconButton
          onClick={onBack}
          sx={{
            display: { xs: "flex", md: "none" },
            mr: 1,
            color: "white",
          }}
        >
          <BackIcon />
        </IconButton>

        <Avatar
          sx={{
            bgcolor: "#25D366",
            width: 40,
            height: 40,
          }}
        >
          <PersonIcon sx={{ color: "white" }} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            {getProfileName(activeConversation)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.8rem",
            }}
          >
            {activeConversation}
          </Typography>
        </Box>

        {aiTyping.get(activeConversation) && (
          <Chip
            icon={<AIIcon sx={{ color: "white" }} />}
            label="Miryam is typing..."
            size="small"
            sx={{
              bgcolor: "#25D366",
              color: "white",
              fontSize: "0.75rem",
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.7 },
                "100%": { opacity: 1 },
              },
            }}
          />
        )}
      </Paper>

      <Divider />

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "#e5ddd5", // WhatsApp-like chat background
          backgroundImage:
            "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEsLTEpIj48cGF0aCBkPSJNIDEsIDEgTCA5LCA5IE0gOSwgMSBMIDEsIDkiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {chatMessages.length === 0 ? (
          <EmptyState type="messages" onAction={onStartConversation} />
        ) : (
          chatMessages.map((msg, index) => (
            <Box
              key={msg.id || index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: getMessageAlignment(msg.sender),
                gap: 1,
                mb: 1,
              }}
            >
              {/* Avatar for incoming messages (left side) */}
              {msg.sender === "customer" && (
                <Box sx={{ order: 0 }}>{getMessageAvatar(msg)}</Box>
              )}

              {/* Message bubble */}
              <Box
                sx={{
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    msg.sender === "customer" ? "flex-start" : "flex-end",
                  order: msg.sender === "customer" ? 1 : 0,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: getMessageColor(msg.sender),
                    borderRadius: "18px",
                    borderTopLeftRadius:
                      msg.sender === "customer" ? "4px" : "18px",
                    borderTopRightRadius:
                      msg.sender !== "customer" ? "4px" : "18px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    border: `1px solid ${getMessageBorderColor(msg.sender)}`,
                    position: "relative",
                    // Message tail for better visual distinction
                    "&::before":
                      msg.sender === "customer"
                        ? {
                            content: '""',
                            position: "absolute",
                            top: "0px",
                            left: "-8px",
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderRight: `8px solid ${getMessageColor(
                              msg.sender
                            )}`,
                          }
                        : {
                            content: '""',
                            position: "absolute",
                            top: "0px",
                            right: "-8px",
                            width: 0,
                            height: 0,
                            borderTop: "8px solid transparent",
                            borderBottom: "8px solid transparent",
                            borderLeft: `8px solid ${getMessageColor(
                              msg.sender
                            )}`,
                          },
                  }}
                >
                  {/* Sender name for outgoing messages */}
                  {msg.sender !== "customer" && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: msg.sender === "ai" ? "#2e7d32" : "#1565c0",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {msg.sender === "ai" ? "🤖 Miryam" : "👤 Admin"}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      color: "#000000",
                      fontSize: "0.9rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>

                {/* Message metadata */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                    justifyContent:
                      msg.sender === "customer" ? "flex-start" : "flex-end",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                    }}
                  >
                    {formatMessageTime(msg.timestamp)}
                  </Typography>

                  {/* Message status indicators for sent messages */}
                  {msg.sender !== "customer" && (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {msg.sender === "ai" && (
                        <Tooltip title="AI Response">
                          <AIIcon sx={{ fontSize: 10, color: "#4caf50" }} />
                        </Tooltip>
                      )}

                      {msg.status === "sending" && (
                        <Tooltip title="Sending...">
                          <ScheduleIcon
                            sx={{ fontSize: 12, color: "#919191" }}
                          />
                        </Tooltip>
                      )}

                      {msg.status === "failed" && (
                        <Tooltip title="Failed to send">
                          <ErrorIcon sx={{ fontSize: 12, color: "#f44336" }} />
                        </Tooltip>
                      )}

                      {msg.status === "sent" && (
                        <CheckIcon sx={{ fontSize: 12, color: "#919191" }} />
                      )}

                      {msg.status === "delivered" && (
                        <DoubleCheckIcon
                          sx={{ fontSize: 12, color: "#919191" }}
                        />
                      )}

                      {msg.status === "read" && (
                        <DoubleCheckIcon
                          sx={{ fontSize: 12, color: "#25D366" }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Avatar for outgoing messages (right side) */}
              {msg.sender !== "customer" && (
                <Box sx={{ order: 1 }}>{getMessageAvatar(msg)}</Box>
              )}
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Message Input */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#f0f0f0",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message"
          value={message}
          onChange={onInputChange}
          onKeyPress={onKeyPress}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "25px",
              bgcolor: "#ffffff",
              fontSize: "0.9rem",
              "& fieldset": {
                borderColor: "#e0e0e0",
              },
              "&:hover fieldset": {
                borderColor: "#25D366",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#25D366",
              },
            },
          }}
        />

        <IconButton
          color="primary"
          onClick={() => onSendMessage(message)}
          disabled={loading || !message.trim()}
          sx={{
            bgcolor: "#25D366",
            color: "white",
            width: 48,
            height: 48,
            "&:hover": {
              bgcolor: "#128C7E",
            },
            "&.Mui-disabled": {
              bgcolor: "grey.300",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
