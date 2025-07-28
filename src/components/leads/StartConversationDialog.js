import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
} from "@mui/material";
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { leadService } from "../../services/leadService";
import { useNavigate } from "react-router-dom";

const StartConversationDialog = ({ open, onClose, lead }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Send WhatsApp message to the lead
      await leadService.sendWhatsAppMessage(
        lead.phone || lead.phoneNumber,
        message,
        {
          leadId: lead.id,
          leadName: lead.name,
        }
      );

      // Navigate to chat configuration after sending message
      navigate("/admin/chat-config");
      onClose();
    } catch (err) {
      console.error("Error sending WhatsApp message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    // Navigate directly to chat configuration without sending a message
    navigate("/admin/chat-config");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WhatsAppIcon color="success" />
          Start WhatsApp Conversation
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lead Information */}
        <Box
          sx={{
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {lead?.name?.charAt(0)?.toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {lead?.name || "Unknown"}
              </Typography>
              <Chip
                label={lead?.status || "N/A"}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {lead?.phone || lead?.phoneNumber || "N/A"}
              </Typography>
            </Box>
            {lead?.email && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">{lead.email}</Typography>
              </Box>
            )}
            {lead?.program && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  Interested in: {lead.program}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Message Input */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Send an initial message (optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            You can send a personalized message to start the conversation, or go
            directly to the chat interface.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleOpenChat} variant="outlined" disabled={loading}>
          Open Chat Interface
        </Button>
        <Button
          onClick={handleSendMessage}
          variant="contained"
          color="success"
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? "Sending..." : "Send & Open Chat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartConversationDialog;
