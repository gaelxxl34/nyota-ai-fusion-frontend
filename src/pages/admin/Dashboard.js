import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  Skeleton,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AccountBalance as AccountBalanceIcon,
  GroupAdd as GroupAddIcon,
  Forum as ForumIcon,
  EmojiEvents as EmojiEventsIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Chat as ChatIcon,
  School as SchoolIcon,
  WhatsApp as WhatsAppIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, getUserRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // State for different dashboard sections
  const [platformStats, setPlatformStats] = useState({
    totalOrganizations: 0,
    activeUsers: 0,
    totalLeads: 0,
    activeSessions: 0,
    conversionRate: 0,
    systemUptime: 99.9,
  });

  const [organizationMetrics, setOrganizationMetrics] = useState([]);
  const [leadFunnel, setLeadFunnel] = useState({
    inquiry: 0,
    qualified: 0,
    applied: 0,
    admitted: 0,
    enrolled: 0,
  });

  const [systemPerformance, setSystemPerformance] = useState({
    apiResponseTime: 0,
    whatsappDeliveryRate: 0,
    errorRate: 0,
    activeWebhooks: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [userStats, setUserStats] = useState({
    systemAdmins: 0,
    organizationAdmins: 0,
    marketingAgents: 0,
    admissionsAgents: 0,
    recentLogins: 0,
  });

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");

      // Check if user has a valid token
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // Check user role
      const userRole = getUserRole();
      console.log("Current user role:", userRole);
      console.log("User object:", user);

      if (userRole !== "systemAdmin") {
        setError(
          `Access denied. This dashboard requires System Admin role. Your role: ${userRole}`
        );
        setLoading(false);
        return;
      }

      // Log for debugging
      console.log("Fetching dashboard data...");

      // Fetch all data in parallel for better performance
      const [
        platformStatsData,
        organizationMetricsData,
        leadAnalyticsData,
        systemPerformanceData,
        recentActivitiesData,
        userStatsData,
      ] = await Promise.all([
        superAdminService.getSystemStats().catch((err) => {
          console.error("Platform stats error:", err);
          return null;
        }),
        superAdminService.getAllUsers().catch((err) => {
          console.error("Organization metrics error:", err);
          return [];
        }),
        superAdminService.getSystemStats().catch((err) => {
          console.error("Lead analytics error:", err);
          return null;
        }),
        superAdminService.getSystemStats().catch((err) => {
          console.error("System performance error:", err);
          return null;
        }),
        superAdminService.getSystemStats().catch((err) => {
          console.error("Recent activities error:", err);
          return [];
        }),
        superAdminService.getAllUsers().catch((err) => {
          console.error("User statistics error:", err);
          return null;
        }),
      ]);

      // Only update state if we got some data
      if (platformStatsData) setPlatformStats(platformStatsData);
      if (organizationMetricsData)
        setOrganizationMetrics(organizationMetricsData);
      if (leadAnalyticsData) setLeadFunnel(leadAnalyticsData);
      if (systemPerformanceData) setSystemPerformance(systemPerformanceData);
      if (recentActivitiesData) setRecentActivities(recentActivitiesData);
      if (userStatsData) setUserStats(userStatsData);

      // If all requests failed, show error
      if (
        !platformStatsData &&
        !organizationMetricsData &&
        !leadAnalyticsData
      ) {
        setError(
          "Failed to load dashboard data. Please check your permissions and try again."
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data.";
      setError(errorMessage);
      console.error("Dashboard error:", err);

      // Set some default values to prevent UI breaking
      setPlatformStats({
        totalOrganizations: 0,
        activeUsers: 0,
        totalLeads: 0,
        activeSessions: 0,
        conversionRate: 0,
        systemUptime: 0,
      });
      setOrganizationMetrics([]);
      setLeadFunnel({
        inquiry: 0,
        qualified: 0,
        applied: 0,
        admitted: 0,
        enrolled: 0,
      });
      setSystemPerformance({
        apiResponseTime: 0,
        whatsappDeliveryRate: 0,
        errorRate: 0,
        activeWebhooks: 0,
      });
      setRecentActivities([]);
      setUserStats({
        systemAdmins: 0,
        organizationAdmins: 0,
        marketingAgents: 0,
        admissionsAgents: 0,
        recentLogins: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, getUserRole]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchDashboardData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Helper functions
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "organization":
        return <BusinessIcon />;
      case "lead":
        return <SchoolIcon />;
      case "user":
        return <PersonAddIcon />;
      case "system":
        return <SettingsIcon />;
      case "error":
        return <ErrorIcon />;
      default:
        return <ForumIcon />;
    }
  };

  const getActivityColor = (severity) => {
    switch (severity) {
      case "success":
        return theme.palette.success.main;
      case "warning":
        return theme.palette.warning.main;
      case "error":
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Platform statistics cards
  const stats = [
    {
      title: "Total Organizations",
      value: formatNumber(platformStats.totalOrganizations),
      icon: <AccountBalanceIcon />,
      gradient: "linear-gradient(45deg, #1a237e 30%, #3949ab 90%)",
      subtitle: "Active subscriptions",
    },
    {
      title: "Active Users",
      value: formatNumber(platformStats.activeUsers),
      icon: <GroupAddIcon />,
      gradient: "linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)",
      subtitle: "Across all organizations",
    },
    {
      title: "Total Leads",
      value: formatNumber(platformStats.totalLeads),
      icon: <SchoolIcon />,
      gradient: "linear-gradient(45deg, #2962ff 30%, #448aff 90%)",
      subtitle: "Platform-wide",
    },
    {
      title: "Conversion Rate",
      value: `${platformStats.conversionRate}%`,
      icon: <TrendingUpIcon />,
      gradient: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
      subtitle: "Inquiry to enrolled",
    },
  ];

  return (
    <Box>
      {/* Header with title and actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            System Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform-wide overview and management
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {refreshing && !loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Platform Statistics Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            {loading ? (
              <Paper elevation={2} sx={{ p: 3, height: 160 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={48}
                  sx={{ mt: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height={16}
                  sx={{ mt: 1 }}
                />
              </Paper>
            ) : (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  height: 160,
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    zIndex: 1,
                    mt: 1,
                  }}
                >
                  {stat.subtitle}
                </Typography>
              </Paper>
            )}
          </Grid>
        ))}

        {/* Lead Conversion Pipeline - Modern Professional Style */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: "linear-gradient(to bottom, #fafafa, #ffffff)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Lead Conversion Pipeline
              </Typography>
              <Chip
                label="Real-time Data"
                size="small"
                sx={{
                  bgcolor: "#e8f5e9",
                  color: "#2e7d32",
                  fontWeight: "medium",
                }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={300} />
            ) : (
              <>
                {/* Modern Pipeline Visualization */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 4,
                    px: 2,
                    overflowX: "auto",
                  }}
                >
                  {Object.entries(leadFunnel).map(([stage, count], index) => {
                    const stages = Object.keys(leadFunnel);
                    const maxCount = leadFunnel.inquiry || 1;
                    const percentage = ((count / maxCount) * 100).toFixed(1);
                    const previousStage =
                      index > 0 ? leadFunnel[stages[index - 1]] : count;
                    const dropOff = index > 0 ? previousStage - count : 0;
                    const dropOffPercentage =
                      previousStage > 0
                        ? ((dropOff / previousStage) * 100).toFixed(1)
                        : "0";

                    const stageConfig = {
                      inquiry: {
                        color: "#1e40af",
                        icon: <ForumIcon />,
                        label: "Inquiries",
                        sublabel: "Initial Interest",
                      },
                      qualified: {
                        color: "#7c3aed",
                        icon: <EmojiEventsIcon />,
                        label: "Qualified",
                        sublabel: "Met Criteria",
                      },
                      applied: {
                        color: "#0891b2",
                        icon: <AssignmentIcon />,
                        label: "Applied",
                        sublabel: "Submitted Form",
                      },
                      admitted: {
                        color: "#059669",
                        icon: <CheckCircleIcon />,
                        label: "Admitted",
                        sublabel: "Approved",
                      },
                      enrolled: {
                        color: "#dc2626",
                        icon: <SchoolIcon />,
                        label: "Enrolled",
                        sublabel: "Confirmed",
                      },
                    };

                    const config = stageConfig[stage];
                    const isActive = count > 0;

                    return (
                      <Box
                        key={stage}
                        sx={{ display: "flex", alignItems: "center", flex: 1 }}
                      >
                        {/* Stage Card */}
                        <Box sx={{ position: "relative" }}>
                          <Paper
                            elevation={isActive ? 3 : 0}
                            sx={{
                              p: 2.5,
                              minWidth: 160,
                              textAlign: "center",
                              bgcolor: isActive ? "white" : "#f3f4f6",
                              border: isActive
                                ? `2px solid ${config.color}`
                                : "2px solid #e5e7eb",
                              borderRadius: 3,
                              position: "relative",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              "&:hover": isActive
                                ? {
                                    transform: "translateY(-4px)",
                                    boxShadow: `0 8px 24px ${config.color}20`,
                                  }
                                : {},
                            }}
                          >
                            {/* Icon */}
                            <Avatar
                              sx={{
                                bgcolor: isActive
                                  ? `${config.color}15`
                                  : "#f3f4f6",
                                color: isActive ? config.color : "#9ca3af",
                                width: 48,
                                height: 48,
                                mx: "auto",
                                mb: 1.5,
                              }}
                            >
                              {React.cloneElement(config.icon, {
                                fontSize: "medium",
                              })}
                            </Avatar>

                            {/* Stage Name */}
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ color: isActive ? "#111827" : "#6b7280" }}
                            >
                              {config.label}
                            </Typography>

                            {/* Sublabel */}
                            <Typography
                              variant="caption"
                              sx={{
                                color: isActive ? "#6b7280" : "#9ca3af",
                                display: "block",
                                mb: 1,
                              }}
                            >
                              {config.sublabel}
                            </Typography>

                            {/* Count */}
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              sx={{
                                color: isActive ? config.color : "#9ca3af",
                                mb: 0.5,
                              }}
                            >
                              {formatNumber(count)}
                            </Typography>

                            {/* Percentage */}
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280" }}
                            >
                              {percentage}% of total
                            </Typography>

                            {/* Drop-off indicator */}
                            {index > 0 && dropOff > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -12,
                                  right: -12,
                                  bgcolor: "#fee2e2",
                                  color: "#dc2626",
                                  borderRadius: "12px",
                                  px: 1,
                                  py: 0.5,
                                  fontSize: "0.75rem",
                                  fontWeight: "medium",
                                  border: "1px solid #fecaca",
                                }}
                              >
                                -{dropOffPercentage}%
                              </Box>
                            )}
                          </Paper>
                        </Box>

                        {/* Connector Arrow */}
                        {index < stages.length - 1 && (
                          <Box
                            sx={{
                              flex: "0 0 60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Box sx={{ position: "relative", width: "100%" }}>
                              <Box
                                sx={{
                                  height: 2,
                                  bgcolor:
                                    count > 0 &&
                                    leadFunnel[stages[index + 1]] > 0
                                      ? "#e5e7eb"
                                      : "#f3f4f6",
                                  width: "100%",
                                }}
                              />
                              <ArrowForwardIcon
                                sx={{
                                  position: "absolute",
                                  right: -12,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color:
                                    count > 0 &&
                                    leadFunnel[stages[index + 1]] > 0
                                      ? "#9ca3af"
                                      : "#e5e7eb",
                                  fontSize: 24,
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {/* Conversion Insights */}
                <Grid container spacing={2}>
                  {/* Conversion Rate Card */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ opacity: 0.9, mb: 1 }}
                          >
                            Overall Conversion
                          </Typography>
                          <Typography variant="h3" fontWeight="bold">
                            {leadFunnel.inquiry > 0
                              ? (
                                  (leadFunnel.enrolled / leadFunnel.inquiry) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            From inquiry to enrollment
                          </Typography>
                        </Box>
                        <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Application Success */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        background:
                          "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        color: "white",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ opacity: 0.9, mb: 1 }}
                          >
                            Application Rate
                          </Typography>
                          <Typography variant="h3" fontWeight="bold">
                            {leadFunnel.inquiry > 0
                              ? (
                                  (leadFunnel.applied / leadFunnel.inquiry) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Inquiries that applied
                          </Typography>
                        </Box>
                        <AssignmentIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Lost Leads */}
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        bgcolor: "#fef3c7",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ color: "#92400e", mb: 1 }}
                          >
                            Unconverted Leads
                          </Typography>
                          <Typography
                            variant="h3"
                            fontWeight="bold"
                            color="#d97706"
                          >
                            {formatNumber(
                              leadFunnel.inquiry -
                                leadFunnel.applied -
                                leadFunnel.qualified
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#92400e" }}
                          >
                            Need follow-up action
                          </Typography>
                        </Box>
                        <WarningIcon
                          sx={{ fontSize: 40, color: "#f59e0b", opacity: 0.3 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        {/* Organization Performance Table */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Top Organizations by Performance
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/admin/organizations")}
              >
                View All
              </Button>
            </Box>
            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={300} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Organization</TableCell>
                      <TableCell align="center">Users</TableCell>
                      <TableCell align="center">Leads</TableCell>
                      <TableCell align="center">Conversion</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizationMetrics.map((org, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{org.name}</TableCell>
                        <TableCell align="center">{org.users}</TableCell>
                        <TableCell align="center">
                          {formatNumber(org.leads)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${org.conversion}%`}
                            size="small"
                            color={org.conversion > 13 ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={org.status}
                            size="small"
                            color={
                              org.status === "active" ? "success" : "warning"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* System Performance Metrics */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>
            {loading ? (
              <Box>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    variant="text"
                    width="100%"
                    height={40}
                    sx={{ mb: 2 }}
                  />
                ))}
              </Box>
            ) : (
              <Box>
                {/* API Response Time */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      API Response Time
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {systemPerformance.apiResponseTime}ms
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      100 - (systemPerformance.apiResponseTime / 500) * 100
                    }
                    color={
                      systemPerformance.apiResponseTime < 200
                        ? "success"
                        : "warning"
                    }
                  />
                </Box>

                {/* WhatsApp Delivery Rate */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      WhatsApp Delivery Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {systemPerformance.whatsappDeliveryRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemPerformance.whatsappDeliveryRate}
                    color="success"
                  />
                </Box>

                {/* Error Rate */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {systemPerformance.errorRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemPerformance.errorRate * 10}
                    color="error"
                  />
                </Box>

                {/* System Uptime */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2">System Uptime</Typography>
                  </Box>
                  <Typography variant="h6" color="success.main">
                    {platformStats.systemUptime}%
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* User Statistics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Distribution
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" width="100%" height={200} />
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="primary">
                        {userStats.systemAdmins}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        System Admins
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="primary">
                        {userStats.organizationAdmins}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Org Admins
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="primary">
                        {userStats.marketingAgents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Marketing Agents
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="primary">
                        {userStats.admissionsAgents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Admissions Agents
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box
                  sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}
                >
                  <Typography variant="body2" align="center">
                    <strong>{userStats.recentLogins}</strong> users logged in
                    today
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Recent Platform Activities
            </Typography>
            {loading ? (
              <Box>
                {[...Array(5)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", mb: 2 }}
                  >
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="text" width="50%" height={16} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box>
                {recentActivities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: "background.default",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getActivityColor(activity.severity),
                        mr: 2,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{activity.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Administration
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  title: "Add Organization",
                  icon: <BusinessIcon />,
                  color: "primary",
                  path: "/admin/organizations",
                  description: "Create and manage organizations",
                },
                {
                  title: "User Management",
                  icon: <GroupIcon />,
                  color: "info",
                  path: "/admin/users",
                  description: "Manage system administrators",
                },
                {
                  title: "System Logs",
                  icon: <AnalyticsIcon />,
                  color: "warning",
                  path: "/admin/logs",
                  description: "View system logs and events",
                },
                {
                  title: "Platform Settings",
                  icon: <SettingsIcon />,
                  color: "secondary",
                  path: "/admin/settings",
                  description: "Configure platform settings",
                },
                {
                  title: "Broadcast Message",
                  icon: <CampaignIcon />,
                  color: "success",
                  path: "/admin/broadcast",
                  description: "Send announcements",
                },
                {
                  title: "API Management",
                  icon: <SpeedIcon />,
                  color: "error",
                  path: "/admin/api",
                  description: "Monitor API usage",
                },
              ].map((action, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      height: "100%",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                        transition: "all 0.3s",
                      },
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{ bgcolor: `${action.color}.light`, mr: 2 }}
                        >
                          {React.cloneElement(action.icon, {
                            color: action.color,
                          })}
                        </Avatar>
                        <Typography variant="h6">{action.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
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

export default AdminDashboard;
