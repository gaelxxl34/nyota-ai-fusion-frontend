import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
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
} from "@mui/material";
import {
  GroupAdd as GroupAddIcon,
  Forum as ForumIcon,
  EmojiEvents as EmojiEventsIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Chat as ChatIcon,
  School as SchoolIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  PersonAdd as PersonAddIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, getUserRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // State for different dashboard sections
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalLeads: 0,
    totalApplications: 0,
    activeUsers: 0,
    conversionRates: {},
    systemHealth: "operational",
  });

  const [roleMetrics, setRoleMetrics] = useState([]);
  const [leadFunnel, setLeadFunnel] = useState({
    new_contact: 0,
    interested: 0,
    qualified: 0,
    applied: 0,
    admitted: 0,
    enrolled: 0,
  });

  const [conversationStats, setConversationStats] = useState({
    total: 0,
    byStatus: {},
    recentActivity: 0,
  });

  // eslint-disable-next-line no-unused-vars
  const [systemPerformance, setSystemPerformance] = useState({
    uptime: "99.9%",
    responseTime: "< 200ms",
    errorRate: "< 0.1%",
    activeConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });

  // eslint-disable-next-line no-unused-vars
  const [userAnalytics, setUserAnalytics] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [leadAnalytics, setLeadAnalytics] = useState({});

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

      if (userRole !== "superAdmin") {
        setError(
          `Access denied. This dashboard requires Super Admin role. Your role: ${userRole}`
        );
        setLoading(false);
        return;
      }

      // Log for debugging
      console.log("Fetching dashboard data...");

      // Fetch all data in parallel for better performance
      const [
        systemStatsData,
        userAnalyticsData,
        leadAnalyticsData,
        performanceData,
        allUsersData,
        conversationStatsData,
      ] = await Promise.all([
        superAdminService.getSystemStats().catch((err) => {
          console.error("System stats error:", err);
          return null;
        }),
        superAdminService.getUserAnalytics().catch((err) => {
          console.error("User analytics error:", err);
          return null;
        }),
        superAdminService.getLeadAnalytics().catch((err) => {
          console.error("Lead analytics error:", err);
          return null;
        }),
        superAdminService.getPerformanceMetrics().catch((err) => {
          console.error("Performance metrics error:", err);
          return null;
        }),
        superAdminService.getAllUsers().catch((err) => {
          console.error("All users error:", err);
          return null;
        }),
        superAdminService.getConversationCounts().catch((err) => {
          console.error("Conversation stats error:", err);
          return null;
        }),
      ]);

      // Update states with new data structure
      if (systemStatsData) {
        setPlatformStats({
          totalUsers: systemStatsData.totalUsers || 0,
          totalLeads: systemStatsData.totalLeads || 0,
          totalApplications: systemStatsData.totalApplications || 0,
          activeUsers: systemStatsData.systemPerformance?.activeUsers || 0,
          conversionRates: systemStatsData.conversionRates || {},
          systemHealth: systemStatsData.systemHealth || "operational",
        });

        // Process role metrics from all users data
        let processedRoleMetrics = [];

        if (allUsersData && allUsersData.users) {
          // Count users by role
          const roleCounts = {};

          allUsersData.users.forEach((user) => {
            const role = user.role || "applicant"; // Default to applicant if no role
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });

          // Convert to array format expected by the UI
          processedRoleMetrics = Object.entries(roleCounts).map(
            ([role, count]) => ({
              role: role,
              count: count,
              name: role === "applicant" ? "Applicant" : role,
            })
          );
        } else {
          // Fallback to backend data if getAllUsers failed
          processedRoleMetrics = systemStatsData.roleDetails || [];
        }

        setRoleMetrics(processedRoleMetrics);

        // Process leadFunnel data to exclude 'contacted' stage
        const leadFunnelData = systemStatsData.leadFunnel || {};
        const processedLeadFunnel = { ...leadFunnelData };

        // Remove 'contacted' if it exists and merge its count with 'interested'
        if (processedLeadFunnel.contacted) {
          processedLeadFunnel.interested =
            (processedLeadFunnel.interested || 0) +
            processedLeadFunnel.contacted;
          delete processedLeadFunnel.contacted;
        }

        setLeadFunnel(processedLeadFunnel);

        if (systemStatsData.systemPerformance) {
          setSystemPerformance({
            uptime: systemStatsData.systemPerformance.uptime || "99.9%",
            responseTime:
              systemStatsData.systemPerformance.responseTime || "< 200ms",
            errorRate: systemStatsData.systemPerformance.errorRate || "< 0.1%",
            activeConnections:
              systemStatsData.systemPerformance.activeUsers || 0,
          });
        }
      }

      if (userAnalyticsData) setUserAnalytics(userAnalyticsData);
      if (leadAnalyticsData) setLeadAnalytics(leadAnalyticsData);

      // Process conversation statistics
      if (conversationStatsData) {
        setConversationStats({
          total: conversationStatsData.total || 0,
          byStatus: conversationStatsData.byStatus || {},
          recentActivity: conversationStatsData.recentActivity || 0,
        });
      }

      if (performanceData) {
        setSystemPerformance((prev) => ({
          ...prev,
          memoryUsage: performanceData.memoryUsage || 0,
          cpuUsage: performanceData.cpuUsage || 0,
          activeConnections: performanceData.activeConnections || 0,
        }));
      }

      // If all requests failed, show error
      if (
        !systemStatsData &&
        !userAnalyticsData &&
        !leadAnalyticsData &&
        !allUsersData
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
        totalUsers: 0,
        totalLeads: 0,
        totalApplications: 0,
        activeUsers: 0,
        conversionRates: {},
        systemHealth: "unknown",
      });
      setRoleMetrics([]);
      setLeadFunnel({
        new_contact: 0,
        interested: 0,
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
      setRoleMetrics([]);
      setUserAnalytics({});
      setLeadAnalytics({});
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
      title: "Total Users",
      value: formatNumber(platformStats.totalUsers),
      icon: <GroupAddIcon />,
      gradient: "linear-gradient(45deg, #1a237e 30%, #3949ab 90%)",
      subtitle: "All system users",
    },
    {
      title: "Active Users",
      value: formatNumber(platformStats.activeUsers),
      icon: <GroupIcon />,
      gradient: "linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)",
      subtitle: "Currently active",
    },
    {
      title: "Total Leads",
      value: formatNumber(platformStats.totalLeads),
      icon: <SchoolIcon />,
      gradient: "linear-gradient(45deg, #2962ff 30%, #448aff 90%)",
      subtitle: "All time leads",
    },
    {
      title: "Applications",
      value: formatNumber(platformStats.totalApplications),
      icon: <AssignmentIcon />,
      gradient: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
      subtitle: "Total applications",
    },
    {
      title: "Enrolled",
      value: formatNumber(leadFunnel.enrolled || 0),
      icon: <SchoolIcon />,
      gradient: "linear-gradient(45deg, #16a34a 30%, #22c55e 90%)",
      subtitle: "Successfully enrolled",
    },
    {
      title: "Total Conversations",
      value: formatNumber(conversationStats.total || 0),
      icon: <ChatIcon />,
      gradient: "linear-gradient(45deg, #7c3aed 30%, #a855f7 90%)",
      subtitle: "All conversations",
    },
    {
      title: "Active Conversations",
      value: formatNumber(conversationStats.byStatus?.active || 0),
      icon: <ForumIcon />,
      gradient: "linear-gradient(45deg, #059669 30%, #10b981 90%)",
      subtitle: "Currently active",
    },
    {
      title: "Overall Conversion",
      value: `${platformStats.conversionRates?.overallConversion || 0}%`,
      icon: <TrendingUpIcon />,
      gradient: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
      subtitle: "Lead to enrollment",
    },
    {
      title: "System Health",
      value:
        platformStats.systemHealth === "operational" ? "Healthy" : "Issues",
      icon:
        platformStats.systemHealth === "operational" ? (
          <CheckCircleIcon />
        ) : (
          <ErrorIcon />
        ),
      gradient:
        platformStats.systemHealth === "operational"
          ? "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)"
          : "linear-gradient(45deg, #d32f2f 30%, #f44336 90%)",
      subtitle: "System status",
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

        {/* User Role Distribution - Modern Card Design */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: 400,
              background: "linear-gradient(to bottom right, #f8fafc, #ffffff)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <GroupIcon sx={{ color: "#6366f1", mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">
                Team Overview
              </Typography>
            </Box>

            {loading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={6} key={i}>
                    <Skeleton
                      variant="rectangular"
                      height={80}
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ height: "calc(100% - 60px)", overflow: "auto" }}>
                <Grid container spacing={2}>
                  {roleMetrics.map((roleData, index) => {
                    const getRoleConfig = (role) => {
                      const configs = {
                        superAdmin: {
                          color: "#dc2626",
                          bgColor: "#fef2f2",
                          icon: "👑",
                          title: "Super Admin",
                        },
                        admin: {
                          color: "#2563eb",
                          bgColor: "#eff6ff",
                          icon: "⚡",
                          title: "Admin",
                        },
                        marketingAgent: {
                          color: "#16a34a",
                          bgColor: "#f0fdf4",
                          icon: "📈",
                          title: "Marketing",
                        },
                        admissionAgent: {
                          color: "#ea580c",
                          bgColor: "#fff7ed",
                          icon: "🎓",
                          title: "Admission",
                        },
                        applicant: {
                          color: "#6b7280",
                          bgColor: "#f3f4f6",
                          icon: "🎯",
                          title: "Applicant",
                        },
                      };
                      return (
                        configs[role] || {
                          color: "#6b7280",
                          bgColor: "#f9fafb",
                          icon: "👤",
                          title: roleData.name,
                        }
                      );
                    };

                    const config = getRoleConfig(roleData.role);
                    const totalUsers = roleMetrics.reduce(
                      (sum, r) => sum + r.count,
                      0
                    );
                    const percentage =
                      totalUsers > 0
                        ? ((roleData.count / totalUsers) * 100).toFixed(0)
                        : 0;

                    return (
                      <Grid item xs={6} key={roleData.role}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            height: 100,
                            bgcolor: config.bgColor,
                            border: `1px solid ${config.color}20`,
                            borderRadius: 3,
                            transition: "all 0.2s ease-in-out",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 25px ${config.color}20`,
                              borderColor: `${config.color}40`,
                            },
                          }}
                        >
                          {/* Background Icon */}
                          <Box
                            sx={{
                              position: "absolute",
                              right: -5,
                              top: -5,
                              fontSize: "3rem",
                              opacity: 0.1,
                              transform: "rotate(15deg)",
                            }}
                          >
                            {config.icon}
                          </Box>

                          {/* Content */}
                          <Box sx={{ position: "relative", zIndex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "1.2rem",
                                  mr: 1,
                                }}
                              >
                                {config.icon}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                sx={{ color: config.color }}
                              >
                                {config.title}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "baseline",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="h4"
                                fontWeight="bold"
                                sx={{ color: config.color, mr: 1 }}
                              >
                                {roleData.count}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#6b7280" }}
                              >
                                users
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 4,
                                  bgcolor: "#e5e7eb",
                                  borderRadius: 2,
                                  mr: 1,
                                  overflow: "hidden",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${percentage}%`,
                                    height: "100%",
                                    bgcolor: config.color,
                                    borderRadius: 2,
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                fontWeight="medium"
                                sx={{ color: "#6b7280" }}
                              >
                                {percentage}%
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Summary Footer */}
                {roleMetrics.length > 0 && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: "#f8fafc",
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Total Active Users
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="primary.main"
                      >
                        {roleMetrics.reduce((sum, r) => sum + r.count, 0)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {roleMetrics.length === 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <GroupIcon sx={{ fontSize: 32, color: "#9ca3af" }} />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      No user data available
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      User roles will appear here once data is loaded
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

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
                    const maxCount = leadFunnel.new_contact || 1;
                    const percentage = ((count / maxCount) * 100).toFixed(1);
                    const previousStage =
                      index > 0 ? leadFunnel[stages[index - 1]] : count;
                    const dropOff = index > 0 ? previousStage - count : 0;
                    const dropOffPercentage =
                      previousStage > 0
                        ? ((dropOff / previousStage) * 100).toFixed(1)
                        : "0";

                    const stageConfig = {
                      new_contact: {
                        color: "#1e40af",
                        icon: <ForumIcon />,
                        label: "New Contacts",
                        sublabel: "Initial Inquiries",
                      },
                      interested: {
                        color: "#7c3aed",
                        icon: <CampaignIcon />,
                        label: "Interested",
                        sublabel: "Expressed Interest",
                      },
                      qualified: {
                        color: "#0891b2",
                        icon: <EmojiEventsIcon />,
                        label: "Qualified",
                        sublabel: "Met Criteria",
                      },
                      applied: {
                        color: "#059669",
                        icon: <AssignmentIcon />,
                        label: "Applied",
                        sublabel: "Submitted Application",
                      },
                      admitted: {
                        color: "#dc2626",
                        icon: <CheckCircleIcon />,
                        label: "Admitted",
                        sublabel: "Accepted",
                      },
                      enrolled: {
                        color: "#16a34a",
                        icon: <SchoolIcon />,
                        label: "Enrolled",
                        sublabel: "Confirmed & Registered",
                      },
                    };

                    const config = stageConfig[stage] || {
                      color: "#6b7280",
                      icon: <ForumIcon />,
                      label: stage
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                      sublabel: "Unknown Stage",
                    };
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
                            {leadFunnel.new_contact > 0
                              ? (
                                  (leadFunnel.enrolled /
                                    leadFunnel.new_contact) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            From interested to enrollment
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
                            {leadFunnel.new_contact > 0
                              ? (
                                  (leadFunnel.applied /
                                    leadFunnel.new_contact) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Interested that applied
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
                              (leadFunnel.new_contact || 0) -
                                (leadFunnel.applied || 0) -
                                (leadFunnel.qualified || 0)
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

        {/* Conversion Rate Insights */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Insights
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
                {/* Contact to Qualified */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      New to Qualified
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {platformStats.conversionRates?.inquiryToContacted || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(
                      platformStats.conversionRates?.inquiryToContacted || 0
                    )}
                    color="primary"
                  />
                </Box>

                {/* Qualified to Applied */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Qualified to Applied
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {platformStats.conversionRates?.qualifiedToApplied || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(
                      platformStats.conversionRates?.qualifiedToApplied || 0
                    )}
                    color="info"
                  />
                </Box>

                {/* Applied to Admitted */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Applied to Admitted
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {platformStats.conversionRates?.appliedToAdmitted || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(
                      platformStats.conversionRates?.appliedToAdmitted || 0
                    )}
                    color="warning"
                  />
                </Box>

                {/* Overall Success Rate */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                    p: 2,
                    bgcolor: "success.light",
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="success.dark">
                      Overall Success
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="success.dark">
                    {platformStats.conversionRates?.overallConversion || 0}%
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PersonAddIcon />}
                    onClick={() => navigate("/super-admin/users")}
                    sx={{ py: 2 }}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CampaignIcon />}
                    onClick={() => navigate("/super-admin/lead-forms")}
                    sx={{ py: 2 }}
                  >
                    Lead Forms
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate("/analytics")}
                    sx={{ py: 2 }}
                  >
                    View Analytics
                  </Button>
                </Grid>
              </Grid>
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "primary.light",
                  borderRadius: 1,
                  color: "primary.contrastText",
                }}
              >
                <Typography variant="body2" align="center">
                  <strong>Welcome to Nyota AI Fusion</strong>
                  <br />
                  Super Admin Dashboard - Full System Control
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
