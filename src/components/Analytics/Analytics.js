import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Skeleton,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Grid,
} from "@mui/material";
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Insights as InsightsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

// Import custom hooks
import useAnalyticsData from "../../hooks/useAnalyticsData";

// Import services
import { leadService } from "../../services/leadService";
import { teamService } from "../../services/teamService";
import { analyticsService } from "../../services/analyticsService";

// Import tab components
import AdmissionsTab from "../../components/Analytics/tabs/AdmissionsTab";
import LeadAssignmentsTab from "../../components/Analytics/tabs/LeadAssignmentsTab";
import InsightsTab from "../../components/Analytics/tabs/InsightsTab";

// Permission and role checking
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { PERMISSIONS } from "../../config/roles.config";

const Analytics = () => {
  // Always call useRolePermissions hook - hooks must be called unconditionally
  const { checkPermission } = useRolePermissions();

  // Check permission safely, with fallback if the hook fails
  let hasAnalyticsPermission = true; // Default to true
  try {
    hasAnalyticsPermission = checkPermission(PERMISSIONS.ANALYTICS);
  } catch (error) {
    console.warn("Could not check permissions, defaulting to allowed:", error);
    hasAnalyticsPermission = true;
  }

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [showLeadsList, setShowLeadsList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [leadsList, setLeadsList] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Custom hook for analytics data
  const { analytics, loading, error, refreshAnalytics } = useAnalyticsData(
    leadService,
    teamService,
    analyticsService
  );

  // Provide fallback data in case of errors
  const safeAnalytics = {
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    interestedLeads: 0,
    appliedLeads: 0,
    enrolledLeads: 0,
    notInterestedLeads: 0,
    onHoldLeads: 0,
    totalPrograms: 0,
    activeTeams: 0,
    totalTeamMembers: 0,
    ...analytics, // Override with actual data if available
  };

  // Handle status card clicks to show leads list
  const handleStatusClick = useCallback(async (statusCode) => {
    if (!statusCode || statusCode === "all") return;

    setSelectedStatus(statusCode);
    setShowLeadsList(true);
    setLeadsLoading(true);

    try {
      const response = await leadService.getLeads();
      const leads = response.data || [];

      // Filter leads by status
      const filteredLeads =
        statusCode === "all"
          ? leads
          : leads.filter((lead) => lead.status === statusCode);

      setLeadsList(filteredLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeadsList([]);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  // Filter leads by search term
  const filteredLeadsList = leadsList.filter(
    (lead) =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)
  );

  // Permission check
  if (!hasAnalyticsPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You don't have permission to view analytics.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
          <Divider />
        </Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">Loading analytics data...</Typography>
        </Alert>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton
                variant="rectangular"
                height={120}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Analytics Dashboard
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton onClick={refreshAnalytics} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: "primary.light",
          color: "primary.contrastText",
          "& .MuiAlert-icon": { color: "primary.contrastText" },
        }}
      >
        <Typography variant="body2">
          <strong>💡 Tip:</strong> Click on status cards to view detailed lead
          lists. Check the Lead Assignments tab for team performance tracking
          and interaction metrics.
        </Typography>
      </Alert>

      {error && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <IconButton onClick={refreshAnalytics} color="inherit" size="small">
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Don't worry - we're showing you the available data below. Click the
            refresh button to try loading fresh data.
          </Typography>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              minWidth: 120,
              fontWeight: 500,
            },
            "& .Mui-selected": {
              color: "primary.main",
              fontWeight: 600,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
            },
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            },
          }}
          aria-label="Analytics dashboard tabs"
        >
          <Tab
            icon={<PeopleIcon />}
            label="Lead Assignments"
            id="analytics-tab-0"
            aria-controls="analytics-tabpanel-0"
          />
          <Tab
            icon={<SchoolIcon />}
            label="Admissions"
            id="analytics-tab-1"
            aria-controls="analytics-tabpanel-1"
          />
          <Tab
            icon={<InsightsIcon />}
            label="Insights"
            id="analytics-tab-2"
            aria-controls="analytics-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box
        role="tabpanel"
        hidden={activeTab !== 0}
        id="analytics-tabpanel-0"
        aria-labelledby="analytics-tab-0"
      >
        {activeTab === 0 && (
          <LeadAssignmentsTab
            teamService={teamService}
            analytics={safeAnalytics}
            refreshAnalytics={refreshAnalytics}
          />
        )}
      </Box>

      <Box
        role="tabpanel"
        hidden={activeTab !== 1}
        id="analytics-tabpanel-1"
        aria-labelledby="analytics-tab-1"
      >
        {activeTab === 1 && (
          <AdmissionsTab
            analytics={safeAnalytics}
            onStatusClick={handleStatusClick}
            leadService={leadService}
          />
        )}
      </Box>

      <Box
        role="tabpanel"
        hidden={activeTab !== 2}
        id="analytics-tabpanel-2"
        aria-labelledby="analytics-tab-2"
      >
        {activeTab === 2 && (
          <InsightsTab
            analytics={safeAnalytics}
            assignmentData={[]} // This would be passed from a hook if needed
          />
        )}
      </Box>

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
                Leads List - {selectedStatus.replace(/_/g, " ").toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredLeadsList.length} leads found
              </Typography>
            </Box>
            <IconButton onClick={() => setShowLeadsList(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search leads by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {leadsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Lead</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeadsList.map((lead) => (
                    <TableRow key={lead._id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "primary.main",
                            }}
                          >
                            {lead.name?.charAt(0) || "L"}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {lead.name || "Unknown"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{lead.email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {lead.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {typeof lead.program === "object" &&
                          lead.program?.name
                            ? lead.program.name
                            : lead.program || "Not specified"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            typeof lead.status === "object" && lead.status?.name
                              ? lead.status.name.replace(/_/g, " ")
                              : lead.status?.replace(/_/g, " ") || "new"
                          }
                          size="small"
                          color={
                            (typeof lead.status === "object"
                              ? lead.status?.code
                              : lead.status) === "enrolled"
                              ? "success"
                              : (typeof lead.status === "object"
                                  ? lead.status?.code
                                  : lead.status) === "applied"
                              ? "primary"
                              : (typeof lead.status === "object"
                                  ? lead.status?.code
                                  : lead.status) === "interested"
                              ? "warning"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredLeadsList.length === 0 && !leadsLoading && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No leads found for the selected criteria.
                  </Typography>
                </Box>
              )}
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowLeadsList(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Analytics;
