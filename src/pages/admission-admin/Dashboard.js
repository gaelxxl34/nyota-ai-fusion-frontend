import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  School as SchoolIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

const AdmissionAdminDashboard = () => {
  const { user, getUserRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    // Verify user has admission admin role
    const userRole = getUserRole();
    if (userRole !== "admissionAdmin") {
      console.error(
        `Access denied. This dashboard requires Admission Admin role. Your role: ${userRole}`
      );
      return;
    }

    // Initialize dashboard data
    const initializeDashboard = async () => {
      try {
        // TODO: Fetch actual statistics from your API
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

        setStats({
          totalApplications: 124,
          pendingApplications: 18,
          approvedApplications: 89,
          conversionRate: 72,
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [getUserRole]);

  if (getUserRole() !== "admissionAdmin") {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. This dashboard requires Admission Admin role. Your
          role: {getUserRole()}
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: "50%",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, {
              sx: { color: `${color}.main`, fontSize: 32 },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admission Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome back, {user?.name || user?.email || "Admission Admin"}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon={<SchoolIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={stats.pendingApplications}
            icon={<AssessmentIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approvedApplications}
            icon={<PeopleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={<TrendingUpIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={300}
            >
              <Typography variant="body1" color="textSecondary">
                Activity feed will be implemented here
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={300}
            >
              <Typography variant="body1" color="textSecondary">
                Quick action buttons will be added here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdmissionAdminDashboard;
