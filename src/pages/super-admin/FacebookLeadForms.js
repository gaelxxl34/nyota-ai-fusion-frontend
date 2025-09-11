import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Collapse,
  TextField,
  FormControl,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Popover,
  Divider,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Facebook as FacebookIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Archive as ArchiveIcon,
  GetApp as GetAppIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";
import {
  FormFilterPopover,
  FormDetailsDialog,
} from "../../components/FacebookLeadForms";

const FacebookLeadForms = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [fetchingAllLeads, setFetchingAllLeads] = useState(false);
  const [showAllLeads, setShowAllLeads] = useState(true);
  const [formsData, setFormsData] = useState({
    pages: [],
    leadForms: [],
    adAccounts: [],
    campaigns: [],
    totalLeads: 0,
    activeForms: 0,
    recentLeads: [],
  });
  const [selectedForm, setSelectedForm] = useState(null);
  const [formDialog, setFormDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedPages, setExpandedPages] = useState({});

  // Date filtering state
  const [dateFilter, setDateFilter] = useState("all"); // all, today, yesterday, last7days, last14days, last30days, thisMonth, custom
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [dateFilterAnchorEl, setDateFilterAnchorEl] = useState(null);
  const [filteredLeads, setFilteredLeads] = useState([]);

  // Form name filtering state
  const [selectedFormNames, setSelectedFormNames] = useState([]);
  const [formFilterAnchorEl, setFormFilterAnchorEl] = useState(null);
  const [availableFormNames, setAvailableFormNames] = useState([]);

  // Apply date and form filtering to leads
  const applyFilters = useCallback(
    (leads, filter, customRange, selectedForms) => {
      if (!leads || leads.length === 0) {
        setFilteredLeads([]);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let filtered = [...leads];

      try {
        // Apply date filtering
        switch (filter) {
          case "today":
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              const leadDay = new Date(
                leadDate.getFullYear(),
                leadDate.getMonth(),
                leadDate.getDate()
              );
              return leadDay.getTime() === today.getTime();
            });
            break;

          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              const leadDay = new Date(
                leadDate.getFullYear(),
                leadDate.getMonth(),
                leadDate.getDate()
              );
              return leadDay.getTime() === yesterday.getTime();
            });
            break;

          case "last7days":
            const last7Days = new Date(today);
            last7Days.setDate(last7Days.getDate() - 7);
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              return leadDate >= last7Days && leadDate <= now;
            });
            break;

          case "last14days":
            const last14Days = new Date(today);
            last14Days.setDate(last14Days.getDate() - 14);
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              return leadDate >= last14Days && leadDate <= now;
            });
            break;

          case "last30days":
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 30);
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              return leadDate >= last30Days && leadDate <= now;
            });
            break;

          case "thisMonth":
            const firstDayOfMonth = new Date(
              now.getFullYear(),
              now.getMonth(),
              1
            );
            const lastDayOfMonth = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            );
            filtered = filtered.filter((lead) => {
              const leadDate = new Date(lead.created_time);
              return leadDate >= firstDayOfMonth && leadDate <= lastDayOfMonth;
            });
            break;

          case "custom":
            if (customRange.startDate && customRange.endDate) {
              const startDate = new Date(customRange.startDate);
              const endDate = new Date(customRange.endDate);
              endDate.setHours(23, 59, 59, 999); // Include the entire end date

              // Validate date range
              if (startDate <= endDate) {
                filtered = filtered.filter((lead) => {
                  const leadDate = new Date(lead.created_time);
                  return leadDate >= startDate && leadDate <= endDate;
                });
              } else {
                console.warn(
                  "Invalid date range: start date is after end date"
                );
                filtered = leads; // Return all leads if invalid range
              }
            } else {
              filtered = leads; // Return all leads if custom range is incomplete
            }
            break;

          case "all":
          default:
            // No date filtering
            break;
        }

        // Apply form name filtering
        if (selectedForms && selectedForms.length > 0) {
          filtered = filtered.filter((lead) =>
            selectedForms.includes(lead.formName)
          );
        }
      } catch (error) {
        console.error("Error applying filters:", error);
        filtered = leads; // Fallback to all leads on error
      }

      // Sort filtered leads by creation time (newest first)
      filtered.sort(
        (a, b) => new Date(b.created_time) - new Date(a.created_time)
      );

      setFilteredLeads(filtered);
    },
    []
  );

  // Fetch Facebook lead forms data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchFacebookLeadForms = useCallback(
    async (fetchAllLeads = false) => {
      try {
        console.log(
          `🔍 FacebookLeadForms: Fetching data from /api/super-admin/facebook-lead-forms (fetchAllLeads: ${fetchAllLeads})`
        );
        setError("");
        const response = await superAdminService.getFacebookLeadForms(
          fetchAllLeads
        );
        console.log("✅ FacebookLeadForms: Received response:", response);
        setFormsData(response);
        setShowAllLeads(fetchAllLeads);

        // Extract unique form names from the leads
        if (response.recentLeads && response.recentLeads.length > 0) {
          const uniqueFormNames = [
            ...new Set(
              response.recentLeads
                .map((lead) => lead.formName)
                .filter((name) => name && name.trim() !== "")
            ),
          ].sort();
          setAvailableFormNames(uniqueFormNames);
        }

        // Apply current filters to the new data
        applyFilters(
          response.recentLeads,
          dateFilter,
          customDateRange,
          selectedFormNames
        );
      } catch (err) {
        console.error("❌ FacebookLeadForms: Error fetching data:", err);
        setError(err.message || "Failed to fetch Facebook lead forms");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setFetchingAllLeads(false);
      }
    },
    [dateFilter, customDateRange, selectedFormNames, applyFilters]
  );

  // Handle date filter change
  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    applyFilters(
      formsData.recentLeads,
      newFilter,
      customDateRange,
      selectedFormNames
    );
  };

  // Handle custom date range change
  const handleCustomDateRangeChange = (field, value) => {
    const newRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newRange);

    if (dateFilter === "custom") {
      applyFilters(
        formsData.recentLeads,
        "custom",
        newRange,
        selectedFormNames
      );
    }
  };

  // Handle form name filter change
  const handleFormNameToggle = (formName) => {
    const newSelectedForms = selectedFormNames.includes(formName)
      ? selectedFormNames.filter((name) => name !== formName)
      : [...selectedFormNames, formName];

    setSelectedFormNames(newSelectedForms);
    applyFilters(
      formsData.recentLeads,
      dateFilter,
      customDateRange,
      newSelectedForms
    );
  };

  // Apply filters when leads data changes
  useEffect(() => {
    applyFilters(
      formsData.recentLeads,
      dateFilter,
      customDateRange,
      selectedFormNames
    );
  }, [
    formsData.recentLeads,
    applyFilters,
    dateFilter,
    customDateRange,
    selectedFormNames,
  ]);

  // Get date filter label
  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "last7days":
        return "Last 7 days";
      case "last14days":
        return "Last 14 days";
      case "last30days":
        return "Last 30 days";
      case "thisMonth":
        return "This month";
      case "custom":
        if (customDateRange.startDate && customDateRange.endDate) {
          return `${customDateRange.startDate} to ${customDateRange.endDate}`;
        }
        return "Custom";
      case "all":
      default:
        return "All time";
    }
  };

  // Get form filter label
  const getFormFilterLabel = () => {
    if (selectedFormNames.length === 0) {
      return "All Forms";
    } else if (selectedFormNames.length === 1) {
      return selectedFormNames[0];
    } else if (selectedFormNames.length === availableFormNames.length) {
      return "All Forms";
    } else {
      return `${selectedFormNames.length} Forms Selected`;
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setDateFilter("all");
    setSelectedFormNames([]);
    setCustomDateRange({ startDate: "", endDate: "" });
    applyFilters(
      formsData.recentLeads,
      "all",
      { startDate: "", endDate: "" },
      []
    );
  };

  // Export filtered leads to CSV
  const exportLeadsToCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to export");
      return;
    }

    // Helper function to safely escape CSV values
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // Escape double quotes by doubling them and wrap in quotes if contains comma, quote, or newline
      if (
        stringValue.includes('"') ||
        stringValue.includes(",") ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper function to find field value by name patterns
    const findFieldValue = (fieldData, patterns) => {
      const field = fieldData.find((field) =>
        patterns.some((pattern) =>
          field.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );
      return field?.value || "";
    };

    // Define comprehensive CSV headers including all custom fields
    const csvHeaders = [
      "Lead ID",
      "Form Name",
      "Name",
      "Email",
      "Phone",
      "Preferred Program",
      "Highest Level of Education Completed",
      "Are you transferring from another university?",
      "When would you like to come and complete your application?",
      "How will you pay your tuition fees?",
      "Created Date",
    ];

    const csvContent = filteredLeads
      .map((lead) => {
        const fieldData = formatFieldData(lead.field_data);

        // Extract standard contact fields
        const emailField = findFieldValue(fieldData, ["email"]);
        const phoneField = findFieldValue(fieldData, [
          "phone",
          "mobile",
          "telephone",
        ]);
        const firstNameField = findFieldValue(fieldData, [
          "first_name",
          "firstname",
          "first name",
        ]);
        const lastNameField = findFieldValue(fieldData, [
          "last_name",
          "lastname",
          "last name",
        ]);
        const fullNameField = findFieldValue(fieldData, [
          "full_name",
          "fullname",
          "full name",
          "name",
        ]);

        // Combine name fields intelligently
        let displayName = "";
        if (firstNameField || lastNameField) {
          // Prioritize combining first name + last name
          displayName = `${firstNameField} ${lastNameField}`.trim();
        } else if (fullNameField) {
          // Fall back to full name field if first/last names aren't available
          displayName = fullNameField;
        }

        // Extract custom fields for education/university questions
        const preferredProgramField = findFieldValue(fieldData, [
          "preferred program",
          "program",
          "course",
          "degree",
          "program of interest",
          "which program",
          "program_of_interest",
          "course_interest",
        ]);

        const educationLevelField = findFieldValue(fieldData, [
          "highest level of education",
          "education level",
          "education_level",
          "highest education",
          "education completed",
          "academic level",
          "qualification level",
          "previous education",
        ]);

        const transferringField = findFieldValue(fieldData, [
          "transferring",
          "transfer",
          "another university",
          "previous university",
          "are you transferring",
          "transfer student",
          "current university",
        ]);

        const applicationTimeField = findFieldValue(fieldData, [
          "when would you like",
          "application time",
          "start date",
          "enrollment date",
          "when do you want",
          "preferred start",
          "intake",
          "semester",
        ]);

        const paymentMethodField = findFieldValue(fieldData, [
          "pay tuition",
          "payment",
          "how will you pay",
          "tuition payment",
          "fee payment",
          "funding",
          "financial support",
          "payment method",
        ]);

        // Build the CSV row
        return [
          escapeCsvValue(lead.id),
          escapeCsvValue(lead.formName || ""),
          escapeCsvValue(displayName),
          escapeCsvValue(emailField),
          escapeCsvValue(phoneField),
          escapeCsvValue(preferredProgramField),
          escapeCsvValue(educationLevelField),
          escapeCsvValue(transferringField),
          escapeCsvValue(applicationTimeField),
          escapeCsvValue(paymentMethodField),
          escapeCsvValue(formatDate(lead.created_time)),
        ].join(",");
      })
      .join("\n");

    const csvData = csvHeaders.join(",") + "\n" + csvContent;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `facebook_leads_detailed_${getDateFilterLabel()
          .toLowerCase()
          .replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fetch all leads from all forms
  const fetchAllLeads = useCallback(async () => {
    try {
      console.log("🔍 FacebookLeadForms: Fetching ALL leads from all forms");
      setFetchingAllLeads(true);
      setError("");

      const response = await superAdminService.getAllFacebookLeads(1000);
      console.log("✅ FacebookLeadForms: Received all leads:", response);

      // Update the recentLeads with all leads
      const updatedFormsData = {
        ...formsData,
        recentLeads: response.leads || [],
      };
      setFormsData(updatedFormsData);
      setShowAllLeads(true);

      // Extract unique form names from all leads
      if (response.leads && response.leads.length > 0) {
        const uniqueFormNames = [
          ...new Set(
            response.leads
              .map((lead) => lead.formName)
              .filter((name) => name && name.trim() !== "")
          ),
        ].sort();
        setAvailableFormNames(uniqueFormNames);
      }

      // Apply current filters to the new data
      applyFilters(
        response.leads || [],
        dateFilter,
        customDateRange,
        selectedFormNames
      );
    } catch (err) {
      console.error("❌ FacebookLeadForms: Error fetching all leads:", err);
      setError(err.message || "Failed to fetch all Facebook leads");
    } finally {
      setFetchingAllLeads(false);
    }
  }, [formsData, applyFilters, dateFilter, customDateRange, selectedFormNames]);

  useEffect(() => {
    // Fetch all leads by default when component loads
    fetchFacebookLeadForms(true);
  }, [fetchFacebookLeadForms]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFacebookLeadForms(showAllLeads);
  };

  // Toggle between all leads and recent leads (20)
  const handleToggleAllLeads = () => {
    if (showAllLeads) {
      // Switch back to recent leads only (20)
      setRefreshing(true);
      fetchFacebookLeadForms(false);
    } else {
      // Fetch all leads
      fetchAllLeads();
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewForm = async (form) => {
    setSelectedForm(form);
    setFormDialog(true);

    // Note: Form stats can be fetched here if needed for the dialog
  };

  const togglePageExpansion = (pageId) => {
    setExpandedPages((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const getStatusChip = (status) => {
    const statusProps = {
      ACTIVE: { color: "success", icon: <CheckCircleIcon /> },
      ARCHIVED: { color: "default", icon: <ArchiveIcon /> },
      PAUSED: { color: "warning", icon: <ErrorIcon /> },
    };

    const props = statusProps[status] || { color: "default", icon: null };

    return (
      <Chip label={status} color={props.color} size="small" icon={props.icon} />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFieldData = (fieldData) => {
    if (!fieldData || !Array.isArray(fieldData)) return "N/A";

    return fieldData.map((field) => ({
      name: field.name,
      value: field.values?.[0] || "N/A",
    }));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Facebook Lead Forms...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <FacebookIcon sx={{ mr: 1, color: "#1877F2" }} />
            Facebook Lead Forms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor all Facebook lead forms connected to your
            campaigns
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #1877F2 30%, #42A5F5 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formsData.leadForms.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Forms
                  </Typography>
                </Box>
                <FacebookIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #4CAF50 30%, #81C784 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formsData.activeForms}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Forms
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeTab === 2 &&
                    (dateFilter !== "all" || selectedFormNames.length > 0)
                      ? filteredLeads.length.toLocaleString()
                      : formsData.totalLeads.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {activeTab === 2 &&
                    (dateFilter !== "all" || selectedFormNames.length > 0)
                      ? "Filtered Leads"
                      : "Total Leads"}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formsData.pages.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Facebook Pages
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Lead Forms (${formsData.leadForms.length})`} />
          <Tab label={`Pages (${formsData.pages.length})`} />
          <Tab
            label={`Recent Leads (${
              activeTab === 2 &&
              (dateFilter !== "all" || selectedFormNames.length > 0)
                ? filteredLeads.length
                : formsData.recentLeads.length
            })`}
          />
          <Tab label={`Campaigns (${formsData.campaigns.length})`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {formsData.leadForms.map((form) => (
            <Grid item xs={12} md={6} lg={4} key={form.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {form.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {form.pageName}
                      </Typography>
                    </Box>
                    {getStatusChip(form.status)}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Badge badgeContent={form.leads_count || 0} color="primary">
                      <PeopleIcon />
                    </Badge>
                    <Typography variant="body2">
                      {form.leads_count || 0} leads
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Created: {formatDate(form.created_time)}
                  </Typography>

                  {form.questions && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Fields: {form.questions.length} questions
                    </Typography>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewForm(form)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {formsData.pages.map((page) => {
            const pageForms = formsData.leadForms.filter(
              (form) => form.pageId === page.id
            );
            const isExpanded = expandedPages[page.id];

            return (
              <Grid item xs={12} key={page.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => togglePageExpansion(page.id)}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <BusinessIcon />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {page.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {page.id} • {pageForms.length} forms
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={`${pageForms.length} forms`}
                          color="primary"
                          size="small"
                        />
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                        {pageForms.length > 0 ? (
                          <Grid container spacing={2}>
                            {pageForms.map((form) => (
                              <Grid item xs={12} sm={6} md={4} key={form.id}>
                                <Card
                                  variant="outlined"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => handleViewForm(form)}
                                >
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="bold"
                                      noWrap
                                    >
                                      {form.name}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mt: 1,
                                      }}
                                    >
                                      {getStatusChip(form.status)}
                                      <Typography variant="body2">
                                        {form.leads_count || 0} leads
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No lead forms found for this page
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {activeTab === 2 && (
        <Box>
          {/* Controls for Recent Leads Tab */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showAllLeads}
                    onChange={handleToggleAllLeads}
                    disabled={fetchingAllLeads || refreshing}
                  />
                }
                label={
                  showAllLeads
                    ? "Showing All Leads"
                    : "Showing Recent Leads Only"
                }
              />

              {/* Date Filter Button */}
              <Button
                variant={dateFilter === "all" ? "outlined" : "contained"}
                color={dateFilter === "all" ? "primary" : "secondary"}
                startIcon={<FilterListIcon />}
                endIcon={<CalendarTodayIcon />}
                onClick={(e) => setDateFilterAnchorEl(e.currentTarget)}
                sx={{ minWidth: 200 }}
              >
                {getDateFilterLabel()}
                {dateFilter !== "all" && (
                  <Chip
                    size="small"
                    label={filteredLeads.length}
                    sx={{
                      ml: 1,
                      bgcolor: "rgba(255,255,255,0.3)",
                      color: "white",
                    }}
                  />
                )}
              </Button>

              {/* Form Name Filter Button */}
              <Button
                variant={
                  selectedFormNames.length === 0 ? "outlined" : "contained"
                }
                color={selectedFormNames.length === 0 ? "primary" : "secondary"}
                startIcon={<FilterListIcon />}
                endIcon={<AssignmentIcon />}
                onClick={(e) => setFormFilterAnchorEl(e.currentTarget)}
                sx={{ minWidth: 200 }}
              >
                {getFormFilterLabel()}
                {selectedFormNames.length > 0 && (
                  <Chip
                    size="small"
                    label={filteredLeads.length}
                    sx={{
                      ml: 1,
                      bgcolor: "rgba(255,255,255,0.3)",
                      color: "white",
                    }}
                  />
                )}
              </Button>

              {(dateFilter !== "all" || selectedFormNames.length > 0) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={clearAllFilters}
                  sx={{ color: "text.secondary" }}
                >
                  Clear All Filters
                </Button>
              )}

              {dateFilter !== "all" && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleDateFilterChange("all")}
                  sx={{ color: "text.secondary" }}
                >
                  Clear Date Filter
                </Button>
              )}

              {fetchingAllLeads && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Fetching all leads...
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={exportLeadsToCSV}
                disabled={filteredLeads.length === 0}
                size="small"
              >
                Export CSV
              </Button>
              <Typography variant="body2" color="text.secondary">
                Showing: {filteredLeads.length} of{" "}
                {formsData.recentLeads.length} leads
                {showAllLeads && " (all leads)"}
              </Typography>
            </Box>
          </Box>

          {/* Date Filter Popover */}
          <Popover
            open={Boolean(dateFilterAnchorEl)}
            anchorEl={dateFilterAnchorEl}
            onClose={() => setDateFilterAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <Box sx={{ p: 3, minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Select Date Range
              </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio />}
                    label="All time"
                  />
                  <FormControlLabel
                    value="today"
                    control={<Radio />}
                    label="Today"
                  />
                  <FormControlLabel
                    value="yesterday"
                    control={<Radio />}
                    label="Yesterday"
                  />
                  <FormControlLabel
                    value="last7days"
                    control={<Radio />}
                    label="Last 7 days"
                  />
                  <FormControlLabel
                    value="last14days"
                    control={<Radio />}
                    label="Last 14 days"
                  />
                  <FormControlLabel
                    value="last30days"
                    control={<Radio />}
                    label="Last 30 days"
                  />
                  <FormControlLabel
                    value="thisMonth"
                    control={<Radio />}
                    label="This month"
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label="Custom"
                  />
                </RadioGroup>
              </FormControl>

              {dateFilter === "custom" && (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Custom Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="Start Date"
                        value={customDateRange.startDate}
                        onChange={(e) =>
                          handleCustomDateRangeChange(
                            "startDate",
                            e.target.value
                          )
                        }
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="End Date"
                        value={customDateRange.endDate}
                        onChange={(e) =>
                          handleCustomDateRangeChange("endDate", e.target.value)
                        }
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button onClick={() => setDateFilterAnchorEl(null)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setDateFilterAnchorEl(null)}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Popover>

          {/* Form Name Filter Popover */}
          <FormFilterPopover
            open={Boolean(formFilterAnchorEl)}
            anchorEl={formFilterAnchorEl}
            onClose={() => setFormFilterAnchorEl(null)}
            availableFormNames={availableFormNames}
            selectedFormNames={selectedFormNames}
            onFormNameToggle={handleFormNameToggle}
            onSelectAllForms={setSelectedFormNames}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lead ID</TableCell>
                  <TableCell>Form</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell>Preferred Program</TableCell>
                  <TableCell>Education Level</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const fieldData = formatFieldData(lead.field_data);

                  // Helper function to find field value by name patterns
                  const findFieldValue = (patterns) => {
                    const field = fieldData.find((field) =>
                      patterns.some((pattern) =>
                        field.name.toLowerCase().includes(pattern.toLowerCase())
                      )
                    );
                    return field?.value || "";
                  };

                  const emailField = findFieldValue(["email"]);
                  const phoneField = findFieldValue([
                    "phone",
                    "mobile",
                    "telephone",
                  ]);
                  const firstNameField = findFieldValue([
                    "first_name",
                    "firstname",
                    "first name",
                  ]);
                  const lastNameField = findFieldValue([
                    "last_name",
                    "lastname",
                    "last name",
                  ]);
                  const fullNameField = findFieldValue([
                    "full_name",
                    "fullname",
                    "full name",
                    "name",
                  ]);

                  // Combine name fields intelligently
                  let displayName = "";
                  if (fullNameField) {
                    displayName = fullNameField;
                  } else if (firstNameField || lastNameField) {
                    displayName = `${firstNameField} ${lastNameField}`.trim();
                  }

                  // Extract custom fields
                  const preferredProgramField = findFieldValue([
                    "preferred program",
                    "program",
                    "course",
                    "degree",
                    "program of interest",
                    "which program",
                    "program_of_interest",
                    "course_interest",
                  ]);

                  const educationLevelField = findFieldValue([
                    "highest level of education",
                    "education level",
                    "education_level",
                    "highest education",
                    "education completed",
                    "academic level",
                    "qualification level",
                    "previous education",
                  ]);

                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {lead.id.substring(0, 12)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {lead.formName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {lead.pageName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {displayName && (
                            <Typography variant="body2">
                              <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {displayName}
                            </Typography>
                          )}
                          {emailField && (
                            <Typography variant="body2" color="text.secondary">
                              <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {emailField}
                            </Typography>
                          )}
                          {phoneField && (
                            <Typography variant="body2" color="text.secondary">
                              <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {phoneField}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {preferredProgramField || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {educationLevelField || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(lead.created_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 4 }}
                      >
                        {dateFilter === "all" && selectedFormNames.length === 0
                          ? "No leads found"
                          : `No leads found for the applied filters`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {formsData.campaigns.map((campaign) => (
            <Grid item xs={12} md={6} key={campaign.id}>
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
                      <Typography variant="h6" fontWeight="bold">
                        {campaign.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Account: {campaign.accountName}
                      </Typography>
                    </Box>
                    <Chip
                      label={campaign.status}
                      color={
                        campaign.status === "ACTIVE" ? "success" : "default"
                      }
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CampaignIcon color="action" />
                    <Typography variant="body2">
                      Objective: {campaign.objective || "N/A"}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Created: {formatDate(campaign.created_time)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Form Details Dialog */}
      <FormDetailsDialog
        open={formDialog}
        onClose={() => setFormDialog(false)}
        selectedForm={selectedForm}
        formatDate={formatDate}
      />
    </Box>
  );
};

export default FacebookLeadForms;
