import React from "react";
import { useTheme } from "@mui/material/styles"; // Added missing import
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  GroupAdd as GroupAddIcon,
  Forum as ForumIcon,
  EmojiEvents as EmojiEventsIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  SupervisedUserCircle as UserIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const Dashboard = () => {
  const theme = useTheme();

  const stats = [
    {
      title: "Total Organizations",
      value: "24",
      icon: <AccountBalanceIcon />,
      color: theme.palette.primary.main,
      gradient: "linear-gradient(45deg, #1a237e 30%, #3949ab 90%)",
    },
    {
      title: "Active Users",
      value: "1,234",
      icon: <GroupAddIcon />,
      color: "#0d47a1",
      gradient: "linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)",
    },
    {
      title: "Chat Sessions",
      value: "892",
      icon: <ForumIcon />,
      color: "#2962ff",
      gradient: "linear-gradient(45deg, #2962ff 30%, #448aff 90%)",
    },
    {
      title: "Success Rate",
      value: "95%",
      icon: <EmojiEventsIcon />,
      color: "#2e7d32",
      gradient: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
    },
  ];

  const recentActivities = [
    {
      type: "user",
      text: "New organization registered: Tech Solutions Inc",
      time: "2 minutes ago",
    },
    {
      type: "chat",
      text: "Support session completed with high satisfaction",
      time: "15 minutes ago",
    },
    {
      type: "user",
      text: "User account verified: Sarah Johnson",
      time: "1 hour ago",
    },
    {
      type: "system",
      text: "System update completed successfully",
      time: "2 hours ago",
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                height: 140,
                position: "relative",
                overflow: "hidden",
                background: stat.gradient,
                "&:hover": {
                  transform: "translateY(-4px)",
                  transition: "transform 0.3s ease-in-out",
                  boxShadow: (theme) => theme.shadows[8],
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  right: -10,
                  top: -10,
                  opacity: 0.2,
                  transform: "rotate(-10deg)",
                }}
              >
                {React.cloneElement(stat.icon, {
                  sx: {
                    fontSize: 120,
                    color: "white",
                  },
                })}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: 500,
                  zIndex: 1,
                }}
                gutterBottom
              >
                {stat.title}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  zIndex: 1,
                }}
              >
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">Recent Activities</Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <List>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {activity.type === "user" ? (
                          <UserIcon />
                        ) : activity.type === "chat" ? (
                          <MessageIcon />
                        ) : (
                          <ScheduleIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.text}
                      secondary={activity.time}
                    />
                  </ListItem>
                  {index < recentActivities.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  title: "Add Organization",
                  icon: <BusinessIcon />,
                  path: "/organizations/new",
                },
                { title: "Manage Users", icon: <GroupIcon />, path: "/users" },
                {
                  title: "View Reports",
                  icon: <TrendingUpIcon />,
                  path: "/reports",
                },
                {
                  title: "Chat History",
                  icon: <ChatIcon />,
                  path: "/chat/history",
                },
              ].map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "action.hover",
                        transform: "translateY(-2px)",
                        transition: "all 0.3s",
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ textAlign: "center" }}>
                        {React.cloneElement(action.icon, {
                          sx: { fontSize: 40, mb: 1, color: "primary.main" },
                        })}
                        <Typography variant="subtitle2">
                          {action.title}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
