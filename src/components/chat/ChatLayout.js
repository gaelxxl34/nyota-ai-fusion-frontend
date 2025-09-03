import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from "@mui/material";
import { Search as SearchIcon, Menu as MenuIcon } from "@mui/icons-material";
import ConversationList from "./ConversationList";
import ChatInterface from "./ChatInterface";

const ChatLayout = ({
  conversations,
  activeConversation,
  chatMessages,
  unreadCounts,
  autoReplySettings,
  message,
  setMessage,
  loading,
  searchTerm,
  setSearchTerm,
  onConversationSelect,
  onConversationClear,
  onConversationDelete,
  onAutoReplyToggle,
  onSendMessage,
  onKeyPress,
  onInputChange,
  getConversationsList,
  getProfileName,
  aiTyping,
  userTyping,
  conversationsLoading = false,
  messagesLoading = false,
  onRefresh,
  onStartConversation,
  hasMoreConversations = false,
  loadingMoreConversations = false,
  onLoadMore,
  onTemplateMessageSent, // New prop for template message handling
  currentUser, // Current user information
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Simple search handling without debouncing
  const handleSearchChange = (event) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
  };

  // Memoized conversations list to prevent unnecessary recalculations
  const conversationsList = useMemo(() => {
    return getConversationsList();
  }, [getConversationsList]);

  const handleConversationSelect = (phoneNumber) => {
    onConversationSelect(phoneNumber);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    }
  };

  const conversationListContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm || ""}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Conversation List */}
      <Box sx={{ flex: 1, overflow: "auto", height: 0 }}>
        <ConversationList
          conversations={conversationsList}
          activeConversation={activeConversation}
          unreadCounts={unreadCounts}
          autoReplySettings={autoReplySettings}
          onConversationSelect={handleConversationSelect}
          onConversationClear={onConversationClear}
          onConversationDelete={onConversationDelete}
          onAutoReplyToggle={onAutoReplyToggle}
          getProfileName={getProfileName}
          searchTerm={searchTerm}
          loading={conversationsLoading}
          onRefresh={onRefresh}
          hasMoreConversations={hasMoreConversations}
          loadingMoreConversations={loadingMoreConversations}
          onLoadMore={onLoadMore}
        />
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Mobile Header */}
        {activeConversation && (
          <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
            <IconButton onClick={() => setMobileDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileDrawerOpen || !activeConversation}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: "85vw",
              maxWidth: 400,
            },
          }}
        >
          {conversationListContent}
        </Drawer>

        {/* Chat Interface */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <ChatInterface
            activeConversation={activeConversation}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            loading={loading}
            onSendMessage={onSendMessage}
            onKeyPress={onKeyPress}
            onInputChange={onInputChange}
            onBack={handleBackToList}
            getProfileName={getProfileName}
            aiTyping={aiTyping}
            userTyping={userTyping}
            messagesLoading={messagesLoading}
            onStartConversation={onStartConversation}
            onTemplateMessageSent={onTemplateMessageSent}
            currentUser={currentUser}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        overflow: "hidden",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      {/* Desktop Conversation List */}
      <Box
        sx={{
          width: 350,
          minWidth: 320,
          maxWidth: 400,
          height: "100%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {conversationListContent}
      </Box>

      {/* Desktop Chat Interface */}
      <Box
        sx={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          minWidth: 0, // Important: allows flex item to shrink below content size
          bgcolor: "background.paper",
        }}
      >
        <ChatInterface
          activeConversation={activeConversation}
          chatMessages={chatMessages}
          message={message}
          setMessage={setMessage}
          loading={loading}
          onSendMessage={onSendMessage}
          onKeyPress={onKeyPress}
          onInputChange={onInputChange}
          onBack={() => {}} // No back button on desktop
          getProfileName={getProfileName}
          aiTyping={aiTyping}
          userTyping={userTyping}
          messagesLoading={messagesLoading}
          onStartConversation={onStartConversation}
          onTemplateMessageSent={onTemplateMessageSent}
          currentUser={currentUser}
        />
      </Box>
    </Box>
  );
};

export default ChatLayout;
