import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";
import { useSnackbar } from "notistack";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Reusable Lead Status Tab Component
const LeadStatusTab = ({
  leads,
  statusName,
  statusDisplayName,
  loading,
  onRefresh,
  onStartCampaign,
  onPreviewMessages,
  formatDate,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate pagination
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedLeads = leads.slice(startIndex, endIndex);

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PeopleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Total {statusDisplayName} Leads
            </Typography>
            <Typography variant="h3" color="primary">
              {leads.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Leads with "{statusName.toUpperCase()}" status
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => onStartCampaign(statusName)}
                disabled={leads.length === 0}
              >
                Start Bulk Campaign
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => onPreviewMessages(statusName)}
                disabled={leads.length === 0}
              >
                Preview Messages
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => onRefresh(statusName)}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Leads Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {statusDisplayName} Leads Preview
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : leads.length === 0 ? (
            <Alert severity="info">
              No {statusDisplayName.toLowerCase()} leads found. Leads will
              appear here when their status is set to "
              {statusName.toUpperCase()}".
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.name || "N/A"}</TableCell>
                      <TableCell>
                        {lead.email ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <EmailIcon fontSize="small" />
                            {lead.email}
                          </Box>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.phone || lead.whatsappNumber ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <WhatsAppIcon fontSize="small" />
                            {lead.phone || lead.whatsappNumber}
                          </Box>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{lead.interestedProgram || "N/A"}</TableCell>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Component */}
              <TablePagination
                component="div"
                count={leads.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage="Leads per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} of ${
                    count !== -1 ? count : `more than ${to}`
                  } leads`
                }
              />
            </TableContainer>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

const BulkActions = () => {
  const [tabValue, setTabValue] = useState(0);
  const [leadsData, setLeadsData] = useState({
    interested: [],
    in_review: [],
    admitted: [],
    enrolled: [],
  });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [selectedLeadStatus, setSelectedLeadStatus] = useState("interested");

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
  });

  const { enqueueSnackbar } = useSnackbar();

  // Fetch leads by status
  const fetchLeadsByStatus = useCallback(
    async (status) => {
      try {
        setLoading(true);
        // For now, only interested leads have an API endpoint
        // Other statuses will be implemented later
        if (status === "interested") {
          const response = await superAdminService.getInterestedLeads();
          let leads = response.leads || [];

          // Sort leads by creation date (latest first) - same as Data Center
          leads.sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date
                ? a.createdAt
                : new Date(a.createdAt || 0);
            const dateB =
              b.createdAt instanceof Date
                ? b.createdAt
                : new Date(b.createdAt || 0);
            return dateB - dateA; // desc order (newest first)
          });

          setLeadsData((prev) => ({
            ...prev,
            interested: leads,
          }));
        } else {
          // Placeholder for other statuses - will be implemented later
          setLeadsData((prev) => ({
            ...prev,
            [status]: [], // Empty array for now
          }));
          enqueueSnackbar(`${status} leads functionality coming soon!`, {
            variant: "info",
          });
        }
      } catch (error) {
        console.error(`Error fetching ${status} leads:`, error);
        enqueueSnackbar(`Failed to fetch ${status} leads`, {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  // Fetch all lead statuses
  const fetchAllLeads = useCallback(async () => {
    await fetchLeadsByStatus("interested");
    // Other statuses will be fetched when their APIs are ready
  }, [fetchLeadsByStatus]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignLoading(true);
      const response = await superAdminService.getAllCampaigns();
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      enqueueSnackbar("Failed to fetch campaigns", { variant: "error" });
    } finally {
      setCampaignLoading(false);
    }
  }, [enqueueSnackbar]);

  // Fetch specific campaign details
  const fetchCampaignDetails = useCallback(
    async (campaignId) => {
      try {
        const response = await superAdminService.getCampaign(campaignId);
        const updatedCampaign = response.campaign;

        setCampaigns((prev) =>
          prev.map((campaign) =>
            campaign.id === campaignId ? updatedCampaign : campaign
          )
        );

        return updatedCampaign;
      } catch (error) {
        console.error("Error fetching campaign details:", error);
        enqueueSnackbar("Failed to fetch campaign details", {
          variant: "error",
        });
      }
    },
    [enqueueSnackbar]
  );

  // Start auto-refresh for running campaigns
  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) clearInterval(refreshInterval);

    const interval = setInterval(() => {
      const runningCampaigns = campaigns.filter((c) => c.status === "running");
      if (runningCampaigns.length > 0) {
        runningCampaigns.forEach((campaign) => {
          fetchCampaignDetails(campaign.id);
        });
      }
    }, 5000); // Refresh every 5 seconds

    setRefreshInterval(interval);
  }, [refreshInterval, campaigns, fetchCampaignDetails]);

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [refreshInterval]);

  useEffect(() => {
    fetchAllLeads();
    fetchCampaigns();

    return () => stopAutoRefresh();
  }, [fetchAllLeads, fetchCampaigns, stopAutoRefresh]);
  useEffect(() => {
    const runningCampaigns = campaigns.filter((c) => c.status === "running");
    if (runningCampaigns.length > 0) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }, [campaigns, startAutoRefresh, stopAutoRefresh]);

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setCampaignForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle starting campaign for specific status
  const handleStartCampaign = (status) => {
    setSelectedLeadStatus(status);
    setShowCreateDialog(true);
  };

  // Handle previewing messages for specific status
  const handlePreviewMessages = (status) => {
    setSelectedLeadStatus(status);
    setShowPreviewDialog(true);
  };

  // Handle refreshing leads for specific status
  const handleRefreshLeads = (status) => {
    fetchLeadsByStatus(status);
  };

  // Create new campaign
  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) {
      enqueueSnackbar("Campaign name is required", { variant: "error" });
      return;
    }

    if (
      !leadsData[selectedLeadStatus] ||
      leadsData[selectedLeadStatus].length === 0
    ) {
      enqueueSnackbar(`No ${selectedLeadStatus} leads found to process`, {
        variant: "error",
      });
      return;
    }

    if (selectedLeadStatus !== "interested") {
      enqueueSnackbar(
        `Campaigns for "${selectedLeadStatus}" leads are not yet implemented`,
        { variant: "warning" }
      );
      return;
    }

    try {
      setLoading(true);
      await superAdminService.startBulkMessaging({
        campaignName: campaignForm.name,
        description: campaignForm.description,
        leadStatus: selectedLeadStatus, // Pass the selected lead status
        targetCount: leadsData[selectedLeadStatus]?.length || 0, // Pass target count
      });

      enqueueSnackbar(
        `Campaign "${campaignForm.name}" started successfully! Processing ${leadsData[selectedLeadStatus].length} interested leads.`,
        {
          variant: "success",
        }
      );

      setShowCreateDialog(false);
      setCampaignForm({ name: "", description: "" });

      // Refresh campaigns list
      setTimeout(() => {
        fetchCampaigns();
      }, 1000);
    } catch (error) {
      console.error("Error creating campaign:", error);
      enqueueSnackbar(error.message || "Failed to start campaign", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      await superAdminService.deleteCampaign(campaignId);
      enqueueSnackbar("Campaign deleted successfully", { variant: "success" });
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      enqueueSnackbar("Failed to delete campaign", { variant: "error" });
    }
  };

  // Toggle campaign expansion
  const toggleCampaignExpansion = (campaignId) => {
    setExpandedCampaigns((prev) => ({
      ...prev,
      [campaignId]: !prev[campaignId],
    }));
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "primary";
      case "completed":
        return "success";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  // Get log icon
  const getLogIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon color="success" fontSize="small" />;
      case "error":
        return <ErrorIcon color="error" fontSize="small" />;
      case "warning":
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  // Get log text color based on type
  const getLogTextColor = (type) => {
    switch (type) {
      case "success":
        return "success.main";
      case "error":
        return "error.main";
      case "warning":
        return "warning.main";
      default:
        return "text.primary";
    }
  };

  // Format timestamp - Handle Firestore timestamp objects properly
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const kampalaTimeOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Kampala", // Kampala timezone (UTC+3)
    };

    try {
      // Handle Firestore Timestamps with _seconds property (most common from API)
      if (typeof dateValue === "object" && dateValue._seconds) {
        const date = new Date(dateValue._seconds * 1000);
        return date.toLocaleString("en-US", kampalaTimeOptions);
      }

      // Handle Firestore Timestamps with seconds property (alternative format)
      if (typeof dateValue === "object" && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000);
        return date.toLocaleString("en-US", kampalaTimeOptions);
      }

      // Handle Firestore Timestamps with toDate method
      if (
        typeof dateValue === "object" &&
        dateValue.toDate &&
        typeof dateValue.toDate === "function"
      ) {
        return dateValue.toDate().toLocaleString("en-US", kampalaTimeOptions);
      }

      // Handle Date objects
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString("en-US", kampalaTimeOptions);
      }

      // Handle timestamp numbers
      if (typeof dateValue === "number") {
        return new Date(dateValue).toLocaleString("en-US", kampalaTimeOptions);
      }

      // Handle string dates - including Firestore string format like "4 June 2025 at 03:00:00 UTC+3"
      if (typeof dateValue === "string") {
        // First try direct parsing
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("en-US", kampalaTimeOptions);
        }

        // Handle Firestore string format: "4 June 2025 at 03:00:00 UTC+3"
        if (dateValue.includes(" at ")) {
          const [datePart, timePart] = dateValue.split(" at ");
          if (datePart && timePart) {
            const timeWithoutTimezone = timePart.split(" ")[0]; // Remove timezone part
            const combinedDateTime = `${datePart} ${timeWithoutTimezone}`;
            const parsedDate = new Date(combinedDateTime);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toLocaleString("en-US", kampalaTimeOptions);
            }
          }
        }

        // If we can't parse it, return the original string (but cleaned up)
        return dateValue.replace(" at ", " ").replace(/ UTC\+\d+/, "");
      }
    } catch (error) {
      console.error("Error formatting date:", error, "Value:", dateValue);
    }

    return "Invalid Date";
  };

  // Generate email content preview for interested leads
  const generateEmailContent = (leadName = "Prospective Student") => {
    const subject = "How's your IUEA application going? We're here to help! 🌟";

    const text = `Dear ${leadName},

