import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  TablePagination,
  Chip,
  Button,
  TextField,
  IconButton,
  Badge,
  Alert,
  Skeleton,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Divider,
  Stack,
  Collapse,
} from "@mui/material";
import {
  Download as DownloadIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ContactMail as ContactMailIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  Block as BlockIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import { leadService } from "../../services/leadService";
import { useAuth } from "../../contexts/AuthContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { PERMISSIONS } from "../../config/roles.config";
import InquiryContactDialog from "../../components/InquiryContactDialog";
import ApplicationFormDialog from "../../components/applications/ApplicationFormDialog";
import ApplicationDetailsDialog from "../../components/applications/ApplicationDetailsDialog";
import LeadActionMenu from "../../components/leads/LeadActionMenu";
import LeadEditDialog from "../../components/leads/LeadEditDialog";
import LeadDeleteDialog from "../../components/leads/LeadDeleteDialog";
import StartConversationDialog from "../../components/leads/StartConversationDialog";

// Move TabPanel outside the main component to prevent recreation on every render
const TabPanel = React.memo(({ children, value, index, ...other }) => {
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
});

const DataCenter = () => {
  const { checkPermission } = useRolePermissions();
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  const [currentTab, setCurrentTab] = useState(0);
  const [leads, setLeads] = useState([]);
  const [personalLeads, setPersonalLeads] = useState([]); // State for "For You" tab
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: "",
    program: "",
    dateRange: "",
    priority: "",
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchProgram, setSearchProgram] = useState("");
  const [searchSource, setSearchSource] = useState("");

  // Advanced search object for easy reference
  const advancedSearch = {
    name: searchName,
    email: searchEmail,
    phone: searchPhone,
    program: searchProgram,
    source: searchSource,
  };

  // Optimized search handlers using useCallback to prevent input focus loss
  const handleSearchNameChange = useCallback((e) => {
    setSearchName(e.target.value);
  }, []);

  const handleSearchEmailChange = useCallback((e) => {
    setSearchEmail(e.target.value);
  }, []);

  const handleSearchPhoneChange = useCallback((e) => {
    setSearchPhone(e.target.value);
  }, []);

  const handleSearchProgramChange = useCallback((e) => {
    setSearchProgram(e.target.value);
  }, []);

  const handleSearchSourceChange = useCallback((e) => {
    setSearchSource(e.target.value);
  }, []);

  // Helper function to check if user role is restricted for applied leads
  const isRestrictedRole = (role) => {
    const restrictedRoles = ["marketingAgent", "admin"];
    return restrictedRoles.includes(role);
  };
  const [tabSwitching, setTabSwitching] = useState(false);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    byStatus: {},
    bySource: {},
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 50,
    total: 0,
  });
  // State for action menu and dialogs
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);
  const [viewApplicationDialogOpen, setViewApplicationDialogOpen] =
    useState(false);
  // const { } = useAuth(); // Keep for future use

  // Define lead status categories for tabs - Updated for new funnel
  const leadStatusTabs = useMemo(
    () => [
      {
        label: "All Leads",
        statuses: [
          "INTERESTED",
          "APPLIED",
          "IN_REVIEW",
          "QUALIFIED",
          "ADMITTED",
          "ENROLLED",
          "DEFERRED",
          "EXPIRED",
        ],
        icon: ContactMailIcon,
        color: "primary",
      },
      {
        label: "For You",
        statuses: [], // Will be filtered by submittedBy instead of status
        icon: PersonIcon,
        color: "secondary",
        isPersonal: true, // Special flag to indicate this shows personal submissions
      },
      {
        label: "Interested",
        statuses: ["INTERESTED"],
        icon: AssessmentIcon,
        color: "info",
      },
      {
        label: "Applied",
        statuses: ["APPLIED"],
        icon: AssignmentIcon,
        color: "warning",
      },
      {
        label: "In Review",
        statuses: ["IN_REVIEW"],
        icon: SchoolIcon,
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
      {
        label: "Deferred",
        statuses: ["DEFERRED"],
        icon: AssessmentIcon,
        color: "warning",
      },
      {
        label: "Expired",
        statuses: ["EXPIRED"],
        icon: AssessmentIcon,
        color: "error",
      },
    ],
    []
  );

  // Filter tabs based on user role - only show tabs for stages they have access to
  const filteredTabs = useMemo(() => {
    console.log("🔑 Permission check for user:", userRole);

    if (!userRole) {
      console.log("❌ No user role found, returning empty tabs");
      return [];
    }

    const filtered = leadStatusTabs
      .filter((tab) => {
        // "For You" tab - only show to agents (not admins)
        if (tab.label === "For You") {
          const agentRoles = ["marketingAgent", "admissionAgent"];
          return agentRoles.includes(userRole);
        }

        // Admin sees all tabs
        if (userRole === "admin" || userRole === "superAdmin") {
          return true;
        }

        // Marketing Agent: Interested to Admitted
        if (userRole === "marketingAgent") {
          const allowedTabs = [
            "All Leads",
            "Interested",
            "Applied",
            "In Review",
            "Qualified",
            "Admitted",
          ];
          return allowedTabs.includes(tab.label);
        }

        // Admission Admin & Admission Agent: Applied to the very end
        if (userRole === "admissionAdmin" || userRole === "admissionAgent") {
          const allowedTabs = [
            "All Leads",
            "Applied",
            "In Review",
            "Qualified",
            "Admitted",
            "Enrolled",
            "Deferred",
            "Expired",
          ];
          return allowedTabs.includes(tab.label);
        }

        // Default: show all tabs
        return true;
      })
      .map((tab) => {
        // For "All Leads" tab, filter statuses based on role
        if (tab.label === "All Leads") {
          let allowedStatuses = tab.statuses;

          if (userRole === "marketingAgent") {
            allowedStatuses = tab.statuses.filter((status) =>
              [
                "INTERESTED",
                "APPLIED",
                "IN_REVIEW",
                "QUALIFIED",
                "ADMITTED",
              ].includes(status)
            );
          } else if (
            userRole === "admissionAdmin" ||
            userRole === "admissionAgent"
          ) {
            allowedStatuses = tab.statuses.filter((status) =>
              [
                "APPLIED",
                "IN_REVIEW",
                "QUALIFIED",
                "ADMITTED",
                "ENROLLED",
                "DEFERRED",
                "EXPIRED",
              ].includes(status)
            );
          }

          return { ...tab, statuses: allowedStatuses };
        }
        return tab;
      });

    console.log(
      "🎯 Filtered tabs:",
      filtered.map((t) => t.label)
    );
    return filtered;
  }, [userRole, leadStatusTabs]);

  // Debug logging
  console.log("🔍 DataCenter Debug:", {
    userRole,
    allTabsCount: leadStatusTabs.length,
    filteredTabsCount: filteredTabs.length,
    filteredTabs: filteredTabs.map((t) => t.label),
    currentTab,
    leadsCount: leads.length,
    currentPage: pagination.page,
    rowsPerPage: pagination.rowsPerPage,
    totalLeads: pagination.total,
  });

  // Manual refresh function - only refreshes leads, not stats
  const refreshCurrentTab = useCallback(() => {
    console.log("📊 Manual refresh: updating leads only");
    setPagination((prev) => ({ ...prev, page: 0 }));
    setRefreshTrigger((prev) => prev + 1);
    // Don't refresh stats on manual refresh - only leads
  }, []);

  // Handle pagination
  const handleChangePage = useCallback((event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setPagination((prev) => ({
      ...prev,
      page: 0,
      rowsPerPage: newRowsPerPage,
    }));
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      source: "",
      program: "",
      dateRange: "",
      priority: "",
    });
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setSearchProgram("");
    setSearchSource("");
    setShowAdvancedSearch(false);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback(
    (event, newTabIndex) => {
      console.log(`🔄 Tab change from ${currentTab} to ${newTabIndex}`);

      // Clear any existing errors
      setError("");

      // Set tab switching state for smooth transition
      setTabSwitching(true);
      setLoading(true);

      // Update current tab
      setCurrentTab(newTabIndex);

      // Clear search and filters when changing tabs
      clearAllFilters();

      // Reset pagination for new tab
      setPagination((prev) => ({ ...prev, page: 0 }));

      // Clear current leads to prevent showing old data during transition
      setLeads([]);

      // The useEffect will handle fetching ONLY leads data when currentTab changes
      // No stats refresh needed - they stay the same across tabs
    },
    [currentTab, clearAllFilters]
  );

  // Fetch initial data only once on component mount
  useEffect(() => {
    console.log("🏁 Component mounted - fetching initial data once");

    const fetchData = async () => {
      try {
        console.log(`📊 Fetching initial data`);

        const [applicationsResponse, statsResponse] = await Promise.all([
          leadService.getApplications({ limit: 50 }),
          leadService.getLeadStats(),
        ]);

        setApplications(applicationsResponse.data || []);
        setLeadStats(
          statsResponse.data || { total: 0, byStatus: {}, bySource: {} }
        );
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only run once on mount

  // Fetch leads when component mounts or current tab changes or refresh is triggered
  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 useEffect triggered:", {
        currentTab,
        filteredTabsLength: filteredTabs.length,
        userRole,
      });

      // Early exit if no user role (not authenticated)
      if (!userRole) {
        console.log("❌ No user role found, user might not be authenticated");
        setLoading(false);
        return;
      }

      // Early exit if no tabs available
      if (filteredTabs.length === 0) {
        console.log("❌ No filtered tabs available, setting loading to false");
        setLoading(false);
        return;
      }

      // Get current state values
      const currentTabConfig = filteredTabs[currentTab];
      if (!currentTabConfig) {
        console.log("❌ No current tab config found, setting loading to false");
        setLoading(false);
        return;
      }

      if (currentTab >= filteredTabs.length) {
        console.log(
          "❌ Current tab index out of bounds, setting loading to false"
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const limit = pagination.rowsPerPage;
        const offset = pagination.page * pagination.rowsPerPage;
        console.log(
          `📊 Fetching ${currentTabConfig.label} data (page ${
            pagination.page + 1
          }, limit ${limit})`
        );

        let leadsResponse;

        if (currentTabConfig.label === "For You") {
          // Special handling for "For You" tab - fetch personal submissions
          leadsResponse = await leadService.getMySubmittedLeads({
            limit,
            page: pagination.page + 1,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          setPersonalLeads(leadsResponse.data || []);
          // Update total count for pagination
          setPagination((prev) => ({
            ...prev,
            total:
              leadsResponse.pagination?.total ||
              leadsResponse.data?.length ||
              0,
          }));
        } else if (currentTabConfig.label === "All Leads") {
          // Fetch all leads and let the backend handle any role-based filtering
          leadsResponse = await leadService.getAllLeads({
            limit,
            offset,
            sortBy: "createdAt",
            sortOrder: "desc",
          });

          // Update total count for pagination using stats
          const totalCount = currentTabConfig.statuses.reduce(
            (total, status) => {
              return total + (leadStats.byStatus[status] || 0);
            },
            0
          );
          setPagination((prev) => ({
            ...prev,
            total: totalCount,
          }));
        } else {
          if (currentTabConfig.statuses.length === 1) {
            // Single status - use optimized status endpoint
            leadsResponse = await leadService.getLeadsByStatus(
              currentTabConfig.statuses[0],
              {
                limit,
                offset,
                sortBy: "createdAt",
                sortOrder: "desc",
              }
            );
          } else {
            // Multiple statuses - use getAllLeads and let backend filter by status if possible
            // For now, we'll fetch each status separately and combine results
            const statusPromises = currentTabConfig.statuses.map(
              async (status) => {
                const statusResponse = await leadService.getLeadsByStatus(
                  status,
                  {
                    limit:
                      Math.ceil(limit / currentTabConfig.statuses.length) + 5, // Get a bit more to ensure good distribution
                    offset: Math.floor(
                      offset / currentTabConfig.statuses.length
                    ),
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  }
                );
                return statusResponse.data || [];
              }
            );

            const statusResults = await Promise.all(statusPromises);

            // Combine all results and sort by createdAt desc to maintain consistency
            const allStatusLeads = statusResults.flat();
            allStatusLeads.sort((a, b) => {
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

            // Take only the required number after sorting
            leadsResponse = {
              data: allStatusLeads.slice(0, limit),
              pagination: {
                hasMore: allStatusLeads.length > limit,
                total: allStatusLeads.length,
              },
            };
          }

          // Update total count for pagination using stats
          const totalCount = currentTabConfig.statuses.reduce(
            (total, status) => {
              return total + (leadStats.byStatus[status] || 0);
            },
            0
          );
          setPagination((prev) => ({
            ...prev,
            total: totalCount,
          }));
        }

        const newLeads = leadsResponse.data || [];

        console.log(
          `📊 Received ${newLeads.length} leads for page ${pagination.page + 1}`
        );

        // Log the first few leads to verify sort order
        if (newLeads.length > 0) {
          console.log(
            "🔍 First 3 leads sort verification:",
            newLeads.slice(0, 3).map((lead) => ({
              id: lead.id,
              name: lead.name,
              createdAt: lead.createdAt,
              status: lead.status,
            }))
          );
        }

        setLeads(newLeads);
      } catch (err) {
        console.error(`Error fetching leads:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
        setTabSwitching(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentTab,
    refreshTrigger,
    userRole,
    pagination.page,
    pagination.rowsPerPage,
    leadStats,
  ]);

  // Auto-refresh every 5 minutes (300 seconds) - only refreshes leads, not stats
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing current tab leads only...");
      setRefreshTrigger((prev) => prev + 1);
    }, 300000); // Changed to 300000 (5 minutes)

    return () => clearInterval(interval);
  }, []); // No dependencies needed

  // Get leads for current tab with status filtering
  const getCurrentTabLeads = useMemo(() => {
    const currentTabConfig = filteredTabs[currentTab];
    if (!currentTabConfig) return [];

    // Special handling for "For You" tab
    if (currentTabConfig.label === "For You") {
      return personalLeads;
    }

    // Since we're already filtering in the API calls, we should return all leads
    // The leads state already contains the filtered data for the current tab
    return leads;
  }, [leads, personalLeads, currentTab, filteredTabs]);

  // Get tab count for badge display
  const getTabCount = useCallback(
    (statuses, tabLabel) => {
      // Special handling for "For You" tab
      if (tabLabel === "For You") {
        return personalLeads.length;
      }

      // Use stats data for accurate counts
      return statuses.reduce((total, status) => {
        return total + (leadStats.byStatus[status] || 0);
      }, 0);
    },
    [leadStats, personalLeads]
  );

  // Get visible total count based on user role
  const getVisibleTotal = useMemo(() => {
    if (userRole === "admissionAdmin") {
      // Only count Applied, Qualified, Admitted, Enrolled
      const allowedStatuses = ["APPLIED", "QUALIFIED", "ADMITTED", "ENROLLED"];
      return allowedStatuses.reduce((total, status) => {
        return total + (leadStats.byStatus[status] || 0);
      }, 0);
    }
    // For other roles, return the full total
    return leadStats.total || 0;
  }, [userRole, leadStats]);

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
        status: "INTERESTED",
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
        key: "in_review",
        status: "IN_REVIEW",
        label: "In Review",
        icon: AssessmentIcon,
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
      {
        key: "deferred",
        status: "DEFERRED",
        label: "Deferred",
        icon: PauseIcon,
        color: "warning",
      },
      {
        key: "expired",
        status: "EXPIRED",
        label: "Expired",
        icon: BlockIcon,
        color: "error",
      },
    ];

    if (userRole === "admissionAdmin" || userRole === "admissionAgent") {
      // Admission admins and agents see Applied to the very end
      return allCards.filter((card) =>
        [
          "total",
          "applied",
          "in_review",
          "qualified",
          "admitted",
          "enrolled",
          "deferred",
          "expired",
        ].includes(card.key)
      );
    } else if (userRole === "marketingAgent") {
      // Marketing agents see Interested to Admitted
      return allCards.filter((card) =>
        [
          "total",
          "interested",
          "applied",
          "in_review",
          "qualified",
          "admitted",
        ].includes(card.key)
      );
    } else {
      // Admin sees all cards
      return allCards;
    }
  };

  // Get funnel stages based on user role
  const getVisibleFunnelStages = () => {
    const allStages = [
      {
        key: "interested",
        status: "INTERESTED",
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
        key: "in_review",
        status: "IN_REVIEW",
        label: "In Review",
        color: "primary",
        subtitle: "Under Review",
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

    if (userRole === "admissionAdmin" || userRole === "admissionAgent") {
      // Admission admins and agents see Applied to the very end
      return allStages.filter((stage) =>
        ["applied", "in_review", "qualified", "admitted", "enrolled"].includes(
          stage.key
        )
      );
    } else if (userRole === "marketingAgent") {
      // Marketing agents see Interested to Admitted
      return allStages.filter((stage) =>
        [
          "interested",
          "applied",
          "in_review",
          "qualified",
          "admitted",
        ].includes(stage.key)
      );
    } else {
      // Default: admin and others see all stages
      return allStages;
    }
  };

  // Enhanced filter and search functionality
  const filteredLeads = useMemo(() => {
    let tabLeads = getCurrentTabLeads;

    // Apply filters first
    if (filters.source) {
      tabLeads = tabLeads.filter((lead) => lead.source === filters.source);
    }

    if (filters.program) {
      tabLeads = tabLeads.filter((lead) => {
        if (typeof lead.program === "string") {
          return lead.program === filters.program;
        } else if (typeof lead.program === "object" && lead.program !== null) {
          return (
            lead.program.name === filters.program ||
            lead.program.code === filters.program
          );
        }
        return false;
      });
    }

    if (filters.dateRange) {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        tabLeads = tabLeads.filter((lead) => {
          const leadDate = lead.createdAt?.toDate
            ? lead.createdAt.toDate()
            : new Date(lead.createdAt);
          return leadDate >= startDate;
        });
      }
    }

    // Apply advanced search if active
    if (showAdvancedSearch) {
      // Advanced search
      return tabLeads.filter((lead) => {
        const matchName =
          !searchName ||
          lead.name?.toLowerCase().includes(searchName.toLowerCase());

        const matchEmail =
          !searchEmail ||
          lead.email?.toLowerCase().includes(searchEmail.toLowerCase());

        const matchPhone =
          !searchPhone ||
          lead.phone?.toLowerCase().includes(searchPhone.toLowerCase());

        const matchProgram =
          !searchProgram ||
          (typeof lead.program === "string" &&
            lead.program
              ?.toLowerCase()
              .includes(searchProgram.toLowerCase())) ||
          (typeof lead.program === "object" &&
            lead.program !== null &&
            (lead.program.name
              ?.toLowerCase()
              .includes(searchProgram.toLowerCase()) ||
              lead.program.code
                ?.toLowerCase()
                .includes(searchProgram.toLowerCase())));

        const matchSource =
          !searchSource ||
          lead.source?.toLowerCase().includes(searchSource.toLowerCase());

        return (
          matchName && matchEmail && matchPhone && matchProgram && matchSource
        );
      });
    }

    return tabLeads;
  }, [
    getCurrentTabLeads,
    filters,
    showAdvancedSearch,
    searchName,
    searchEmail,
    searchPhone,
    searchProgram,
    searchSource,
  ]);

  // Get unique values for filters
  const getUniqueValues = useMemo(() => {
    const allLeads = getCurrentTabLeads;

    const sources = [
      ...new Set(allLeads.map((lead) => lead.source).filter(Boolean)),
    ];

    const programs = [
      ...new Set(
        allLeads
          .map((lead) => {
            if (typeof lead.program === "string") return lead.program;
            if (typeof lead.program === "object" && lead.program !== null) {
              return lead.program.name || lead.program.code;
            }
            return null;
          })
          .filter(Boolean)
      ),
    ];

    return { sources, programs };
  }, [getCurrentTabLeads]);

  const getStatusColor = (status) => {
    switch (status) {
      case "INTERESTED":
        return "warning";
      case "APPLIED":
        return "info";
      case "IN_REVIEW":
        return "primary";
      case "QUALIFIED":
        return "success";
      case "ADMITTED":
        return "secondary";
      case "ENROLLED":
        return "success";
      case "DEFERRED":
        return "warning";
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const dateTimeOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    try {
      // Handle Date objects
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString("en-US", dateTimeOptions);
      }

      // Handle Firestore Timestamps or similar objects with seconds
      if (typeof dateValue === "object" && dateValue.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleString(
          "en-US",
          dateTimeOptions
        );
      }

      // Handle string dates and ISO format
      if (typeof dateValue === "string") {
        // Try to handle different string formats
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("en-US", dateTimeOptions);
        }

        // If the standard parsing fails, try different formats:
        // Try to parse date format like "DD/MM/YYYY" or "DD-MM-YYYY"
        const parts = dateValue.split(/[/\-.]/);
        if (parts.length === 3) {
          // Try different date arrangements (US, European, etc)
          const potentialDates = [
            new Date(parts[2], parts[1] - 1, parts[0]), // DD/MM/YYYY
            new Date(parts[2], parts[0] - 1, parts[1]), // MM/DD/YYYY
            new Date(`${parts[2]}-${parts[1]}-${parts[0]}`), // Try ISO format YYYY-MM-DD
          ];

          for (const potentialDate of potentialDates) {
            if (!isNaN(potentialDate.getTime())) {
              return potentialDate.toLocaleString("en-US", dateTimeOptions);
            }
          }
        }

        // If we can't parse it, return the original string
        return dateValue;
      }

      // Handle timestamp numbers
      if (typeof dateValue === "number") {
        return new Date(dateValue).toLocaleString("en-US", dateTimeOptions);
      }
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
    }

    return typeof dateValue === "string" ? dateValue : "N/A";
  };

  // Action handlers
  const handleEditLead = (lead) => {
    setSelectedLead(lead);

    // Only INTERESTED leads should have edit functionality
    // All other statuses (APPLIED and beyond) should view the application
    if (lead.status === "INTERESTED") {
      // For INTERESTED leads, show the edit dialog
      setEditDialogOpen(true);
    } else {
      // For all other statuses (APPLIED, IN_REVIEW, QUALIFIED, ADMITTED, ENROLLED, DEFERRED, EXPIRED)
      // always show the application details dialog
      setViewApplicationDialogOpen(true);
    }
  };

  const handleConvertLead = (lead) => {
    // Convert lead to application
    console.log("Convert lead:", lead.id);
    // TODO: Implement conversion to application
  };

  const handleDeleteLead = (lead) => {
    setSelectedLead(lead);
    setDeleteDialogOpen(true);
  };

  const handleLeadUpdated = (updatedLead) => {
    console.log("Lead updated:", updatedLead.id);

    // Update the lead in the current leads array
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead
      )
    );

    // Update stats locally instead of full refresh
    setLeadStats((prevStats) => {
      const updatedStats = { ...prevStats };
      // This is a simple approach - in a real app you might want more sophisticated stats updating
      return updatedStats;
    });
  };

  const handleLeadDeleted = (leadId) => {
    console.log("Lead deleted:", leadId);

    // Remove the deleted lead from the current leads array
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));

    // Update stats locally instead of full refresh
    setLeadStats((prevStats) => {
      const updatedStats = { ...prevStats };
      updatedStats.total = Math.max(0, updatedStats.total - 1);
      return updatedStats;
    });
  };

  const handleStartConversation = (lead) => {
    setSelectedLead(lead);
    setConversationDialogOpen(true);
  };

  // Handler for when a new inquiry contact is created
  const handleContactCreated = (result) => {
    // Extract lead data from the result object
    const newLead = result.lead || result;

    // Add the new lead to the beginning of the leads array
    setLeads((prev) => [
      {
        id: newLead.id,
        ...newLead,
        createdAt: newLead.createdAt || new Date().toISOString(),
      },
      ...prev,
    ]);

    // Update stats locally instead of full refresh
    setLeadStats((prevStats) => {
      const updatedStats = { ...prevStats };
      updatedStats.total = updatedStats.total + 1;
      if (newLead.status) {
        updatedStats.byStatus[newLead.status] =
          (updatedStats.byStatus[newLead.status] || 0) + 1;
      }
      return updatedStats;
    });
  };

  // Handler for when a new application is submitted
  const handleApplicationSubmitted = (result) => {
    // Extract application and lead data from the result
    const newApplication = result.application;
    const updatedLead = result.lead;

    // Update or add the lead
    if (updatedLead) {
      setLeads((prev) => {
        const existingIndex = prev.findIndex(
          (lead) => lead.id === updatedLead.id
        );
        if (existingIndex >= 0) {
          // Update existing lead
          return prev.map((lead, index) =>
            index === existingIndex
              ? { ...lead, ...updatedLead, updatedAt: new Date().toISOString() }
              : lead
          );
        } else {
          // Add new lead
          return [
            {
              id: updatedLead.id,
              ...updatedLead,
              createdAt: updatedLead.createdAt || new Date().toISOString(),
            },
            ...prev,
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

    // Update stats locally instead of full refresh
    setLeadStats((prevStats) => {
      const updatedStats = { ...prevStats };
      if (updatedLead && updatedLead.status) {
        updatedStats.byStatus[updatedLead.status] =
          (updatedStats.byStatus[updatedLead.status] || 0) + 1;
      }
      return updatedStats;
    });
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
                      : getVisibleTotal}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.key === "total" && "All prospects in system"}
                    {card.key === "interested" && "Showing interest"}
                    {card.key === "qualified" && "Ready for admission"}
                    {card.key === "applied" && "Submitted applications"}
                    {card.key === "in_review" && "Under review"}
                    {card.key === "admitted" && "Accepted for admission"}
                    {card.key === "enrolled" && "Successfully enrolled"}
                    {card.key === "deferred" && "Deferred to later intake"}
                    {card.key === "expired" && "No longer viable"}
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
                  {getVisibleTotal > 0
                    ? Math.round(
                        ((leadStats.byStatus.ENROLLED || 0) / getVisibleTotal) *
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
                    {getVisibleTotal}
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
                    <Typography variant="h6">New Contacts</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {leadStats.byStatus.INTERESTED || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent form submissions
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
                    {getVisibleTotal > 0
                      ? Math.round(
                          (applications.length / getVisibleTotal) * 100
                        )
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
                onChange={handleTabChange}
                aria-label="data center tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                {filteredTabs.map((tab, index) => {
                  const TabIcon = tab.icon;
                  const count = getTabCount(tab.statuses, tab.label);
                  const isCurrentTab = currentTab === index;
                  const showLoading = isCurrentTab && (loading || tabSwitching);

                  return (
                    <Tab
                      key={index}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {showLoading ? (
                            <CircularProgress size={16} />
                          ) : (
                            <TabIcon fontSize="small" />
                          )}
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
                    {tab.label} ({getTabCount(tab.statuses, tab.label)})
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {tab.label === "All Leads" &&
                      userRole === "admissionAdmin" &&
                      "Overview of admission-stage leads (Applied, Qualified, Admitted, Enrolled)"}
                    {tab.label === "All Leads" &&
                      userRole !== "admissionAdmin" &&
                      "Overview of all leads in the system across all stages"}
                    {tab.label === "For You" &&
                      "Leads that you personally submitted and are responsible for"}
                    {tab.label === "Interested" &&
                      "Leads that have shown interest and are ready for further engagement"}
                    {tab.label === "Applied" &&
                      "Leads who have submitted formal applications"}
                    {tab.label === "In Review" &&
                      "Applications currently under review by the admissions team"}
                    {tab.label === "Qualified" &&
                      "Leads who have met all qualification requirements"}
                    {tab.label === "Admitted" &&
                      "Students who have been officially admitted to programs"}
                    {tab.label === "Enrolled" &&
                      "Students who have completed enrollment and are active"}
                    {tab.label === "Deferred" &&
                      "Applications deferred to a later intake or semester"}
                    {tab.label === "Expired" &&
                      "Applications that have expired and are no longer viable"}
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
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ flex: 1 }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={
                          showAdvancedSearch ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )
                        }
                        onClick={() =>
                          setShowAdvancedSearch(!showAdvancedSearch)
                        }
                        size="small"
                      >
                        Advanced Search
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setFilterDrawerOpen(true)}
                        size="small"
                        color={
                          Object.values(filters).some(Boolean)
                            ? "primary"
                            : "inherit"
                        }
                      >
                        Filters
                        {Object.values(filters).some(Boolean) && (
                          <Chip
                            size="small"
                            label={
                              Object.values(filters).filter(Boolean).length
                            }
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </Button>

                      {(Object.values(filters).some(Boolean) ||
                        Object.values(advancedSearch).some(Boolean)) && (
                        <Button
                          variant="text"
                          startIcon={<ClearIcon />}
                          onClick={clearAllFilters}
                          size="small"
                          color="secondary"
                        >
                          Clear All
                        </Button>
                      )}
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {userRole !== "admissionAdmin" &&
                        userRole !== "admissionAgent" && (
                          <Button
                            variant="contained"
                            startIcon={<WhatsAppIcon />}
                            onClick={() => setInquiryDialogOpen(true)}
                            color="success"
                          >
                            Add New Lead
                          </Button>
                        )}
                      {(userRole === "admissionAdmin" ||
                        userRole === "admissionAgent") && (
                        <Button
                          variant="contained"
                          startIcon={<AssignmentIcon />}
                          onClick={() => setApplicationDialogOpen(true)}
                          color="primary"
                        >
                          Add Applicant
                        </Button>
                      )}
                      <IconButton
                        onClick={() => {
                          console.log("Manual refresh triggered");
                          refreshCurrentTab();
                        }}
                        title="Refresh Data"
                      >
                        <RefreshIcon />
                      </IconButton>
                      {checkPermission(PERMISSIONS.EXPORT_DATA) && (
                        <Button variant="outlined" startIcon={<DownloadIcon />}>
                          Export
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Advanced Search Panel */}
                  <Collapse in={showAdvancedSearch}>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Advanced Search
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField
                            label="Name"
                            value={searchName}
                            onChange={handleSearchNameChange}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by name..."
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField
                            label="Email"
                            value={searchEmail}
                            onChange={handleSearchEmailChange}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by email..."
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField
                            label="Phone"
                            value={searchPhone}
                            onChange={handleSearchPhoneChange}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by phone..."
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField
                            label="Program"
                            value={searchProgram}
                            onChange={handleSearchProgramChange}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by program..."
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField
                            label="Source"
                            value={searchSource}
                            onChange={handleSearchSourceChange}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Search by source..."
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Collapse>

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
                        {loading || tabSwitching ? (
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
                              colSpan={6}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {Object.values(filters).some(Boolean) ||
                                Object.values(advancedSearch).some(Boolean)
                                  ? "No leads found matching your filters/search criteria."
                                  : tab.label === "For You"
                                  ? "You haven't submitted any leads yet. Start by creating your first lead!"
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
                                  {typeof lead.program === "object" &&
                                  lead.program !== null
                                    ? lead.program.name ||
                                      lead.program.code ||
                                      "Not specified"
                                    : lead.program || "Not specified"}
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
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    alignItems: "center",
                                  }}
                                >
                                  {/* View/Edit button based on lead status */}
                                  {lead.status === "INTERESTED" ? (
                                    // INTERESTED leads can be edited
                                    <Tooltip title="Edit Lead">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEditLead(lead)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    // All other statuses (APPLIED and beyond) should view application
                                    <Tooltip title="View Application">
                                      <IconButton
                                        size="small"
                                        color="info"
                                        onClick={() => handleEditLead(lead)}
                                      >
                                        <AssignmentIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}

                                  {/* WhatsApp button - Available for all lead statuses */}
                                  <Tooltip title="Start WhatsApp Conversation">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() =>
                                        handleStartConversation(lead)
                                      }
                                      disabled={
                                        !lead.phone && !lead.phoneNumber
                                      }
                                    >
                                      <WhatsAppIcon />
                                    </IconButton>
                                  </Tooltip>

                                  {/* Delete button - Hidden for marketing agents and admins viewing applied leads */}
                                  {!(
                                    lead.status === "APPLIED" &&
                                    isRestrictedRole(userRole)
                                  ) && (
                                    <Tooltip title="Delete Lead">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteLead(lead)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <TablePagination
                    rowsPerPageOptions={[25, 50, 100]}
                    component="div"
                    count={pagination.total}
                    rowsPerPage={pagination.rowsPerPage}
                    page={pagination.page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Leads per page:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${
                        count !== -1 ? count : `more than ${to}`
                      }`
                    }
                  />
                </Box>
              </TabPanel>
            ))}
          </Paper>
        </>
      )}

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            p: 2,
            backgroundColor: "#7a0000", // Match sidebar color
            color: "#ffffff", // White text
          },
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: "#ffffff" }}>
          Filters
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.2)" }} />

        <Stack spacing={3}>
          {/* Source Filter */}
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#ffffff", "&.Mui-focused": { color: "#ffffff" } }}
            >
              Source
            </InputLabel>
            <Select
              value={filters.source}
              label="Source"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, source: e.target.value }))
              }
              sx={{
                color: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffffff",
                },
                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#ffffff",
                    color: "#000000",
                  },
                },
              }}
            >
              <MenuItem value="">All Sources</MenuItem>
              {getUniqueValues.sources.map((source) => (
                <MenuItem key={source} value={source}>
                  {source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Program Filter */}
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#ffffff", "&.Mui-focused": { color: "#ffffff" } }}
            >
              Program
            </InputLabel>
            <Select
              value={filters.program}
              label="Program"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, program: e.target.value }))
              }
              sx={{
                color: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffffff",
                },
                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#ffffff",
                    color: "#000000",
                  },
                },
              }}
            >
              <MenuItem value="">All Programs</MenuItem>
              {getUniqueValues.programs.map((program) => (
                <MenuItem key={program} value={program}>
                  {program}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filter */}
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#ffffff", "&.Mui-focused": { color: "#ffffff" } }}
            >
              Date Range
            </InputLabel>
            <Select
              value={filters.dateRange}
              label="Date Range"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
              }
              startAdornment={
                <DateRangeIcon sx={{ mr: 1, color: "#ffffff" }} />
              }
              sx={{
                color: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffffff",
                },
                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#ffffff",
                    color: "#000000",
                  },
                },
              }}
            >
              <MenuItem value="">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>

          {/* Applied Filters Summary */}
          {Object.values(filters).some(Boolean) && (
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ color: "#ffffff" }}
              >
                Applied Filters:
              </Typography>
              <Stack direction="column" spacing={1}>
                {filters.source && (
                  <Chip
                    label={`Source: ${filters.source}`}
                    onDelete={() =>
                      setFilters((prev) => ({ ...prev, source: "" }))
                    }
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      "& .MuiChip-deleteIcon": {
                        color: "#ffffff",
                      },
                    }}
                  />
                )}
                {filters.program && (
                  <Chip
                    label={`Program: ${filters.program}`}
                    onDelete={() =>
                      setFilters((prev) => ({ ...prev, program: "" }))
                    }
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      "& .MuiChip-deleteIcon": {
                        color: "#ffffff",
                      },
                    }}
                  />
                )}
                {filters.dateRange && (
                  <Chip
                    label={`Date: ${filters.dateRange}`}
                    onDelete={() =>
                      setFilters((prev) => ({ ...prev, dateRange: "" }))
                    }
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      "& .MuiChip-deleteIcon": {
                        color: "#ffffff",
                      },
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Filter Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
              fullWidth
              sx={{
                borderColor: "#ffffff",
                color: "#ffffff",
                "&:hover": {
                  borderColor: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={() => setFilterDrawerOpen(false)}
              fullWidth
              sx={{
                backgroundColor: "#ffffff",
                color: "#7a0000",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      {/* Inquiry Contact Dialog */}
      <InquiryContactDialog
        open={inquiryDialogOpen}
        onClose={() => setInquiryDialogOpen(false)}
        onSuccess={handleContactCreated}
      />

      {/* Add Applicant Dialog */}
      <ApplicationFormDialog
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onSuccess={handleApplicationSubmitted}
      />

      {/* Lead Action Menu */}
      <LeadActionMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        selectedLead={selectedLead}
        onClose={() => setAnchorEl(null)}
        onEdit={handleEditLead}
        onConvert={handleConvertLead}
        onDelete={handleDeleteLead}
      />

      {/* Lead Edit Dialog */}
      <LeadEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onUpdate={handleLeadUpdated}
      />

      {/* Lead Delete Dialog */}
      <LeadDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onDelete={handleLeadDeleted}
      />

      {/* Start Conversation Dialog */}
      <StartConversationDialog
        open={conversationDialogOpen}
        onClose={() => {
          setConversationDialogOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
      />

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={viewApplicationDialogOpen}
        onClose={() => {
          setViewApplicationDialogOpen(false);
          setSelectedLead(null);
        }}
        applicationId={selectedLead?.applicationId}
        leadId={selectedLead?.id}
        email={selectedLead?.email}
        key={
          selectedLead?.id
        } /* Add key to force re-mount when different lead is selected */
      />
    </Box>
  );
};

export default DataCenter;
