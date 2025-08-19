import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Skeleton,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  Insights as InsightsIcon,
  Assessment as ReportIcon,
  BarChart as ChartIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { analyticsService } from "../../services/analyticsService";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { PERMISSIONS } from "../../config/roles.config";

const Analytics = () => {
  const { checkPermission, role } = useRolePermissions();

  // Check if user has permission to view analytics
  const hasAnalyticsPermission = checkPermission(PERMISSIONS.ANALYTICS);

  // State
  const [timeRange, setTimeRange] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState("overview");
  const [reportData, setReportData] = useState({
    summary: {
      totalLeads: 0,
      newLeads: 0,
      applications: 0,
      admitted: 0,
      enrollments: 0,
      pending: 0,
      rejected: 0,
    },
    statusDistribution: [],
    conversionFunnel: [],
    admissionFunnel: [],
    topPerformers: [],
    trends: [],
    programAnalytics: [],
    conversionRates: {},
    admissionRates: {},
    detailedMetrics: {
      applicationToAdmission: 0,
      admissionToEnrollment: 0,
      overallConversion: 0,
      averageProcessingTime: 0,
    },
  });

  // Colors for charts
  const COLORS = {
    primary: "#7a0000",
    secondary: "#ff9800",
    success: "#4caf50",
    info: "#2196f3",
    warning: "#ff5722",
    neutral: "#9e9e9e",
  };

  const CHART_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.info,
    COLORS.warning,
    COLORS.neutral,
  ];

  // Helper function to format numbers
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Helper function to format percentage
  const formatPercentage = (num) => {
    return `${Number(num).toFixed(1)}%`;
  };

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch analytics data from the API
      const data = await analyticsService.getAllAnalytics(timeRange);

      // Transform data for comprehensive reporting - All counts based on lead status fields
      const transformedData = {
        summary: {
          totalLeads: data.overview?.totalLeads || 0,
          newLeads: data.overview?.recentLeads || 0,
          // Count leads by their current status, not separate applications
          applied: data.overview?.statusCounts?.APPLIED || 0, // Leads with APPLIED status
          inReview: data.overview?.statusCounts?.IN_REVIEW || 0, // Leads with IN_REVIEW status
          qualified: data.overview?.statusCounts?.QUALIFIED || 0, // Leads with QUALIFIED status
          admitted: data.overview?.statusCounts?.ADMITTED || 0, // Leads with ADMITTED status
          enrolled: data.overview?.statusCounts?.ENROLLED || 0, // Leads with ENROLLED status
          deferred: data.overview?.statusCounts?.DEFERRED || 0, // Leads with DEFERRED status
          expired: data.overview?.statusCounts?.EXPIRED || 0, // Leads with EXPIRED status
          interested: data.overview?.statusCounts?.INTERESTED || 0, // Leads with INTERESTED status
        },
        statusDistribution: Object.entries(data.overview?.statusCounts || {})
          .filter(([status, count]) => count > 0)
          .map(([status, count]) => ({
            name: status.replace(/_/g, " "),
            value: count,
            percentage: (
              (count / (data.overview?.totalLeads || 1)) *
              100
            ).toFixed(1),
            statusCode: status, // Keep original status code for reference
          })),
        // Complete lead lifecycle funnel based on status progression
        conversionFunnel: [
          {
            stage: "Interested",
            count: data.overview?.statusCounts?.INTERESTED || 0,
            description: "Initial inquiries and lead capture",
          },
          {
            stage: "Applied",
            count: data.overview?.statusCounts?.APPLIED || 0,
            description: "Leads who submitted applications",
          },
          {
            stage: "In Review",
            count: data.overview?.statusCounts?.IN_REVIEW || 0,
            description: "Applications under review",
          },
          {
            stage: "Qualified",
            count: data.overview?.statusCounts?.QUALIFIED || 0,
            description: "Leads who meet requirements",
          },
          {
            stage: "Admitted",
            count: data.overview?.statusCounts?.ADMITTED || 0,
            description: "Officially admitted students",
          },
          {
            stage: "Enrolled",
            count: data.overview?.statusCounts?.ENROLLED || 0,
            description: "Successfully enrolled students",
          },
        ],
        // Admission pipeline showing progression through status stages
        admissionFunnel: [
          {
            stage: "Applied Status",
            count: data.overview?.statusCounts?.APPLIED || 0,
            rate: 100,
            description: "Leads with APPLIED status",
          },
          {
            stage: "In Review Status",
            count: data.overview?.statusCounts?.IN_REVIEW || 0,
            rate:
              data.overview?.statusCounts?.APPLIED > 0
                ? (
                    ((data.overview?.statusCounts?.IN_REVIEW || 0) /
                      data.overview?.statusCounts?.APPLIED) *
                    100
                  ).toFixed(1)
                : 0,
            description: "Leads with IN_REVIEW status",
          },
          {
            stage: "Qualified Status",
            count: data.overview?.statusCounts?.QUALIFIED || 0,
            rate:
              data.overview?.statusCounts?.APPLIED > 0
                ? (
                    ((data.overview?.statusCounts?.QUALIFIED || 0) /
                      data.overview?.statusCounts?.APPLIED) *
                    100
                  ).toFixed(1)
                : 0,
            description: "Leads with QUALIFIED status",
          },
          {
            stage: "Admitted Status",
            count: data.overview?.statusCounts?.ADMITTED || 0,
            rate:
              data.overview?.statusCounts?.APPLIED > 0
                ? (
                    ((data.overview?.statusCounts?.ADMITTED || 0) /
                      data.overview?.statusCounts?.APPLIED) *
                    100
                  ).toFixed(1)
                : 0,
            description: "Leads with ADMITTED status",
          },
          {
            stage: "Enrolled Status",
            count: data.overview?.statusCounts?.ENROLLED || 0,
            rate:
              data.overview?.statusCounts?.ADMITTED > 0
                ? (
                    ((data.overview?.statusCounts?.ENROLLED || 0) /
                      data.overview?.statusCounts?.ADMITTED) *
                    100
                  ).toFixed(1)
                : 0,
            description: "Leads with ENROLLED status",
          },
        ],
        topPerformers: (data.agentPerformance || [])
          .sort((a, b) => b.leadsSubmitted - a.leadsSubmitted)
          .slice(0, 5)
          .map((agent) => ({
            name: agent.name,
            role: agent.role,
            leads: agent.leadsSubmitted,
            applications: agent.applied || 0,
            admitted: agent.admitted || 0,
            enrolled: agent.enrolled || 0,
            conversions: agent.enrolled,
            rate: agent.conversionRate,
          })),
        trends: data.progression || [],
        programAnalytics: generateProgramAnalytics(data),
        conversionRates: data.conversionRates?.rates || {},
        admissionRates: {
          applicationToAdmission:
            data.overview?.statusCounts?.APPLIED > 0
              ? (
                  ((data.overview?.statusCounts?.ADMITTED || 0) /
                    data.overview?.statusCounts?.APPLIED) *
                  100
                ).toFixed(1)
              : 0,
          admissionToEnrollment:
            data.overview?.statusCounts?.ADMITTED > 0
              ? (
                  ((data.overview?.statusCounts?.ENROLLED || 0) /
                    data.overview?.statusCounts?.ADMITTED) *
                  100
                ).toFixed(1)
              : 0,
        },
        detailedMetrics: {
          applicationToAdmission:
            data.overview?.statusCounts?.APPLIED > 0
              ? (
                  ((data.overview?.statusCounts?.ADMITTED || 0) /
                    data.overview?.statusCounts?.APPLIED) *
                  100
                ).toFixed(1)
              : 0,
          admissionToEnrollment:
            data.overview?.statusCounts?.ADMITTED > 0
              ? (
                  ((data.overview?.statusCounts?.ENROLLED || 0) /
                    data.overview?.statusCounts?.ADMITTED) *
                  100
                ).toFixed(1)
              : 0,
          overallConversion:
            data.overview?.statusCounts?.INTERESTED > 0
              ? (
                  ((data.overview?.statusCounts?.ENROLLED || 0) /
                    data.overview?.statusCounts?.INTERESTED) *
                  100
                ).toFixed(1)
              : 0,
          averageProcessingTime: "3-5 days", // This would come from backend analysis
        },
      };

      setReportData(transformedData);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("You don't have permission to view analytics.");
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else {
        setError("Unable to load analytics data.");
      }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Generate program analytics (mock data - would come from backend)
  const generateProgramAnalytics = (data) => {
    const programs = [
      { name: "Bachelor IT", applied: 45, admitted: 32, enrolled: 28 },
      { name: "Bachelor Business", applied: 38, admitted: 25, enrolled: 22 },
      { name: "Master IT", applied: 22, admitted: 18, enrolled: 15 },
      { name: "Master Business", applied: 15, admitted: 12, enrolled: 10 },
      { name: "Diploma IT", applied: 30, admitted: 24, enrolled: 20 },
    ];

    return programs.map((program) => ({
      ...program,
      admissionRate: ((program.admitted / program.applied) * 100).toFixed(1),
      enrollmentRate: ((program.enrolled / program.admitted) * 100).toFixed(1),
    }));
  };

  // Handle PDF export with multiple report types
  const handlePdfExport = async () => {
    try {
      setExportLoading(true);

      if (!checkPermission(PERMISSIONS.EXPORT_DATA)) {
        setError("You don't have permission to export data");
        return;
      }

      const jsPDF = (await import("jspdf")).default;
      const pdf = new jsPDF();

      // Title and header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("NYOTA AI FUSION - STATUS-BASED ANALYTICS REPORT", 20, 30);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text(
        `Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`,
        20,
        55
      );
      pdf.text(
        `Report Type: ${
          reportType.charAt(0).toUpperCase() + reportType.slice(1)
        } Analytics`,
        20,
        65
      );
      pdf.text("Note: All counts are based on lead status fields", 20, 75);

      let yPos = 95;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("EXECUTIVE SUMMARY - STATUS BREAKDOWN", 20, yPos);

      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Total Leads: ${formatNumber(reportData.summary.totalLeads)}`,
        20,
        yPos
      );
      pdf.text(
        `Applied Status: ${formatNumber(reportData.summary.applied)}`,
        120,
        yPos
      );

      yPos += 10;
      pdf.text(
        `In Review Status: ${formatNumber(reportData.summary.inReview)}`,
        20,
        yPos
      );
      pdf.text(
        `Qualified Status: ${formatNumber(reportData.summary.qualified)}`,
        120,
        yPos
      );

      yPos += 10;
      pdf.text(
        `Admitted Status: ${formatNumber(reportData.summary.admitted)}`,
        20,
        yPos
      );
      pdf.text(
        `Enrolled Status: ${formatNumber(reportData.summary.enrolled)}`,
        120,
        yPos
      ); // Admission Rates
      yPos += 25;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("ADMISSION ANALYTICS", 20, yPos);

      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Application to Admission Rate: ${reportData.detailedMetrics.applicationToAdmission}%`,
        20,
        yPos
      );
      yPos += 10;
      pdf.text(
        `Admission to Enrollment Rate: ${reportData.detailedMetrics.admissionToEnrollment}%`,
        20,
        yPos
      );
      yPos += 10;
      pdf.text(
        `Overall Conversion Rate: ${reportData.detailedMetrics.overallConversion}%`,
        20,
        yPos
      );

      // Program Analytics
      if (reportData.programAnalytics.length > 0) {
        yPos += 25;
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("PROGRAM PERFORMANCE", 20, yPos);

        yPos += 15;
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        reportData.programAnalytics.forEach((program) => {
          pdf.text(
            `${program.name}: ${program.applied} applied, ${program.admitted} admitted (${program.admissionRate}%)`,
            20,
            yPos
          );
          yPos += 10;
        });
      }

      // Status Distribution
      yPos += 15;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("STATUS DISTRIBUTION", 20, yPos);

      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      reportData.statusDistribution.forEach((status) => {
        pdf.text(
          `${status.name}: ${status.value} (${status.percentage}%)`,
          20,
          yPos
        );
        yPos += 10;
      });

      pdf.save(
        `comprehensive-analytics-${reportType}-${timeRange}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      setError("Failed to generate PDF report");
      console.error("PDF export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Tab render functions
  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TimelineIcon sx={{ mr: 1, color: COLORS.primary }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Complete Conversion Funnel
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Full lead progression from interest to enrollment
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AnalyticsIcon sx={{ mr: 1, color: COLORS.primary }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Status Distribution
            </Typography>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {reportData.statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAdmissionsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <SchoolIcon sx={{ mr: 1, color: COLORS.primary }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Admission Pipeline
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Applications vs Admissions Analysis
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData.admissionFunnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <RechartsTooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                fill={`${COLORS.primary}20`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            Admission Rates
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Application → Admission</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {reportData.detailedMetrics.applicationToAdmission}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(
                  reportData.detailedMetrics.applicationToAdmission
                )}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Admission → Enrollment</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {reportData.detailedMetrics.admissionToEnrollment}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(
                  reportData.detailedMetrics.admissionToEnrollment
                )}
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </Box>
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Overall Conversion</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {reportData.detailedMetrics.overallConversion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(reportData.detailedMetrics.overallConversion)}
                sx={{ height: 8, borderRadius: 4 }}
                color="info"
              />
            </Box>
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: `${COLORS.primary}10`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color={COLORS.primary} gutterBottom>
                Average Processing Time
              </Typography>
              <Typography variant="h4" color={COLORS.primary} fontWeight="bold">
                {reportData.detailedMetrics.averageProcessingTime}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPerformanceTab = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TrendingUpIcon sx={{ mr: 1, color: COLORS.primary }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Enhanced Performance Metrics
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Detailed team member performance with admission tracking
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="center">Leads</TableCell>
              <TableCell align="center">Applications</TableCell>
              <TableCell align="center">Admitted</TableCell>
              <TableCell align="center">Enrolled</TableCell>
              <TableCell align="center">Conversion Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.topPerformers.map((performer, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{ width: 32, height: 32, bgcolor: COLORS.primary }}
                    >
                      {performer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {performer.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={performer.role.replace(/([A-Z])/g, " $1").trim()}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  />
                </TableCell>
                <TableCell align="center">{performer.leads}</TableCell>
                <TableCell align="center">{performer.applications}</TableCell>
                <TableCell align="center">{performer.admitted}</TableCell>
                <TableCell align="center">{performer.enrolled}</TableCell>
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={
                      performer.rate > 20 ? "success.main" : "warning.main"
                    }
                  >
                    {formatPercentage(performer.rate)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderProgramsTab = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <ReportIcon sx={{ mr: 1, color: COLORS.primary }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Program Analytics
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Performance breakdown by academic program
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Program</TableCell>
              <TableCell align="center">Applications</TableCell>
              <TableCell align="center">Admitted</TableCell>
              <TableCell align="center">Enrolled</TableCell>
              <TableCell align="center">Admission Rate</TableCell>
              <TableCell align="center">Enrollment Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.programAnalytics.map((program, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {program.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">{program.applied}</TableCell>
                <TableCell align="center">{program.admitted}</TableCell>
                <TableCell align="center">{program.enrolled}</TableCell>
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="info.main"
                  >
                    {program.admissionRate}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {program.enrollmentRate}%
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderInsightsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            Key Insights
          </Typography>
          <Stack spacing={2}>
            <Alert severity="success">
              <Typography variant="body2">
                <strong>High Performing Program:</strong>{" "}
                {reportData.programAnalytics[0]?.name} has the highest admission
                rate at {reportData.programAnalytics[0]?.admissionRate}%
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Application Trend:</strong>{" "}
                {reportData.summary.applications} applications received this{" "}
                {timeRange}
              </Typography>
            </Alert>
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Processing Time:</strong> Average application processing
                takes {reportData.detailedMetrics.averageProcessingTime}
              </Typography>
            </Alert>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            Recommendations
          </Typography>
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                border: `1px solid ${COLORS.primary}20`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color={COLORS.primary}>
                <strong>Focus Area:</strong> Improve admission to enrollment
                conversion rate
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                border: `1px solid ${COLORS.info}20`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="info.main">
                <strong>Opportunity:</strong> Programs with lower admission
                rates need attention
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                border: `1px solid ${COLORS.success}20`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="success.main">
                <strong>Success:</strong> Overall conversion rate is performing
                well
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // KPI Card Component
  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "primary",
    trend,
  }) => (
    <Card sx={{ height: "100%", position: "relative", overflow: "visible" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: "bold", color: COLORS[color] }}
            >
              {formatNumber(value)}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{ bgcolor: `${COLORS[color]}20`, color: COLORS[color], ml: 2 }}
          >
            <Icon />
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {trend.isPositive ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend.isPositive ? "success.main" : "error.main"}
              sx={{ fontWeight: "medium" }}
            >
              {trend.value}% vs last {timeRange}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // If user doesn't have permission to view analytics, show error message
  if (!hasAnalyticsPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          You don't have permission to access the analytics dashboard.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: "bold", color: COLORS.primary }}
            >
              Comprehensive Analytics & Reporting
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced analytics dashboard with admission tracking and multiple
              report types
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="admissions">Admissions</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="trends">Trends</MenuItem>
                <MenuItem value="programs">Programs</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(e, newRange) => newRange && setTimeRange(newRange)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor: COLORS.primary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.primary,
                    color: "white",
                  },
                },
              }}
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={fetchAnalyticsData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            {checkPermission(PERMISSIONS.EXPORT_DATA) && (
              <Button
                variant="contained"
                startIcon={
                  exportLoading ? <CircularProgress size={20} /> : <PdfIcon />
                }
                onClick={handlePdfExport}
                disabled={loading || exportLoading}
                sx={{
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: `${COLORS.primary}dd` },
                }}
              >
                {exportLoading ? "Generating..." : "Export PDF"}
              </Button>
            )}
          </Box>
        </Box>
        <Divider />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            "& .MuiTab-root": { minWidth: 120 },
            "& .Mui-selected": { color: COLORS.primary },
            "& .MuiTabs-indicator": { backgroundColor: COLORS.primary },
          }}
        >
          <Tab icon={<AnalyticsIcon />} label="Overview" />
          <Tab icon={<SchoolIcon />} label="Admissions" />
          <Tab icon={<TrendingUpIcon />} label="Performance" />
          <Tab icon={<ChartIcon />} label="Programs" />
          <Tab icon={<InsightsIcon />} label="Insights" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={12} sm={6} md={2} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={40}
                      sx={{ my: 1 }}
                    />
                    <Skeleton variant="text" width="40%" height={16} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={300} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={300} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <>
          {/* Enhanced KPI Summary Cards - All counts based on lead status fields */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Total Leads"
                value={reportData.summary.totalLeads}
                subtitle="All statuses"
                icon={PeopleIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Applied Status"
                value={reportData.summary.applied}
                subtitle="APPLIED status"
                icon={AssignmentIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Admitted Status"
                value={reportData.summary.admitted}
                subtitle="ADMITTED status"
                icon={CheckCircleIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Enrolled Status"
                value={reportData.summary.enrolled}
                subtitle="ENROLLED status"
                icon={SchoolIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="In Review Status"
                value={reportData.summary.inReview}
                subtitle="IN_REVIEW status"
                icon={PendingIcon}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Qualified Status"
                value={reportData.summary.qualified}
                subtitle="QUALIFIED status"
                icon={ReportIcon}
                color="neutral"
              />
            </Grid>
          </Grid>

          {/* Tab Content */}
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderAdmissionsTab()}
          {activeTab === 2 && renderPerformanceTab()}
          {activeTab === 3 && renderProgramsTab()}
          {activeTab === 4 && renderInsightsTab()}
        </>
      )}
    </Box>
  );
};

export default Analytics;
