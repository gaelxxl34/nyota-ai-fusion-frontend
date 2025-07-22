import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import {
  People as PeopleIcon,
  Chat as ChatIcon,
  TrendingUp as LeadsIcon,
  CheckCircle as ConversionIcon,
} from "@mui/icons-material";
import { organizationAdminService } from "../../services/organizationAdminService";

const OrganizationDashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeChats: 0,
    conversionRate: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await organizationAdminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: <LeadsIcon />,
      color: "#2196f3",
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      icon: <PeopleIcon />,
      color: "#4caf50",
    },
    {
      title: "Active Chats",
      value: stats.activeChats,
      icon: <ChatIcon />,
      color: "#ff9800",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: <ConversionIcon />,
      color: "#f44336",
    },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Organization Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {/* Add activity list or charts here */}
      </Paper>
    </Box>
  );
};

export default OrganizationDashboard;