We hope this email finds you well! 😊 We're just checking in to see how things are going with your IUEA application.

We understand that the application process can sometimes feel overwhelming, and we want you to know that we're here to support you every step of the way!

Need Help? We've Got You Covered! 🤝

If you're facing any challenges or have questions about:
- Application requirements or documents
- Tuition fees and payment options
- Accommodation and campus life
- Our academic programs
- Any other concerns

Please don't hesitate to reach out to us! Our admissions team is ready to assist you.

Remember, taking this step toward your education shows incredible determination, and we're excited to have you on this journey with us! 🌟

Continue your application: https://applicant.iuea.ac.ug/login

Feel free to reply to this email or call us directly if you need any assistance. We're here to help make your dream of joining IUEA a reality!

Wishing you all the best,
IUEA Admissions Team
International University of East Africa

Contact Information:
Phone: +256 706 026496
Email: apply@iuea.ac.ug
Website: www.iuea.ac.ug
Address: Kansanga, Kampala, Uganda`;

    return { subject, text };
  };

  // Generate WhatsApp message content preview
  const generateWhatsAppContent = () => {
    return `Hi there! 👋
Just checking in to see how things are going with your IUEA application.
We'd love to hear from you — if there's anything you need or any challenge you're facing, feel free to let us know. 😊
We're here to support you and are excited to have you on this journey! 🌟`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulk Actions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Send bulk emails and WhatsApp messages to leads at different stages
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Interested Leads"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
          <Tab
            label="In Review Leads"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
          <Tab
            label="Admitted Leads"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
          <Tab
            label="Enrolled Leads"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
          <Tab label="Campaigns" icon={<CampaignIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Interested Leads Tab */}
      <TabPanel value={tabValue} index={0}>
        <LeadStatusTab
          leads={leadsData.interested}
          statusName="interested"
          statusDisplayName="Interested"
          loading={loading}
          onRefresh={handleRefreshLeads}
          onStartCampaign={handleStartCampaign}
          onPreviewMessages={handlePreviewMessages}
          formatDate={formatDate}
        />
      </TabPanel>

      {/* In Review Leads Tab */}
      <TabPanel value={tabValue} index={1}>
        <LeadStatusTab
          leads={leadsData.in_review}
          statusName="in_review"
          statusDisplayName="In Review"
          loading={loading}
          onRefresh={handleRefreshLeads}
          onStartCampaign={handleStartCampaign}
          onPreviewMessages={handlePreviewMessages}
          formatDate={formatDate}
        />
      </TabPanel>

      {/* Admitted Leads Tab */}
      <TabPanel value={tabValue} index={2}>
        <LeadStatusTab
          leads={leadsData.admitted}
          statusName="admitted"
          statusDisplayName="Admitted"
          loading={loading}
          onRefresh={handleRefreshLeads}
          onStartCampaign={handleStartCampaign}
          onPreviewMessages={handlePreviewMessages}
          formatDate={formatDate}
        />
      </TabPanel>

      {/* Enrolled Leads Tab */}
      <TabPanel value={tabValue} index={3}>
        <LeadStatusTab
          leads={leadsData.enrolled}
          statusName="enrolled"
          statusDisplayName="Enrolled"
          loading={loading}
          onRefresh={handleRefreshLeads}
          onStartCampaign={handleStartCampaign}
          onPreviewMessages={handlePreviewMessages}
          formatDate={formatDate}
        />
      </TabPanel>

      {/* Campaigns Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Campaign History</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCampaigns}
            disabled={campaignLoading}
          >
            Refresh
          </Button>
        </Box>

        {campaignLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : campaigns.length === 0 ? (
          <Alert severity="info">
            No campaigns found. Start your first bulk messaging campaign from
            any of the lead status tabs.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} key={campaign.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6">{campaign.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {campaign.description || "No description"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <Chip
                          label={campaign.status}
                          color={getStatusColor(campaign.status)}
                          variant="outlined"
                        />
                        <IconButton
                          onClick={() => toggleCampaignExpansion(campaign.id)}
                          size="small"
                        >
                          {expandedCampaigns[campaign.id] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Campaign Progress */}
                    {campaign.status === "running" && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Processing...
                        </Typography>
                        <LinearProgress />
                      </Box>
                    )}

                    {/* Campaign Stats */}
                    {campaign.results && (
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="primary">
                              {campaign.results.totalLeads || 0}
                            </Typography>
                            <Typography variant="caption">
                              Total Leads
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="success.main">
                              {campaign.results.emailsSent || 0}
                            </Typography>
                            <Typography variant="caption">
                              Emails Sent
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="success.main">
                              {campaign.results.whatsappSent || 0}
                            </Typography>
                            <Typography variant="caption">
                              WhatsApp Sent
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="error.main">
                              {(campaign.results.emailsFailed || 0) +
                                (campaign.results.whatsappFailed || 0)}
                            </Typography>
                            <Typography variant="caption">Failed</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    )}

                    {/* Campaign Details */}
                    <Typography variant="body2" color="text.secondary">
                      Started: {formatDate(campaign.startedAt)}
                      {campaign.completedAt && (
                        <> • Completed: {formatDate(campaign.completedAt)}</>
                      )}
                    </Typography>

                    {/* Expanded Content */}
                    <Collapse in={expandedCampaigns[campaign.id]}>
                      <Divider sx={{ my: 2 }} />

                      {/* Campaign Logs */}
                      <Typography variant="h6" gutterBottom>
                        Campaign Logs
                      </Typography>

                      {campaign.logs && campaign.logs.length > 0 ? (
                        <Paper
                          variant="outlined"
                          sx={{
                            maxHeight: 300,
                            overflow: "auto",
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <List dense>
                            {campaign.logs
                              .slice()
                              .reverse()
                              .map((log, index) => (
                                <ListItem
                                  key={index}
                                  sx={{
                                    borderLeft: "3px solid",
                                    borderLeftColor:
                                      log.type === "error"
                                        ? "error.main"
                                        : log.type === "success"
                                        ? "success.main"
                                        : log.type === "warning"
                                        ? "warning.main"
                                        : "info.main",
                                    mb: 0.5,
                                    bgcolor:
                                      log.type === "error"
                                        ? "error.50"
                                        : "transparent",
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    {getLogIcon(log.type)}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: getLogTextColor(log.type),
                                          fontWeight:
                                            log.type === "error"
                                              ? "bold"
                                              : "normal",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        {log.message}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {formatDate(log.timestamp)}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                          </List>
                        </Paper>
                      ) : (
                        <Alert severity="info">
                          No logs available for this campaign
                        </Alert>
                      )}
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Preview Messages Dialog */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PreviewIcon />
              Message Preview -{" "}
              {selectedLeadStatus.charAt(0).toUpperCase() +
                selectedLeadStatus.slice(1)}{" "}
              Leads
            </Box>
            <IconButton
              onClick={() => setShowPreviewDialog(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            This is a preview of the email and WhatsApp messages that will be
            sent to {leadsData[selectedLeadStatus]?.length || 0}{" "}
            {selectedLeadStatus} leads.
          </Alert>

          {/* Email Preview */}
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <EmailIcon />
              <Typography variant="h6">Email Message</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                Subject: {generateEmailContent().subject}
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  maxHeight: 300,
                  overflow: "auto",
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {generateEmailContent("John Doe").text}
              </Typography>
            </Box>
          </Paper>

          {/* WhatsApp Preview */}
          <Paper variant="outlined">
            <Box
              sx={{
                p: 2,
                bgcolor: "success.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WhatsAppIcon />
              <Typography variant="h6">WhatsApp Message</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "text.secondary" }}
              >
                Template: application_followup_iuea
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  bgcolor: "#e8f5e8",
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid #c8e6c9",
                }}
              >
                {generateWhatsAppContent()}
              </Typography>
            </Box>
          </Paper>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The actual messages will be personalized
              with each lead's name and sent according to their contact
              preferences. Both email and WhatsApp messages will be sent to
              leads who have the respective contact information.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>
            Close Preview
          </Button>
          <Button
            onClick={() => {
              setShowPreviewDialog(false);
              handleStartCampaign(selectedLeadStatus);
            }}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={leadsData[selectedLeadStatus]?.length === 0}
          >
            Start Campaign with These Messages
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PlayArrowIcon />
            Start Bulk Messaging Campaign
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            This will send emails and WhatsApp messages to all{" "}
            {leadsData[selectedLeadStatus]?.length || 0} {selectedLeadStatus}{" "}
            leads. This action cannot be undone.
          </Alert>

          {selectedLeadStatus !== "interested" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Currently, only "interested" leads
                campaigns are fully implemented. Other lead statuses will be
                supported in future updates.
              </Typography>
            </Alert>
          )}

          <TextField
            fullWidth
            label="Campaign Name"
            value={campaignForm.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            margin="normal"
            required
            placeholder={`e.g., ${
              selectedLeadStatus.charAt(0).toUpperCase() +
              selectedLeadStatus.slice(1)
            } Leads Follow-up - ${new Date().toLocaleDateString()}`}
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={campaignForm.description}
            onChange={(e) => handleFormChange("description", e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder={`Follow-up campaign for ${selectedLeadStatus} leads to encourage application completion`}
          />

          {leadsData[selectedLeadStatus]?.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Target Audience:</strong>{" "}
                {leadsData[selectedLeadStatus].length} leads with "
                {selectedLeadStatus.toUpperCase()}" status
              </Typography>
              <Typography variant="body2">
                <strong>Messages to send:</strong> Personalized email + WhatsApp
                follow-up
              </Typography>
              <Typography variant="body2">
                <strong>Campaign Type:</strong>{" "}
                {selectedLeadStatus === "interested"
                  ? "✅ Fully Supported"
                  : "⚠️ Limited Support"}
              </Typography>
            </Alert>
          )}

          {(!leadsData[selectedLeadStatus] ||
            leadsData[selectedLeadStatus].length === 0) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>No leads found!</strong> There are no leads with "
                {selectedLeadStatus.toUpperCase()}" status. Please select a
                different status or wait for new leads to arrive.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCampaign}
            variant="contained"
            disabled={
              loading ||
              !campaignForm.name.trim() ||
              !leadsData[selectedLeadStatus] ||
              leadsData[selectedLeadStatus].length === 0
            }
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading
              ? "Starting..."
              : selectedLeadStatus === "interested"
              ? "Start Interested Leads Campaign"
              : `Start ${
                  selectedLeadStatus.charAt(0).toUpperCase() +
                  selectedLeadStatus.slice(1)
                } Campaign (Not Available)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkActions;
