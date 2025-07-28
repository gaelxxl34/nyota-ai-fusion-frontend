import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Skeleton,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  WhatsApp as WhatsAppIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { analyticsService } from "../../services/analyticsService";
import { useAuth } from "../../contexts/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";

const Analytics = () => {
  const { checkPermission } = useRolePermissions();
  const { user } = useAuth();

  // State
  const [timeRange, setTimeRange] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState({
    statusProgression: [],
    agentPerformance: [],
    leadsByStatus: {},
    conversionRates: {},
    dailyTrends: [],
  });

  // Define colors for different statuses
  const statusColors = {
    CONTACTED: "#2196F3",
    PRE_QUALIFIED: "#FF9800",
    APPLIED: "#03A9F4",
    QUALIFIED: "#4CAF50",
    ENROLLED: "#8BC34A",
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all analytics data from the API
      const allData = await analyticsService.getAllAnalytics(timeRange);

      // Transform the data to match our component's expected format
      const transformedData = {
        statusProgression: allData.progression || [],
        agentPerformance: allData.agentPerformance || [],
        leadsByStatus: allData.overview?.statusCounts || {
          CONTACTED: 0,
          PRE_QUALIFIED: 0,
          APPLIED: 0,
          QUALIFIED: 0,
          ENROLLED: 0,
        },
        conversionRates: allData.conversionRates?.rates || {
          contactedToPreQualified: 0,
          preQualifiedToApplied: 0,
          appliedToQualified: 0,
          qualifiedToEnrolled: 0,
          overallConversion: 0,
        },
        dailyTrends: allData.progression || [],
      };

      setAnalyticsData(transformedData);
    } catch (err) {
      // Show user-friendly error based on the type
      if (err.response?.status === 403) {
        setError("You don't have permission to view analytics.");
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.message.includes("Network")) {
        setError("Backend server is not running.");
      } else {
        setError("Unable to load analytics data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setExportLoading(true);
      await analyticsService.exportAnalytics(timeRange, "csv");
    } catch (error) {
      setError("Failed to export analytics data");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  // Status Card Component
  const StatusCard = ({ title, value, icon: Icon, color, subtitle }) => {
    // TODO: Calculate actual change from previous period data
    const change = calculateChange(value, value * 0.8); // Temporary: using 80% as baseline

    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: "bold" }}
              >
                {value.toLocaleString()}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
              <Icon />
            </Avatar>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {change.isPositive ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={change.isPositive ? "success.main" : "error.main"}
            >
              {change.value}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track lead progression and agent performance metrics
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, newRange) => newRange && setTimeRange(newRange)}
            size="small"
          >
            <ToggleButton value="daily">
              <CalendarTodayIcon sx={{ mr: 0.5 }} fontSize="small" />
              Daily
            </ToggleButton>
            <ToggleButton value="weekly">
              <CalendarTodayIcon sx={{ mr: 0.5 }} fontSize="small" />
              Weekly
            </ToggleButton>
            <ToggleButton value="monthly">
              <CalendarTodayIcon sx={{ mr: 0.5 }} fontSize="small" />
              Monthly
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={fetchAnalyticsData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={exportLoading ? null : <DownloadIcon />}
            onClick={handleExport}
            disabled={loading || exportLoading}
          >
            {exportLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Exporting...
              </>
            ) : (
              "Export"
            )}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity={error.includes("sample data") ? "info" : "error"}
          sx={{ mb: 3 }}
          action={
            error.includes("sample data") && (
              <Button color="inherit" size="small" onClick={fetchAnalyticsData}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <>
          {/* Status Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Skeleton
                          variant="text"
                          width="60%"
                          height={24}
                          sx={{ mb: 1 }}
                        />
                        <Skeleton variant="text" width="80%" height={40} />
                      </Box>
                      <Skeleton variant="circular" width={48} height={48} />
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="text" width="30%" height={20} />
                      <Skeleton variant="text" width="40%" height={20} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts Skeleton */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={32}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="70%"
                  height={20}
                  sx={{ mb: 3 }}
                />
                <Skeleton variant="rectangular" height={350} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={32}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height={20}
                  sx={{ mb: 3 }}
                />
                {[1, 2, 3, 4].map((item) => (
                  <Box key={item} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Skeleton variant="text" width="50%" height={20} />
                      <Skeleton variant="text" width="15%" height={20} />
                    </Box>
                    <Skeleton
                      variant="rectangular"
                      height={8}
                      sx={{ borderRadius: 4 }}
                    />
                  </Box>
                ))}
                <Box sx={{ mt: 3, p: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Table Skeleton */}
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={20} sx={{ mb: 3 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                      <TableCell key={col}>
                        <Skeleton variant="text" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Skeleton variant="circular" width={32} height={32} />
                          <Box>
                            <Skeleton variant="text" width={100} height={16} />
                            <Skeleton variant="text" width={120} height={14} />
                          </Box>
                        </Box>
                      </TableCell>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                        <TableCell key={col}>
                          <Skeleton variant="text" width="80%" height={20} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : (
        <>
          {/* Status Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatusCard
                title="Contacted"
                value={analyticsData.leadsByStatus.CONTACTED || 0}
                icon={WhatsAppIcon}
                color="info"
                subtitle={`vs last ${timeRange}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatusCard
                title="Interested"
                value={analyticsData.leadsByStatus.PRE_QUALIFIED || 0}
                icon={AssessmentIcon}
                color="warning"
                subtitle={`vs last ${timeRange}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatusCard
                title="Applied"
                value={analyticsData.leadsByStatus.APPLIED || 0}
                icon={AssignmentIcon}
                color="info"
                subtitle={`vs last ${timeRange}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatusCard
                title="Qualified"
                value={analyticsData.leadsByStatus.QUALIFIED || 0}
                icon={SchoolIcon}
                color="success"
                subtitle={`vs last ${timeRange}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatusCard
                title="Enrolled"
                value={analyticsData.leadsByStatus.ENROLLED || 0}
                icon={SchoolIcon}
                color="primary"
                subtitle={`vs last ${timeRange}`}
              />
            </Grid>
          </Grid>

          {/* Lead Progression Chart */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lead Status Progression
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Track how leads progress through different stages over time
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.statusProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="contacted"
                      stroke={statusColors.CONTACTED}
                      name="Contacted"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="preQualified"
                      stroke={statusColors.PRE_QUALIFIED}
                      name="Interested"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="applied"
                      stroke={statusColors.APPLIED}
                      name="Applied"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="qualified"
                      stroke={statusColors.QUALIFIED}
                      name="Qualified"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="enrolled"
                      stroke={statusColors.ENROLLED}
                      name="Enrolled"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Conversion Rates */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Conversion Rates
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Stage-to-stage conversion performance
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Contacted → Interested
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {analyticsData.conversionRates.contactedToPreQualified}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(
                        analyticsData.conversionRates.contactedToPreQualified
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Interested → Applied
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {analyticsData.conversionRates.preQualifiedToApplied}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(
                        analyticsData.conversionRates.preQualifiedToApplied
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="warning"
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Applied → Qualified
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {analyticsData.conversionRates.appliedToQualified}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(
                        analyticsData.conversionRates.appliedToQualified
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="info"
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Qualified → Enrolled
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {analyticsData.conversionRates.qualifiedToEnrolled}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(
                        analyticsData.conversionRates.qualifiedToEnrolled
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="success"
                    />
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: "primary.light",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="primary.contrastText"
                      gutterBottom
                    >
                      Overall Conversion Rate
                    </Typography>
                    <Typography
                      variant="h4"
                      color="primary.contrastText"
                      fontWeight="bold"
                    >
                      {analyticsData.conversionRates.overallConversion}%
                    </Typography>
                    <Typography variant="caption" color="primary.contrastText">
                      From contacted to enrolled
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Agent Performance Table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agent Performance Report
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Individual performance metrics for marketing managers and
              admissions officers
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="center">Leads Submitted</TableCell>
                    <TableCell align="center">Contacted</TableCell>
                    <TableCell align="center">Interested</TableCell>
                    <TableCell align="center">Applied</TableCell>
                    <TableCell align="center">Qualified</TableCell>
                    <TableCell align="center">Enrolled</TableCell>
                    <TableCell align="center">Conversion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.agentPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          No agent performance data available for the selected
                          time period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    analyticsData.agentPerformance.map((agent, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{ width: 32, height: 32, fontSize: 14 }}
                            >
                              {agent.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {agent.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {agent.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={agent.role}
                            size="small"
                            color={
                              agent.role === "Marketing Manager"
                                ? "primary"
                                : "secondary"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {agent.leadsSubmitted}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {agent.contacted > 0 ? agent.contacted : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {agent.preQualified > 0 ? agent.preQualified : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {agent.applied > 0 ? agent.applied : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {agent.qualified > 0 ? agent.qualified : "-"}
                        </TableCell>
                        <TableCell align="center">
                          {agent.enrolled > 0 ? agent.enrolled : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="primary"
                            >
                              {agent.conversionRate}%
                            </Typography>
                            {agent.conversionRate > 20 ? (
                              <TrendingUpIcon
                                color="success"
                                fontSize="small"
                              />
                            ) : (
                              <TrendingDownIcon
                                color="error"
                                fontSize="small"
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Analytics;
