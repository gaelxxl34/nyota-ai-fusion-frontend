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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tooltip,
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
  Insights as InsightsIcon,
  Assessment as ReportIcon,
  BarChart as ChartIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Filter as FilterIcon,
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
  AreaChart,
  Area,
} from "recharts";
import { analyticsService } from "../../services/analyticsService";
import { leadService } from "../../services/leadService";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { PERMISSIONS } from "../../config/roles.config";

const Analytics = () => {
  const { checkPermission } = useRolePermissions();

  // Check if user has permission to view analytics
  const hasAnalyticsPermission = checkPermission(PERMISSIONS.ANALYTICS);

  // State
  const [timeRange, setTimeRange] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState("overview");

  // New state for list viewing and printing
  const [showLeadsList, setShowLeadsList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [leadsList, setLeadsList] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLeads, setFilteredLeads] = useState([]);
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

  // Helper function to get date range for filtering
  const getDateRange = (range) => {
    const now = new Date();
    let startDate, endDate;

    switch (range) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );
        break;
      case "weekly":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
        endDate = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate() + 7
        );
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "previous_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all_time":
        startDate = new Date(2020, 0, 1); // Arbitrary start date
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return { startDate, endDate };
  };

  // Function to fetch leads by status
  const fetchLeadsByStatus = async (status) => {
    try {
      setLeadsLoading(true);
      console.log(
        `Fetching leads for status: ${status} with timeRange: ${timeRange}`
      );

      // Use larger limit for all_time to get comprehensive data
      const limit = timeRange === "all_time" ? 5000 : 1000;

      const response = await leadService.getLeadsByStatus(status, {
        limit: limit,
        offset: 0,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success && response.data) {
        let leads = response.data;

        // Debug: Log the first lead to see structure
        if (leads.length > 0) {
          console.log("Sample lead structure:", leads[0]);
          console.log("Lead fields:", Object.keys(leads[0]));
        }

        // Only filter by date range if not "all_time"
        if (timeRange !== "all_time") {
          const { startDate, endDate } = getDateRange(timeRange);
          leads = leads.filter((lead) => {
            const leadDate = new Date(lead.createdAt);
            return leadDate >= startDate && leadDate < endDate;
          });
          console.log(
            `Filtered ${response?.data?.length || 0} leads to ${
              leads.length
            } for timeRange: ${timeRange}`
          );
        } else {
          console.log(
            `Showing all ${leads.length} leads for all_time timeRange`
          );
        }

        setLeadsList(leads);
        setFilteredLeads(leads);
      } else {
        setLeadsList([]);
        setFilteredLeads([]);
      }
    } catch (error) {
      console.error("Error fetching leads by status:", error);
      setError("Failed to fetch leads list");
      setLeadsList([]);
      setFilteredLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  // Function to handle showing leads list
  const handleShowLeadsList = (status) => {
    setSelectedStatus(status);
    setShowLeadsList(true);
    fetchLeadsByStatus(status);
  };

  // Function to filter leads based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLeads(leadsList);
    } else {
      const filtered = leadsList.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone?.includes(searchTerm) ||
          lead.programOfInterest?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          String(lead.programOfInterest)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          lead.program?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          String(lead.program)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          // Also check contactInfo structure for backward compatibility
          lead.contactInfo?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          lead.contactInfo?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          lead.contactInfo?.phone?.includes(searchTerm)
      );
      setFilteredLeads(filtered);
    }
  }, [searchTerm, leadsList]);

  // Function to print leads list
  const handlePrintLeadsList = () => {
    const printWindow = window.open("", "_blank");
    const statusLabel = selectedStatus.replace(/_/g, " ");
    const timeLabel =
      timeRange === "all_time"
        ? "All Time"
        : timeRange === "previous_month"
        ? "Previous Month"
        : timeRange.charAt(0).toUpperCase() + timeRange.slice(1);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Leads Report - ${statusLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7a0000; padding-bottom: 20px; }
            .header h1 { color: #7a0000; margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7a0000; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NYOTA AI FUSION - Leads Report</h1>
            <p>Status: ${statusLabel}</p>
            <p>Time Period: ${timeLabel}</p>
            <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="stats">
            <strong>Total Leads: ${filteredLeads.length}</strong>
          </div>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Program of Interest</th>
                <th>Source</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLeads
                .map(
                  (lead) => `
                <tr>
                  <td>${String(
                    lead.name || lead.contactInfo?.name || "N/A"
                  )}</td>
                  <td>${String(
                    lead.email || lead.contactInfo?.email || "N/A"
                  )}</td>
                  <td>${String(
                    lead.phone || lead.contactInfo?.phone || "N/A"
                  )}</td>
                  <td>${String(
                    lead.programOfInterest?.name ||
                      lead.programOfInterest ||
                      lead.program?.name ||
                      lead.program ||
                      "N/A"
                  )}</td>
                  <td>${String(lead.source?.name || lead.source || "N/A")}</td>
                  <td>${new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated by NYOTA AI FUSION Analytics System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Function to export leads list as CSV
  const handleExportLeadsList = () => {
    const statusLabel = selectedStatus.replace(/_/g, " ");
    const timeLabel =
      timeRange === "all_time"
        ? "All_Time"
        : timeRange === "previous_month"
        ? "Previous_Month"
        : timeRange;

    const csvHeaders = [
      "Name",
      "Email",
      "Phone",
      "Program of Interest",
      "Source",
      "Status",
      "Created Date",
    ];
    const csvRows = filteredLeads.map((lead) => [
      String(lead.name || lead.contactInfo?.name || ""),
      String(lead.email || lead.contactInfo?.email || ""),
      String(lead.phone || lead.contactInfo?.phone || ""),
      String(
        lead.programOfInterest?.name ||
          lead.programOfInterest ||
          lead.program?.name ||
          lead.program ||
          ""
      ),
      String(lead.source?.name || lead.source || ""),
      String(lead.status || ""),
      new Date(lead.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads_${statusLabel.replace(/\s+/g, "_")}_${timeLabel}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          contacted: data.overview?.statusCounts?.CONTACTED || 0, // Leads with CONTACTED status
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
            stage: "Contacted",
            count: data.overview?.statusCounts?.CONTACTED || 0,
            description: "Initial contact made through ads/campaigns",
          },
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
            stage: "Missing Documents",
            count: data.overview?.statusCounts?.MISSING_DOCUMENT || 0,
            description: "Applications missing required documents",
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

      const timeRangeLabel =
        timeRange === "all_time"
          ? "All Time"
          : timeRange === "previous_month"
          ? "Previous Month"
          : timeRange === "monthly"
          ? "This Month"
          : timeRange.charAt(0).toUpperCase() + timeRange.slice(1);

      pdf.text(`Time Range: ${timeRangeLabel}`, 20, 55);
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
        `Contacted Status: ${formatNumber(reportData.summary.contacted)}`,
        20,
        yPos
      );
      pdf.text(
        `In Review Status: ${formatNumber(reportData.summary.inReview)}`,
        120,
        yPos
      );

      yPos += 10;
      pdf.text(
        `Qualified Status: ${formatNumber(reportData.summary.qualified)}`,
        20,
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

      const timeRangeForFile =
        timeRange === "all_time"
          ? "all-time"
          : timeRange === "previous_month"
          ? "previous-month"
          : timeRange === "monthly"
          ? "this-month"
          : timeRange;

      pdf.save(
        `comprehensive-analytics-${reportType}-${timeRangeForFile}-${
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
            <Tooltip title="Click on status cards below to view and print lists">
              <IconButton size="small" sx={{ ml: 1 }}>
                <FilterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Status Cards - Clickable */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {reportData.statusDistribution.map((status, index) => (
              <Grid item xs={12} sm={6} md={4} key={status.statusCode}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3,
                      backgroundColor: `${
                        CHART_COLORS[index % CHART_COLORS.length]
                      }10`,
                    },
                  }}
                  onClick={() => handleShowLeadsList(status.statusCode)}
                >
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        fontWeight: "bold",
                      }}
                    >
                      {status.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {status.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: CHART_COLORS[index % CHART_COLORS.length],
                        fontWeight: "medium",
                      }}
                    >
                      {status.percentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

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

  // KPI Card Component - Made clickable for status-based KPIs
  const KpiCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "primary",
    trend,
    statusCode = null,
    clickable = false,
  }) => (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "visible",
        cursor: clickable ? "pointer" : "default",
        transition: clickable ? "all 0.3s ease" : "none",
        "&:hover": clickable
          ? {
              transform: "translateY(-2px)",
              boxShadow: 3,
              backgroundColor: `${COLORS[color]}05`,
            }
          : {},
      }}
      onClick={
        clickable && statusCode
          ? () => handleShowLeadsList(statusCode)
          : undefined
      }
    >
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
              {clickable && (
                <Tooltip title="Click to view list">
                  <FilterIcon
                    sx={{ ml: 1, fontSize: "0.8rem", color: "text.secondary" }}
                  />
                </Tooltip>
              )}
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
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  "&.Mui-selected": {
                    backgroundColor: COLORS.primary,
                    color: "white",
                  },
                },
              }}
            >
              <ToggleButton value="daily">Daily</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
              <ToggleButton value="monthly">This Month</ToggleButton>
              <ToggleButton value="previous_month">Prev Month</ToggleButton>
              <ToggleButton value="all_time">All Time</ToggleButton>
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

      {/* Info Alert about new features */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: `${COLORS.primary}08`,
          borderColor: `${COLORS.primary}30`,
          "& .MuiAlert-icon": { color: COLORS.primary },
        }}
      >
        <Typography variant="body2">
          <strong>New Features:</strong> Click on status cards or KPI cards to
          view and print detailed lists of leads. Use the new time filters
          (Previous Month, All Time) for comprehensive reporting.
        </Typography>
      </Alert>

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
                statusCode="APPLIED"
                clickable={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Admitted Status"
                value={reportData.summary.admitted}
                subtitle="ADMITTED status"
                icon={CheckCircleIcon}
                color="success"
                statusCode="ADMITTED"
                clickable={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Enrolled Status"
                value={reportData.summary.enrolled}
                subtitle="ENROLLED status"
                icon={SchoolIcon}
                color="primary"
                statusCode="ENROLLED"
                clickable={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="In Review Status"
                value={reportData.summary.inReview}
                subtitle="IN_REVIEW status"
                icon={PendingIcon}
                color="warning"
                statusCode="IN_REVIEW"
                clickable={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Contacted Status"
                value={reportData.summary.contacted}
                subtitle="CONTACTED status"
                icon={ReportIcon}
                color="default"
                statusCode="CONTACTED"
                clickable={true}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KpiCard
                title="Interested Status"
                value={reportData.summary.interested}
                subtitle="INTERESTED status"
                icon={ReportIcon}
                color="neutral"
                statusCode="INTERESTED"
                clickable={true}
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

      {/* Leads List Dialog */}
      <Dialog
        open={showLeadsList}
        onClose={() => setShowLeadsList(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "80vh" },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Leads List - {selectedStatus.replace(/_/g, " ")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {timeRange === "all_time"
                  ? "All Time"
                  : timeRange === "previous_month"
                  ? "Previous Month"
                  : timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}{" "}
                • {filteredLeads.length} leads
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Print List">
                <IconButton
                  onClick={handlePrintLeadsList}
                  disabled={filteredLeads.length === 0}
                  sx={{ color: COLORS.primary }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export CSV">
                <IconButton
                  onClick={handleExportLeadsList}
                  disabled={filteredLeads.length === 0}
                  sx={{ color: COLORS.primary }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setShowLeadsList(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, phone, or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {leadsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredLeads.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {searchTerm
                ? "No leads found matching your search criteria."
                : "No leads found for this status and time period."}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: COLORS.primary,
                              fontSize: "0.8rem",
                            }}
                          >
                            {(lead.name || lead.contactInfo?.name)
                              ?.charAt(0)
                              ?.toUpperCase() || "L"}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {String(
                              lead.name || lead.contactInfo?.name || "N/A"
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {String(
                            lead.email || lead.contactInfo?.email || "N/A"
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {String(
                            lead.phone || lead.contactInfo?.phone || "N/A"
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {String(
                            lead.programOfInterest?.name ||
                              lead.programOfInterest ||
                              lead.program?.name ||
                              lead.program ||
                              "N/A"
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={String(
                            lead.source?.name || lead.source || "N/A"
                          )}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(lead.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            String(lead.status)?.replace(/_/g, " ") || "N/A"
                          }
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.primary}20`,
                            color: COLORS.primary,
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "grey.50" }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Showing {filteredLeads.length} of {leadsList.length} leads
          </Typography>
          <Button onClick={() => setShowLeadsList(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Analytics;
