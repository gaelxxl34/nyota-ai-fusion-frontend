import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close as CloseIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import ConversationService from "../../services/conversationService";

const ConversationDetailsDialog = ({ open, onClose, conversation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversationMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ConversationService.getConversationMessages(
        conversation.phoneNumber
      );

      setMessages(response.messages || []);
    } catch (err) {
      console.error("Error loading conversation messages:", err);
      setError("Failed to load conversation messages");
    } finally {
      setLoading(false);
    }
  }, [conversation]);

  useEffect(() => {
    if (open && conversation) {
      loadConversationMessages();
    }
  }, [open, conversation, loadConversationMessages]);

  if (!conversation) return null;

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMessageDirection = (message) => {
    return message.direction === "inbound" ? "received" : "sent";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{conversation.contactName}</Typography>
              <Typography variant="body2" color="textSecondary">
                {conversation.phoneNumber}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Conversation Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MessageIcon color="primary" />
                  <Box>
                    <Typography variant="h6">
                      {conversation.messageCount}
                    </Typography>
                    <Typography variant="caption">Messages</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpIcon color="warning" />
                  <Box>
                    <Typography variant="h6">
                      {conversation.unreadCount}
                    </Typography>
                    <Typography variant="caption">Unread</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon color="info" />
                  <Box>
                    <Typography variant="body2">
                      {formatMessageTime(conversation.lastMessageTime)}
                    </Typography>
                    <Typography variant="caption">Last Message</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  <Chip
                    label={conversation.status}
                    color={
                      conversation.status === "Active" ? "success" : "default"
                    }
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lead Information */}
        {conversation.leadId && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.50" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Connected Lead
                </Typography>
                <Typography variant="body2">
                  Lead ID: {conversation.leadId}
                </Typography>
              </Box>
              <Tooltip title="Open lead details">
                <IconButton size="small" color="primary">
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        )}

        {/* Messages List */}
        <Typography variant="h6" gutterBottom>
          Recent Messages
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ maxHeight: 400, overflow: "auto" }}>
            <List>
              {messages.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No messages found"
                    secondary="This conversation appears to be empty"
                  />
                </ListItem>
              ) : (
                messages.map((message, index) => (
                  <React.Fragment key={message.id || index}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body2">
                              {message.content || "No content"}
                            </Typography>
                            <Chip
                              label={getMessageDirection(message)}
                              size="small"
                              color={
                                message.direction === "inbound"
                                  ? "primary"
                                  : "secondary"
                              }
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {formatMessageTime(message.timestamp)}
                            </Typography>
                            {message.messageType &&
                              message.messageType !== "text" && (
                                <Chip
                                  label={message.messageType}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<PhoneIcon />}
          onClick={() => {
            // TODO: Implement call functionality
            console.log("Initiate call to:", conversation.phoneNumber);
          }}
        >
          Call Contact
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversationDetailsDialog;
