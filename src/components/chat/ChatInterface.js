import React, { useRef, useEffect, useState } from "react";
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
  Description as TemplateIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import ChatMessagesSkeleton from "./ChatMessagesSkeleton";
import EmptyState from "./EmptyState";
import ConversationService from "../../services/conversationService";
import Swal from "sweetalert2";

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
  onTemplateMessageSent, // New prop to handle template message sent
  currentUser, // Current user information
}) => {
  const messagesEndRef = useRef(null);
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);
  const [sendingTemplate, setSendingTemplate] = useState(false);

  // Debug: Log messages received by ChatInterface
  useEffect(() => {
    console.log("💬 ChatInterface received messages:", {
      activeConversation,
      messageCount: chatMessages?.length || 0,
      messages: chatMessages,
      messagesLoading,
    });
  }, [chatMessages, activeConversation, messagesLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleTemplateMenuOpen = (event) => {
    setTemplateMenuAnchor(event.currentTarget);
  };

  const handleTemplateMenuClose = () => {
    setTemplateMenuAnchor(null);
  };

  const handleSendTemplateMessage = async (
    templateName = "application_followup_iuea"
  ) => {
    if (!activeConversation || sendingTemplate) return;

    // Close the menu
    handleTemplateMenuClose();

    // Define template configurations
    const templateConfigs = {
      application_followup_iuea: {
        title: "Send Application Follow-up?",
        borderColor: "#25D366",
        preview: `Hi there! 👋<br>
Just checking in to see how things are going with your IUEA application.<br>
We'd love to hear from you — if there's anything you need or any challenge you're facing, feel free to let us know. 😊<br>
We're here to support you and are excited to have you on this journey! 🌟`,
      },
      application_in_review: {
        title: "Send Application Review Status?",
        borderColor: "#ffc107",
        preview: `Hello 👋<br>
Your application is currently under review 📑<br>
Our admissions team is carefully checking your details and documents.<br>
👉 Visit your portal anytime for updates: https://applicant.iuea.ac.ug/`,
      },
      application_qualified: {
        title: "Send Application Qualified Message?",
        borderColor: "#28a745",
        preview: `Great news🎉<br>
Your application has met all requirements, and you are qualified for admission.<br>
👉 Check your portal now for the next steps: https://applicant.iuea.ac.ug/`,
      },
      application_admitted: {
        title: "Send Application Admitted Message?",
        borderColor: "#28a745",
        preview: `Congratulations 🎓🎉<br>
You've been officially admitted to IUEA!<br>
👉 Download your admission letter and complete enrollment here: https://applicant.iuea.ac.ug/<br>
Welcome to the IUEA family 🌍`,
      },
      application_deferred: {
        title: "Send Application Deferred Message?",
        borderColor: "#6c757d",
        preview: `Hello 👋<br>
Your application has been deferred to a later intake ⏳<br>
This means your admission process is postponed for now.<br>
👉 Stay updated by checking your portal: https://applicant.iuea.ac.ug/`,
      },
    };

    const config =
      templateConfigs[templateName] ||
      templateConfigs.application_followup_iuea;

    // Show confirmation dialog
    const result = await Swal.fire({
      title: config.title,
      html: `
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin: 8px 0; color: #666; font-size: 14px;">
            Send template message to <strong>${getProfileName(
              activeConversation
            )}</strong>
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${
            config.borderColor
          }; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #666; font-style: italic; text-align: center;">Message Preview:</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.5; color: #333;">
              "${config.preview}"
            </p>
          </div>
          <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
            This template can be sent outside the 24-hour window.
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: config.borderColor,
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
      width: "min(90vw, 500px)", // Responsive width: 90% of viewport width but max 500px
      padding: "20px",
      customClass: {
        popup: "swal2-responsive-popup",
        htmlContainer: "swal2-responsive-content",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setSendingTemplate(true);

    try {
      // Show loading state
      Swal.fire({
        title: "Sending Message...",
        text: "Please wait while we send your template message.",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        width: "min(90vw, 400px)", // Responsive width
        padding: "20px",
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Send template message
      const result = await ConversationService.sendTemplateMessage(
        activeConversation,
        templateName,
        null // Lead data will be automatically found/created by backend
      );

      if (result.success) {
        // Close loading dialog
        Swal.close();

        // Show success message
        Swal.fire({
          title: "Message Sent! ✅",
          html: `
            <div style="text-align: center;">
              <p style="margin: 10px 0; color: #666; font-size: 14px;">
                Template message sent to <strong>${getProfileName(
                  activeConversation
                )}</strong>
              </p>
              <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
                The message will appear in the conversation once delivered.
              </p>
            </div>
          `,
          icon: "success",
          timer: 2500,
          showConfirmButton: false,
          width: "min(90vw, 450px)", // Responsive width
          padding: "20px",
        });

        // Notify parent component to refresh messages
        if (onTemplateMessageSent) {
          onTemplateMessageSent(activeConversation, result);
        }

        console.log("✅ Template message sent successfully:", result);
      } else {
        throw new Error(result.error || "Failed to send template message");
      }
    } catch (error) {
      console.error("❌ Error sending template message:", error);

      // Close loading dialog
      Swal.close();

      // Show error message
      Swal.fire({
        title: "Failed to Send",
        html: `
          <div style="text-align: center;">
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              Couldn't send the template message at this time.
            </p>
            <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
              <strong>Error:</strong> ${error.message}
            </p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
        width: "min(90vw, 450px)", // Responsive width
        padding: "20px",
      });
    } finally {
      setSendingTemplate(false);
    }
  };

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
          chatMessages.map((msg, index) => {
            console.log(`🎨 Rendering message ${index}:`, {
              id: msg.id,
              content: msg.content?.substring(0, 50) + "...",
              sender: msg.sender,
              senderName: msg.senderName,
              timestamp: msg.timestamp,
            });

            return (
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
                        {msg.sender === "ai"
                          ? `🤖 ${msg.senderName || "Miryam"}`
                          : `👤 ${msg.senderName || "Admin"}`}
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
                            <ErrorIcon
                              sx={{ fontSize: 12, color: "#f44336" }}
                            />
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
            );
          })
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
        {/* Template Message Button */}
        <Tooltip title="Send template message">
          <IconButton
            onClick={handleTemplateMenuOpen}
            disabled={loading || sendingTemplate}
            sx={{
              bgcolor: "#128C7E",
              color: "white",
              width: 40,
              height: 40,
              "&:hover": {
                bgcolor: "#075E54",
              },
              "&.Mui-disabled": {
                bgcolor: "grey.300",
              },
            }}
          >
            {sendingTemplate ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <TemplateIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Template Menu */}
        <Menu
          anchorEl={templateMenuAnchor}
          open={Boolean(templateMenuAnchor)}
          onClose={handleTemplateMenuClose}
          PaperProps={{
            sx: {
              minWidth: 280,
              maxWidth: 350,
              bgcolor: "#ffffff", // Explicit white background
              color: "#000000", // Explicit black text
              border: "1px solid #e0e0e0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          }}
        >
          <MenuItem
            onClick={() =>
              handleSendTemplateMessage("application_followup_iuea")
            }
            disabled={sendingTemplate}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: "#f8f9fa", // Light gray background for visibility
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "#e9ecef", // Darker gray on hover
              },
            }}
          >
            <ListItemIcon>
              <CampaignIcon sx={{ color: "#25D366" }} />
            </ListItemIcon>
            <ListItemText
              primary="Application Follow-up"
              secondary="Check in on IUEA application progress"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#000000 !important", // Explicit black color with !important
                sx: { color: "#000000 !important" },
              }}
              secondaryTypographyProps={{
                fontSize: "0.8rem",
                color: "#666666 !important", // Explicit dark gray color with !important
                sx: { color: "#666666 !important" },
              }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleSendTemplateMessage("application_in_review")}
            disabled={sendingTemplate}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: "#f8f9fa",
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "#e9ecef",
              },
            }}
          >
            <ListItemIcon>
              <ScheduleIcon sx={{ color: "#ffc107" }} />
            </ListItemIcon>
            <ListItemText
              primary="Application In Review"
              secondary="Notify that application is under review"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#000000 !important",
                sx: { color: "#000000 !important" },
              }}
              secondaryTypographyProps={{
                fontSize: "0.8rem",
                color: "#666666 !important",
                sx: { color: "#666666 !important" },
              }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleSendTemplateMessage("application_qualified")}
            disabled={sendingTemplate}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: "#f8f9fa",
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "#e9ecef",
              },
            }}
          >
            <ListItemIcon>
              <CheckIcon sx={{ color: "#28a745" }} />
            </ListItemIcon>
            <ListItemText
              primary="Application Qualified"
              secondary="Great news - application qualified for admission"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#000000 !important",
                sx: { color: "#000000 !important" },
              }}
              secondaryTypographyProps={{
                fontSize: "0.8rem",
                color: "#666666 !important",
                sx: { color: "#666666 !important" },
              }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleSendTemplateMessage("application_admitted")}
            disabled={sendingTemplate}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: "#f8f9fa",
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "#e9ecef",
              },
            }}
          >
            <ListItemIcon>
              <CampaignIcon sx={{ color: "#28a745" }} />
            </ListItemIcon>
            <ListItemText
              primary="Application Admitted"
              secondary="Congratulations - officially admitted to IUEA"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#000000 !important",
                sx: { color: "#000000 !important" },
              }}
              secondaryTypographyProps={{
                fontSize: "0.8rem",
                color: "#666666 !important",
                sx: { color: "#666666 !important" },
              }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleSendTemplateMessage("application_deferred")}
            disabled={sendingTemplate}
            sx={{
              py: 1.5,
              px: 2,
              bgcolor: "#f8f9fa",
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "#e9ecef",
              },
              "&:last-child": {
                mb: 1,
              },
            }}
          >
            <ListItemIcon>
              <ScheduleIcon sx={{ color: "#6c757d" }} />
            </ListItemIcon>
            <ListItemText
              primary="Application Deferred"
              secondary="Application deferred to later intake"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#000000 !important",
                sx: { color: "#000000 !important" },
              }}
              secondaryTypographyProps={{
                fontSize: "0.8rem",
                color: "#666666 !important",
                sx: { color: "#666666 !important" },
              }}
            />
          </MenuItem>
        </Menu>

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
