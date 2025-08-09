/**
 * Chat Message Handler Service
 * Handles real-time message processing and state management for the chat interface
 */

class ChatMessageHandler {
  /**
   * Normalize phone number format
   */
  static normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== "string") return null;
    const normalized = phone.replace(/[^\d]/g, "");
    return normalized.length > 0 ? normalized : null;
  }

  /**
   * Create message object for UI display
   */
  static createMessageObject(messageData, sender = "customer") {
    const phoneNumber = this.normalizePhoneNumber(
      messageData.from || messageData.phoneNumber || messageData.to
    );

    let senderName = "";
    let isAI = false;
    let isAdmin = false;

    // Determine sender and sender name
    if (sender === "customer" || messageData.direction === "incoming") {
      senderName =
        messageData.senderName ||
        messageData.profileName ||
        `Contact ${phoneNumber?.slice(-4) || "Unknown"}`;
    } else if (
      sender === "ai" ||
      messageData.isAI === true ||
      messageData.senderName === "Miryam"
    ) {
      sender = "ai";
      senderName = "Miryam";
      isAI = true;
    } else {
      sender = "admin";
      senderName = messageData.senderName || "Admin";
      isAdmin = true;
    }

    return {
      id: messageData.id || `temp_${Date.now()}`,
      content: messageData.content || messageData.message || "",
      sender: sender,
      senderName: senderName,
      timestamp: this.parseTimestamp(messageData.timestamp),
      phoneNumber: phoneNumber,
      status:
        messageData.status || (sender === "customer" ? "received" : "sent"),
      type: messageData.type || messageData.messageType || "text",
      profileName: senderName,
      isAI: isAI,
      isAdmin: isAdmin,
    };
  }

  /**
   * Parse timestamp from various formats
   */
  static parseTimestamp(timestamp) {
    if (typeof timestamp === "string") {
      return new Date(timestamp);
    } else if (timestamp && timestamp._seconds) {
      return new Date(
        timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
      );
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else {
      return new Date();
    }
  }

  /**
   * Check if message already exists in conversation
   */
  static messageExists(messages, messageId) {
    return messages.some((msg) => msg.id === messageId);
  }

  /**
   * Add message to conversation and sort by timestamp
   */
  static addMessageToConversation(existingMessages, newMessage) {
    if (this.messageExists(existingMessages, newMessage.id)) {
      return existingMessages; // Message already exists
    }

    const updatedMessages = [...existingMessages, newMessage].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return updatedMessages;
  }

  /**
   * Update message status in conversation
   */
  static updateMessageStatus(messages, messageId, status) {
    return messages.map((msg) => {
      if (msg.id === messageId) {
        return { ...msg, status };
      }
      return msg;
    });
  }

  /**
   * Process incoming message for immediate display
   */
  static processIncomingMessage(
    messageData,
    setConversations,
    setChatMessages,
    activeConversationRef,
    setUnreadCounts
  ) {
    console.log("📥 Processing incoming message:", messageData);

    const phoneNumber = this.normalizePhoneNumber(messageData.from);
    if (!phoneNumber) return;

    const immediateMessage = this.createMessageObject(messageData, "customer");

    setConversations((prev) => {
      const newConversations = new Map(prev);
      const existingMessages = newConversations.get(phoneNumber) || [];
      const updatedMessages = this.addMessageToConversation(
        existingMessages,
        immediateMessage
      );

      if (updatedMessages !== existingMessages) {
        newConversations.set(phoneNumber, updatedMessages);

        // Update active conversation immediately
        if (activeConversationRef.current === phoneNumber) {
          setChatMessages([...updatedMessages]);
          console.log("⚡ Instantly displayed incoming message");
        }

        // Update unread count if not active conversation
        if (activeConversationRef.current !== phoneNumber) {
          setUnreadCounts((prev) => {
            const newCounts = new Map(prev);
            const currentCount = newCounts.get(phoneNumber) || 0;
            newCounts.set(phoneNumber, currentCount + 1);
            return newCounts;
          });
        }
      }

      return newConversations;
    });
  }

  /**
   * Process AI reply for immediate display
   */
  static processAIReply(
    messageData,
    setConversations,
    setChatMessages,
    activeConversationRef,
    setAiTyping
  ) {
    console.log("🤖 Processing AI reply:", messageData);

    const phoneNumber = this.normalizePhoneNumber(messageData.to);
    if (!phoneNumber) return;

    // Stop typing indicator
    setAiTyping((prev) => {
      const newTyping = new Map(prev);
      newTyping.set(phoneNumber, false);
      return newTyping;
    });

    const immediateMessage = this.createMessageObject(messageData, "ai");

    setConversations((prev) => {
      const newConversations = new Map(prev);
      const existingMessages = newConversations.get(phoneNumber) || [];
      const updatedMessages = this.addMessageToConversation(
        existingMessages,
        immediateMessage
      );

      if (updatedMessages !== existingMessages) {
        newConversations.set(phoneNumber, updatedMessages);

        // Update active conversation immediately
        if (activeConversationRef.current === phoneNumber) {
          setChatMessages([...updatedMessages]);
          console.log("⚡ Instantly displayed AI reply");
        }
      }

      return newConversations;
    });
  }

  /**
   * Handle AI typing status
   */
  static handleAITyping(typingData, setAiTyping) {
    console.log("💭 Handling AI typing status:", typingData);

    const phoneNumber = this.normalizePhoneNumber(typingData.phoneNumber);
    if (!phoneNumber) return;

    setAiTyping((prev) => {
      const newTyping = new Map(prev);
      newTyping.set(phoneNumber, typingData.isTyping);
      return newTyping;
    });

    console.log(
      `💭 AI typing for ${phoneNumber}: ${
        typingData.isTyping ? "started" : "stopped"
      }`
    );
  }

  /**
   * Handle message status updates
   */
  static handleMessageStatusUpdate(
    messageId,
    status,
    setConversations,
    setChatMessages,
    activeConversationRef
  ) {
    console.log(`📝 Updating message ${messageId} status to: ${status}`);

    setConversations((prev) => {
      const newConversations = new Map(prev);

      for (const [phoneNumber, messages] of newConversations.entries()) {
        const updatedMessages = this.updateMessageStatus(
          messages,
          messageId,
          status
        );

        if (updatedMessages !== messages) {
          newConversations.set(phoneNumber, updatedMessages);

          // Update active conversation immediately
          if (activeConversationRef.current === phoneNumber) {
            setChatMessages([...updatedMessages]);
            console.log(
              "✨ Real-time update: Updated message status in active conversation"
            );
          }
          break;
        }
      }

      return newConversations;
    });
  }

  /**
   * Process admin message for immediate display (manual sent messages)
   */
  static processAdminMessage(
    messageData,
    setConversations,
    setChatMessages,
    activeConversationRef
  ) {
    console.log("👤 Processing admin message from SSE:", messageData);

    const phoneNumber = this.normalizePhoneNumber(messageData.to);
    if (!phoneNumber) return;

    const sseMessage = this.createMessageObject(messageData, "admin");

    setConversations((prev) => {
      const newConversations = new Map(prev);
      const existingMessages = newConversations.get(phoneNumber) || [];

      // Check if we have an optimistic message with the same content to replace
      const optimisticIndex = existingMessages.findIndex(
        (msg) =>
          msg.sender === "admin" &&
          msg.content === sseMessage.content &&
          msg.status === "sending" &&
          msg.id.startsWith("temp_")
      );

      let updatedMessages;
      if (optimisticIndex >= 0) {
        // Replace the optimistic message with the real one from SSE
        updatedMessages = [...existingMessages];
        updatedMessages[optimisticIndex] = {
          ...sseMessage,
          status: "sent",
        };
        console.log("✨ Replaced optimistic message with SSE message");
      } else {
        // Add as new message if no optimistic match found
        updatedMessages = this.addMessageToConversation(
          existingMessages,
          sseMessage
        );
      }

      if (updatedMessages !== existingMessages) {
        newConversations.set(phoneNumber, updatedMessages);

        // Update active conversation immediately
        if (activeConversationRef.current === phoneNumber) {
          setChatMessages([...updatedMessages]);
          console.log(
            "✨ Real-time update: Updated admin message in active conversation"
          );
        }
      }

      return newConversations;
    });
  }

  /**
   * Process new message from SSE (backward compatibility)
   */
  static processNewMessage(
    message,
    setConversations,
    setChatMessages,
    activeConversationRef,
    setUnreadCounts
  ) {
    const phoneNumber = this.normalizePhoneNumber(message.phoneNumber);
    if (!phoneNumber) return;

    const newMessage = this.createMessageObject(message);

    setConversations((prev) => {
      const newConversations = new Map(prev);
      const existingMessages = newConversations.get(phoneNumber) || [];
      const updatedMessages = this.addMessageToConversation(
        existingMessages,
        newMessage
      );

      if (updatedMessages !== existingMessages) {
        newConversations.set(phoneNumber, updatedMessages);

        // Update active conversation immediately
        if (activeConversationRef.current === phoneNumber) {
          setChatMessages([...updatedMessages]);
          console.log(
            "✨ Real-time update: Added message to active conversation"
          );
        }

        // Update unread count if not active conversation and incoming message
        if (
          activeConversationRef.current !== phoneNumber &&
          message.direction === "incoming"
        ) {
          setUnreadCounts((prev) => {
            const newCounts = new Map(prev);
            const currentCount = newCounts.get(phoneNumber) || 0;
            newCounts.set(phoneNumber, currentCount + 1);
            return newCounts;
          });
        }
      }

      return newConversations;
    });
  }
}

export default ChatMessageHandler;
