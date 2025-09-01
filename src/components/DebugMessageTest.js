import React, { useState } from "react";
import { Button, TextField, Box, Typography } from "@mui/material";
import { axiosInstance } from "../services/axiosConfig";

const DebugMessageTest = ({ activeConversation }) => {
  const [testMessage, setTestMessage] = useState(
    "Test message from debug component"
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSendMessage = async () => {
    if (!activeConversation || !testMessage.trim()) {
      setResult("❌ No active conversation or empty message");
      return;
    }

    setLoading(true);
    setResult("⏳ Sending...");

    try {
      console.log("🧪 DEBUG TEST: Sending message:", {
        to: activeConversation,
        message: testMessage,
      });

      const response = await axiosInstance.post("/api/whatsapp/send-message", {
        to: activeConversation,
        message: testMessage,
        messageType: "text",
      });

      console.log("🧪 DEBUG TEST: Response:", response.data);

      if (response.data.success) {
        setResult("✅ Message sent successfully!");
      } else {
        setResult(`❌ Failed: ${response.data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("🧪 DEBUG TEST: Error:", error);
      setResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #ccc",
        borderRadius: 1,
        mb: 2,
        bgcolor: "#f9f9f9",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        🧪 Debug Message Test
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Active Conversation: {activeConversation || "None selected"}
      </Typography>
      <TextField
        fullWidth
        value={testMessage}
        onChange={(e) => setTestMessage(e.target.value)}
        placeholder="Test message"
        size="small"
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={testSendMessage}
        disabled={loading || !activeConversation || !testMessage.trim()}
        sx={{ mr: 2 }}
      >
        {loading ? "Sending..." : "Test Send Message"}
      </Button>
      {result && (
        <Typography
          variant="body2"
          sx={{ mt: 1, p: 1, bgcolor: "#fff", borderRadius: 1 }}
        >
          {result}
        </Typography>
      )}
    </Box>
  );
};

export default DebugMessageTest;
