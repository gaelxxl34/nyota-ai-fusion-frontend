import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Alert,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  ContactMail as ContactMailIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { leadService } from "../../services/leadService";
import { useAuth } from "../../contexts/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { PERMISSIONS, LEAD_STAGES } from "../../config/roles.config";
import InquiryContactDialog from "../../components/InquiryContactDialog";
import ApplicationFormDialog from "../../components/applications/ApplicationFormDialog";

const DataCenter = () => {
  const { checkPermission, filterLeadsByRole, checkLeadStageAccess } =
    useRolePermissions();
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    byStatus: {},
    bySource: {},
  });
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  // const { } = useAuth(); // Keep for future use

  // Define lead status categories for tabs
  const leadStatusTabs = [
    {
      label: "All Leads",
      statuses: [
        "INQUIRY",
        "CONTACTED",
        "PRE_QUALIFIED",
        "QUALIFIED",
        "APPLIED",
        "ADMITTED",
        "ENROLLED",
        "REJECTED",
        "NURTURE",
      ],
      icon: ContactMailIcon,
      color: "primary",
    },
    {
      label: "Contacted",
      statuses: ["CONTACTED", "NURTURE"],
      icon: WhatsAppIcon,
      color: "info",
    },
    {
      label: "Interested",
      statuses: ["PRE_QUALIFIED"],
      icon: AssessmentIcon,
      color: "warning",
    },
    {
      label: "Applied",
      statuses: ["APPLIED"],
      icon: AssignmentIcon,
      color: "info",
    },
    {
      label: "Qualified",
      statuses: ["QUALIFIED"],
      icon: SchoolIcon,
      color: "success",
    },
    {
      label: "Admitted",
      statuses: ["ADMITTED"],
      icon: PersonAddIcon,
      color: "success",
    },
    {
      label: "Enrolled",
      statuses: ["ENROLLED"],
      icon: SchoolIcon,
      color: "success",
    },
  ];

  // Filter tabs based on user role - only show tabs for stages they have access to
  const getFilteredTabs = () => {
    console.log("🔑 Permission check for user:", userRole);

    return leadStatusTabs
      .filter((tab) => {
        // All Leads tab - filter statuses based on access
        if (tab.label === "All Leads") {
          const accessibleStatuses = tab.statuses.filter((status) => {
            const hasAccess = checkLeadStageAccess(status);
            console.log(`  - Checking ${status}: ${hasAccess}`);
            return hasAccess;
          });
          return accessibleStatuses.length > 0;
        }

        // Other tabs - check if user has access to any of the statuses
        const hasAccess = tab.statuses.some((status) => {
          const access = checkLeadStageAccess(status);
          console.log(`  - Tab ${tab.label}, Status ${status}: ${access}`);
          return access;
        });
        return hasAccess;
      })
      .map((tab) => {
        // For All Leads tab, filter the statuses
        if (tab.label === "All Leads") {
          return {
            ...tab,
            statuses: tab.statuses.filter((status) =>
              checkLeadStageAccess(status)
            ),
          };
        }
        return tab;
      });
  };

  const filteredTabs = getFilteredTabs();

  // Debug logging
  console.log("🔍 DataCenter Debug:", {
    userRole,
    allTabsCount: leadStatusTabs.length,
    filteredTabsCount: filteredTabs.length,
    filteredTabs: filteredTabs.map((t) => t.label),
    leadsCount: leads.length,
    leadStatuses: [...new Set(leads.map((l) => l.status))],
  });

  // Fetch data from backend with pagination
  const fetchData = useCallback(
    async (loadMore = false) => {
      try {
        if (!loadMore) {
          setLoading(true);
          setError("");
        }

        const currentOffset = loadMore ? leads.length : 0;
        const limit = 25; // Reduced page size for better performance

        console.log(
          `📊 DataCenter: Fetching data (loadMore: ${loadMore}, offset: ${currentOffset})`
        );

        // Fetch leads and applications with pagination
        const [leadsResponse, applicationsResponse, statsResponse] =
          await Promise.all([
            leadService.getAllLeads({
              limit,
              offset: currentOffset,
              sortBy: "createdAt",
              sortOrder: "desc",
            }),
            currentOffset === 0
              ? leadService.getApplications({ limit: 50 })
              : Promise.resolve({ data: [] }),
            currentOffset === 0
              ? leadService.getLeadStats()
              : Promise.resolve(leadStats),
          ]);

        const newLeads = leadsResponse.data || [];
        const hasMore = leadsResponse.pagination?.hasMore || false;

        console.log(
          `📊 DataCenter: Received ${newLeads.length} leads, hasMore: ${hasMore}`
        );

        if (loadMore) {
          // Append new leads to existing ones
          setLeads((prevLeads) => [...prevLeads, ...newLeads]);
        } else {
          // Replace leads with new data
          setLeads(newLeads);
          setApplications(applicationsResponse.data || []);
          setLeadStats(
            statsResponse.data || { total: 0, byStatus: {}, bySource: {} }
          );
        }

        setHasMoreLeads(hasMore);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [leads.length, leadStats]
  );

  // Load more leads function
  const loadMoreLeads = useCallback(async () => {
    if (!loading && hasMoreLeads) {
      console.log("📊 DataCenter: Loading more leads...");
      await fetchData(true);
    }
  }, [loading, hasMoreLeads, fetchData]);

  useEffect(() => {
    fetchData();

    // Reduced auto-refresh interval from 30s to 60s and only refresh first page
    const interval = setInterval(() => {
      console.log("🔄 DataCenter: Auto-refreshing first page...");
      fetchData(false);
    }, 60000); // Increased to 60 seconds

    return () => clearInterval(interval);
  }, []); // Remove fetchData dependency to prevent excessive refreshes

  // Get leads for current tab
  const getCurrentTabLeads = () => {
    const currentTabConfig = filteredTabs[currentTab];
    if (!currentTabConfig) return [];

    // Filter leads by tab statuses
    return leads.filter((lead) => {
      // Check if lead matches the tab's statuses
      return currentTabConfig.statuses.includes(lead.status);
    });
  };

  // Get stats cards based on user role
  const getVisibleStatsCards = () => {
    const allCards = [
      {
        key: "total",
        status: null,
        label: "Total Leads",
        icon: PersonAddIcon,
        color: "primary",
      },
      {
        key: "interested",
        status: "PRE_QUALIFIED",
        label: "Interested",
        icon: ContactMailIcon,
        color: "warning",
      },
      {
        key: "qualified",
        status: "QUALIFIED",
        label: "Qualified",
        icon: AssessmentIcon,
        color: "success",
      },
      {
        key: "applied",
        status: "APPLIED",
        label: "Applied",
        icon: SchoolIcon,
        color: "info",
      },
      {
        key: "contacted",
        status: "CONTACTED",
        label: "Contacted",
        icon: WhatsAppIcon,
        color: "info",
      },
      {
        key: "admitted",
        status: "ADMITTED",
        label: "Admitted",
        icon: SchoolIcon,
        color: "success",
      },
      {
        key: "enrolled",
        status: "ENROLLED",
        label: "Enrolled",
        icon: SchoolIcon,
        color: "primary",
      },
    ];

    switch (userRole) {
      case "marketingAgent":
        // Marketing agents don't see admitted/enrolled stats
        return allCards.filter(
          (card) => !["admitted", "enrolled"].includes(card.key)
        );
      case "admissionsAgent":
        // Admissions agents don't see interested/contacted stats
        return allCards.filter(
          (card) => !["interested", "contacted"].includes(card.key)
        );
      case "organizationAdmin":
      default:
        return allCards;
    }
  };

  // Get funnel stages based on user role
  const getVisibleFunnelStages = () => {
    const allStages = [
      {
        key: "inquiry",
        status: "INQUIRY",
        label: "Inquiry",
        color: "default",
        subtitle: "Initial Interest",
      },
      {
        key: "contacted",
        status: "CONTACTED",
        label: "Contacted",
        color: "info",
        subtitle: "First Contact",
      },
      {
        key: "interested",
        status: "PRE_QUALIFIED",
        label: "Interested",
        color: "warning",
        subtitle: "Shows Interest",
      },
      {
        key: "applied",
        status: "APPLIED",
        label: "Applied",
        color: "info",
        subtitle: "Submitted App",
      },
      {
        key: "qualified",
        status: "QUALIFIED",
        label: "Qualified",
        color: "success",
        subtitle: "Meets Requirements",
      },
      {
        key: "admitted",
        status: "ADMITTED",
        label: "Admitted",
        color: "secondary",
        subtitle: "Officially Admitted",
      },
      {
        key: "enrolled",
        status: "ENROLLED",
        label: "Enrolled",
        color: "primary",
        subtitle: "Final Goal",
      },
    ];

    switch (userRole) {
      case "marketingAgent":
        // Marketing agents see up to qualified
        return allStages.filter(
          (stage) => !["admitted", "enrolled"].includes(stage.key)
        );
      case "admissionsAgent":
        // Admissions agents see from applied onwards
        return allStages.filter(
          (stage) => !["inquiry", "contacted", "interested"].includes(stage.key)
        );
      case "organizationAdmin":
      default:
        return allStages;
    }
  };

  // Filter data based on search term
  const filteredLeads = getCurrentTabLeads().filter(
    (lead) =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keep applications filtering for future use
  // const filteredApplications = applications.filter(
  //   (app) =>
  //     app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.program?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Get count for each tab
  const getTabCount = (statuses) => {
    return leads.filter((lead) => statuses.includes(lead.status)).length;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "INQUIRY":
        return "primary";
      case "CONTACTED":
        return "info";
      case "PRE_QUALIFIED":
        return "warning";
      case "APPLIED":
        return "info";
      case "QUALIFIED":
        return "success";
      case "ADMITTED":
        return "secondary";
      case "ENROLLED":
        return "success";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    let date;

    // Handle Firestore timestamp objects
    if (dateString && typeof dateString === "object" && dateString._seconds) {
      // Firestore timestamp with _seconds and _nanoseconds
      date = new Date(
        dateString._seconds * 1000 + (dateString._nanoseconds || 0) / 1000000
      );
    } else if (
      dateString &&
      typeof dateString === "object" &&
      dateString.toDate
    ) {
      // Firestore timestamp with toDate() method
      date = dateString.toDate();
    } else {
      // Regular string or Date object
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format as time dd/mm/yy as requested
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Handler for when a new inquiry contact is created
  const handleContactCreated = (result) => {
    // Extract lead data from the result object
    const newLead = result.lead || result;

    // Add the new lead to the leads list
    setLeads((prevLeads) => [
      {
        id: newLead.id,
        ...newLead,
        createdAt: newLead.createdAt || new Date().toISOString(),
      },
      ...prevLeads,
    ]);

    // Optionally refetch data to ensure consistency
    fetchData();
  };

  // Handler for when a new application is submitted
  const handleApplicationSubmitted = (result) => {
    // Extract application and lead data from the result
    const newApplication = result.application;
    const updatedLead = result.lead;

    // Add/update the lead in the leads list
    if (updatedLead) {
      setLeads((prevLeads) => {
        const existingIndex = prevLeads.findIndex(
          (lead) => lead.id === updatedLead.id
        );
        if (existingIndex >= 0) {
          // Update existing lead
          const updatedLeads = [...prevLeads];
          updatedLeads[existingIndex] = {
            ...updatedLeads[existingIndex],
            ...updatedLead,
            updatedAt: new Date().toISOString(),
          };
          return updatedLeads;
        } else {
          // Add new lead
          return [
            {
              id: updatedLead.id,
              ...updatedLead,
              createdAt: updatedLead.createdAt || new Date().toISOString(),
            },
            ...prevLeads,
          ];
        }
      });
    }

    // Add new application to applications list
    if (newApplication) {
      setApplications((prevApplications) => [
        {
          id: newApplication.id,
          ...newApplication,
          submittedAt: newApplication.submittedAt || new Date().toISOString(),
        },
        ...prevApplications,
      ]);
    }

    // Refetch data to ensure consistency
    fetchData();
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`data-center-tabpanel-${index}`}
        aria-labelledby={`data-center-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Data Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all incoming inquiry forms and admission applications from
          webhooks
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lead Status Statistics Cards */}
      {!loading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {getVisibleStatsCards().map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.key}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <card.icon color={card.color} sx={{ mr: 1 }} />
                    <Typography
                      variant="h6"
                      color={`${card.color}${
                        card.color === "primary" ? "" : ".main"
                      }`}
                    >
                      {card.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{ fontWeight: "bold" }}
                  >
                    {card.status
                      ? leadStats.byStatus[card.status] || 0
                      : leadStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.key === "total" && "All prospects in system"}
                    {card.key === "interested" && "Showing interest"}
                    {card.key === "qualified" && "Ready for admission"}
                    {card.key === "applied" && "Submitted applications"}
                    {card.key === "contacted" && "Initial contact made"}
                    {card.key === "admitted" && "Accepted for admission"}
                    {card.key === "enrolled" && "Successfully enrolled"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Conversion Funnel Overview */}
      {!loading && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lead Conversion Funnel
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Track prospects through the key stages of the enrollment process
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                {getVisibleFunnelStages().map((stage, index) => (
                  <React.Fragment key={stage.key}>
                    <Box sx={{ textAlign: "center", minWidth: 100 }}>
                      <Chip
                        label={`${stage.label}: ${
                          leadStats.byStatus[stage.status] || 0
                        }`}
                        color={stage.color}
                        variant={
                          stage.key === "enrolled" ? "filled" : "outlined"
                        }
                        sx={{ mb: 1, width: "100%" }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {stage.subtitle}
                      </Typography>
                    </Box>
                    {index < getVisibleFunnelStages().length - 1 && (
                      <Typography variant="h6" color="text.secondary">
                        →
                      </Typography>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "primary.light",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="primary.contrastText"
                  sx={{ fontWeight: "bold" }}
                >
                  {leadStats.total > 0
                    ? Math.round(
                        ((leadStats.byStatus.ENROLLED || 0) / leadStats.total) *
                          100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  Overall Conversion Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <>
          {/* Statistics Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        sx={{ mr: 1 }}
                      />
                      <Skeleton variant="text" width="60%" height={24} />
                    </Box>
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="50%" height={16} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Main Content Skeleton */}
          <Paper sx={{ width: "100%", mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Skeleton variant="rectangular" width="100%" height={48} />
            </Box>
            <Box sx={{ p: 3 }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />

              {/* Search bar skeleton */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Skeleton variant="rectangular" width={300} height={40} />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Skeleton variant="rectangular" width={180} height={36} />
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="rectangular" width={80} height={36} />
                </Box>
              </Box>

              {/* Table skeleton */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {[1, 2, 3, 4, 5, 6].map((col) => (
                        <TableCell key={col}>
                          <Skeleton variant="text" width="80%" height={20} />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <TableRow key={row}>
                        {[1, 2, 3, 4, 5, 6].map((col) => (
                          <TableCell key={col}>
                            <Skeleton variant="text" width="90%" height={20} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ContactMailIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Contact Forms</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {leads.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total leads
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <SchoolIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Enrolled Students</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {leadStats.byStatus.ENROLLED || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully enrolled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <PersonAddIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">New Inquiries</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {leads.filter((lead) => lead.status === "INQUIRY").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    To be contacted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <AssessmentIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Conversion Rate</Typography>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {leads.length > 0
                      ? Math.round((applications.length / leads.length) * 100)
                      : 0}
                    %
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inquiry to Enrollment
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main Content */}
          <Paper sx={{ width: "100%", mb: 2 }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={currentTab}
                onChange={(event, newValue) => setCurrentTab(newValue)}
                aria-label="data center tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                {filteredTabs.map((tab, index) => {
                  const TabIcon = tab.icon;
                  const count = getTabCount(tab.statuses);

                  return (
                    <Tab
                      key={index}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <TabIcon fontSize="small" />
                          <Badge badgeContent={count} color={tab.color}>
                            {tab.label}
                          </Badge>
                        </Box>
                      }
                      id={`data-center-tab-${index}`}
                      aria-controls={`data-center-tabpanel-${index}`}
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Tab Content */}
            {filteredTabs.map((tab, index) => (
              <TabPanel key={index} value={currentTab} index={index}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <tab.icon />
                    {tab.label} ({getTabCount(tab.statuses)})
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {tab.label === "All Leads" &&
                      "Overview of all leads in the system across all stages"}
                    {tab.label === "Interested" &&
                      "Leads that have shown interest and are ready for further engagement"}
                    {tab.label === "Applied" &&
                      "Leads who have submitted formal applications"}
                    {tab.label === "Qualified" &&
                      "Leads who have met all qualification requirements"}
                    {tab.label === "Admitted" &&
                      "Students who have been officially admitted to programs"}
                    {tab.label === "Enrolled" &&
                      "Students who have completed enrollment and are active"}
                    {tab.label === "Contacted" &&
                      "Leads that have been contacted and are in nurturing process"}
                  </Typography>

                  {/* Search and Actions */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <TextField
                      placeholder="Search by name, email, phone, program..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ minWidth: 350 }}
                    />
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => setInquiryDialogOpen(true)}
                        color="success"
                      >
                        Add New Lead
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AssignmentIcon />}
                        onClick={() => setApplicationDialogOpen(true)}
                        color="primary"
                      >
                        Application Form
                      </Button>
                      <IconButton onClick={fetchData} title="Refresh Data">
                        <RefreshIcon />
                      </IconButton>
                      {checkPermission(PERMISSIONS.EXPORT_DATA) && (
                        <Button variant="outlined" startIcon={<DownloadIcon />}>
                          Export
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Leads Table */}
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Contact Info</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Program</TableCell>
                          <TableCell>Created Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              {Array.from({ length: 7 }).map((_, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  <Skeleton height={20} />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : filteredLeads.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {searchTerm
                                  ? "No leads found matching your search."
                                  : `No leads found in ${tab.label} category.`}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLeads.map((lead) => (
                            <TableRow key={lead.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {lead.name || "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {lead.email || "N/A"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {lead.phone || lead.phoneNumber || "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={lead.source || "Unknown"}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {lead.program || "Not specified"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(lead.createdAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={lead.status}
                                  color={getStatusColor(lead.status)}
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton size="small" title="View Details">
                                    <ViewIcon />
                                  </IconButton>
                                  {[
                                    "INQUIRY",
                                    "CONTACTED",
                                    "PRE_QUALIFIED",
                                  ].includes(lead.status) && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={<WhatsAppIcon />}
                                      color="success"
                                    >
                                      Contact
                                    </Button>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Load More Button */}
                  {hasMoreLeads && !loading && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                        mb: 2,
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={loadMoreLeads}
                        disabled={loading}
                        startIcon={
                          loading ? <CircularProgress size={16} /> : null
                        }
                      >
                        {loading ? "Loading..." : `Load More Leads`}
                      </Button>
                    </Box>
                  )}

                  {!hasMoreLeads && leads.length > 25 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        All leads loaded ({leads.length} total)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </TabPanel>
            ))}
          </Paper>
        </>
      )}

      {/* Inquiry Contact Dialog */}
      <InquiryContactDialog
        open={inquiryDialogOpen}
        onClose={() => setInquiryDialogOpen(false)}
        onSuccess={handleContactCreated}
      />

      {/* Application Form Dialog */}
      <ApplicationFormDialog
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onSuccess={handleApplicationSubmitted}
      />
    </Box>
  );
};

export default DataCenter;
