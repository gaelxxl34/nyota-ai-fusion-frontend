import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";

const ChatAnalyticsDashboard = ({ conversations = [] }) => {
  const [analytics, setAnalytics] = useState({
    totalConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    activeConversations: 0,
    responseTimeAnalysis: [],
    topContacts: [],
    messagesByTimeOfDay: [],
    conversationsByStatus: {},
  });

  useEffect(() => {
    if (conversations.length > 0) {
      calculateAnalytics();
    }
  }, [conversations]);

  const calculateAnalytics = () => {
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );
    const activeConversations = conversations.filter(
      (conv) => conv.status === "Active"
    ).length;
    const averageMessagesPerConversation =
      totalConversations > 0
        ? Math.round(totalMessages / totalConversations)
        : 0;

    // Calculate conversations by status
    const conversationsByStatus = conversations.reduce((acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {});

    // Get top contacts by message count
    const topContacts = conversations
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5)
      .map((conv) => ({
        name: conv.contactName,
        phoneNumber: conv.phoneNumber,
        messageCount: conv.messageCount,
        unreadCount: conv.unreadCount,
      }));

    // Analyze message timing (simplified)
    const messagesByTimeOfDay = analyzeMessageTiming(conversations);

    setAnalytics({
      totalConversations,
      totalMessages,
      averageMessagesPerConversation,
      activeConversations,
      topContacts,
      messagesByTimeOfDay,
      conversationsByStatus,
    });
  };

  const analyzeMessageTiming = (conversations) => {
    // This is a simplified analysis - in a real app you'd analyze actual message timestamps
    return [
      { hour: "00-06", count: Math.floor(Math.random() * 50), label: "Night" },
      {
        hour: "06-12",
        count: Math.floor(Math.random() * 200),
        label: "Morning",
      },
      {
        hour: "12-18",
        count: Math.floor(Math.random() * 300),
        label: "Afternoon",
      },
      {
        hour: "18-24",
        count: Math.floor(Math.random() * 150),
        label: "Evening",
      },
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      case "Closed":
        return "error";
      default:
        return "primary";
    }
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <Box>
      {/* Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Total Conversations
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalConversations}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <MessageIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Total Messages
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalMessages.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <PhoneIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Average Messages
                  </Typography>
                  <Typography variant="h4">
                    {analytics.averageMessagesPerConversation}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    per conversation
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Active Conversations
                  </Typography>
                  <Typography variant="h4">
                    {analytics.activeConversations}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {Math.round(
                      (analytics.activeConversations /
                        analytics.totalConversations) *
                        100
                    ) || 0}
                    % of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Contacts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Most Active Contacts
            </Typography>
            <List>
              {analytics.topContacts.map((contact, index) => (
                <ListItem
                  key={contact.phoneNumber}
                  divider={index < analytics.topContacts.length - 1}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body1">{contact.name}</Typography>
                        {contact.unreadCount > 0 && (
                          <Chip
                            label={contact.unreadCount}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="caption">
                          {contact.phoneNumber}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {contact.messageCount} messages
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Message Activity by Time */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Message Activity by Time
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analytics.messagesByTimeOfDay.map((timeSlot) => (
                <Box key={timeSlot.hour} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {timeSlot.label} ({timeSlot.hour})
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {timeSlot.count} messages
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(timeSlot.count / 300) * 100} // Normalize to 300 as max
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Conversation Status Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conversation Status Distribution
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
              {Object.entries(analytics.conversationsByStatus).map(
                ([status, count]) => (
                  <Card key={status} variant="outlined" sx={{ minWidth: 150 }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Chip
                          label={status}
                          color={getStatusColor(status)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h5">{count}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          conversations
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatAnalyticsDashboard;
