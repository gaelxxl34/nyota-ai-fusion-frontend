import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import admissionDashboardService from "../../services/admissionDashboard.service";
import DashboardSkeleton from "../../components/common/DashboardSkeleton";
import KPIOverview from "../../components/admission-admin/KPIOverview";
import ApplicationPipeline from "../../components/admission-admin/ApplicationPipeline";
import ProgramAnalytics from "../../components/admission-admin/ProgramAnalytics";

const AdmissionAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("weekly");
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await admissionDashboardService.getDashboardData(
          timeRange
        );

        if (response.success) {
          setDashboardData(response.data);
          setLastUpdated(new Date());
        } else {
          throw new Error(response.message || "Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange]
  );

  // Initialize dashboard on mount and when time range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const exportData = await admissionDashboardService.exportData(
        timeRange,
        "csv"
      );
      // Create download link
      const blob = new Blob([exportData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admission-dashboard-${timeRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  // Handle pipeline item actions
  const handleViewItem = (item) => {
    console.log("View item:", item);
    // TODO: Navigate to application details
  };

  const handleEditItem = (item) => {
    console.log("Edit item:", item);
    // TODO: Open edit dialog or navigate to edit page
  };

  const handleViewAllItems = (type) => {
    console.log("View all items of type:", type);
    // TODO: Navigate to filtered view
  };

  // Role authorization check (after all hooks)
  if (!user || !user.role || user.role !== "admissionAdmin") {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You don't have permission to access the Admission Dashboard.
        </Alert>
      </Container>
    );
  }

  // Show loading skeleton
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <DashboardSkeleton />
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchDashboardData()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const { kpis, pipeline, programAnalytics } = dashboardData || {};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Admission Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Welcome back, {user?.name || user?.email || "Admission Admin"}
            </Typography>
            {lastUpdated && (
              <Typography variant="caption" color="textSecondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            {/* Time Range Selector */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            {/* Action Buttons */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Time Range Indicator */}
        <Box display="flex" gap={1} alignItems="center">
          <Chip
            label={`${
              timeRange.charAt(0).toUpperCase() + timeRange.slice(1)
            } View`}
            color="primary"
            variant="outlined"
            size="small"
          />
          {dashboardData?.period && (
            <Chip
              label={`${new Date(
                dashboardData.period.start
              ).toLocaleDateString()} - ${new Date(
                dashboardData.period.end
              ).toLocaleDateString()}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <KPIOverview kpis={kpis} loading={loading} />
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <ApplicationPipeline
            pipeline={pipeline}
            loading={loading}
            onViewItem={handleViewItem}
            onEditItem={handleEditItem}
            onViewAllItems={handleViewAllItems}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button variant="contained" fullWidth>
                Review Applications
              </Button>
              <Button variant="outlined" fullWidth>
                Generate Reports
              </Button>
              <Button variant="outlined" fullWidth>
                Bulk Status Update
              </Button>
              <Button variant="outlined" fullWidth>
                Send Notifications
              </Button>
            </Box>

            {/* Status Summary */}
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Status Summary
              </Typography>
              {kpis?.statusDistribution && (
                <Box display="flex" flexDirection="column" gap={1}>
                  {Object.entries(kpis.statusDistribution).map(
                    ([status, count]) => (
                      <Box
                        key={status}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="body2"
                          sx={{ textTransform: "capitalize" }}
                        >
                          {status.replace(/([A-Z])/g, " $1").trim()}
                        </Typography>
                        <Chip label={count} size="small" variant="outlined" />
                      </Box>
                    )
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Program Analytics */}
      <ProgramAnalytics programAnalytics={programAnalytics} loading={loading} />
    </Container>
  );
};

export default AdmissionAdminDashboard;
