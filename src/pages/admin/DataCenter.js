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
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Alert,
  Skeleton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
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

const DataCenter = () => {
  const { checkPermission, checkLeadStageAccess } = useRolePermissions();
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState([]);
  const [personalLeads, setPersonalLeads] = useState([]); // State for "For You" tab
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
    hasMore: true,
    offset: 0,
    limit: 25,
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
  }, [userRole, leadStatusTabs, checkLeadStageAccess]);

  // Debug logging
  console.log("🔍 DataCenter Debug:", {
    userRole,
    allTabsCount: leadStatusTabs.length,
    filteredTabsCount: filteredTabs.length,
    filteredTabs: filteredTabs.map((t) => t.label),
    currentTab,
    leadsCount: leads.length,
    hasMore: pagination.hasMore,
  });

  // Manual refresh function - only refreshes leads, not stats
  const refreshCurrentTab = useCallback(() => {
    console.log("📊 Manual refresh: updating leads only");
    setPagination({ hasMore: true, offset: 0, limit: 25 });
    setRefreshTrigger((prev) => prev + 1);
    // Don't refresh stats on manual refresh - only leads
  }, []);

  // Load more leads
  const loadMoreLeads = useCallback(async () => {
    if (
      loadingMore ||
      !pagination.hasMore ||
      filteredTabs.length === 0 ||
      tabSwitching
    )
      return;

    const currentTabConfig = filteredTabs[currentTab];
    if (!currentTabConfig) return;

    try {
      setLoadingMore(true);

      const currentOffset = pagination.offset;
      const limit = 25;

      console.log(
        `📊 Loading more leads for tab ${currentTab} (offset: ${currentOffset})`
      );

      let leadsResponse;

      if (currentTabConfig.label === "For You") {
        // Special handling for "For You" tab - fetch personal submissions
        leadsResponse = await leadService.getMySubmittedLeads({
          page: Math.floor(currentOffset / limit) + 1,
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
      } else if (currentTabConfig.label === "All Leads") {
        leadsResponse = await leadService.getAllLeads({
          limit,
          offset: currentOffset,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (leadsResponse.data) {
          leadsResponse.data = leadsResponse.data.filter((lead) => {
            // Get the current status from timeline if available, otherwise fallback to status field
            const currentStatus =
              lead.timeline &&
              Array.isArray(lead.timeline) &&
              lead.timeline.length > 0
                ? lead.timeline[lead.timeline.length - 1].status
                : lead.status;
            return currentTabConfig.statuses.includes(currentStatus);
          });
        }
      } else {
        if (currentTabConfig.statuses.length === 1) {
          leadsResponse = await leadService.getLeadsByStatus(
            currentTabConfig.statuses[0],
            {
              limit,
              offset: currentOffset,
              sortBy: "createdAt",
              sortOrder: "desc",
            }
          );
        } else {
          leadsResponse = await leadService.getAllLeads({
            limit: limit * 2,
            offset: Math.floor(
              currentOffset / currentTabConfig.statuses.length
            ),
            sortBy: "createdAt",
            sortOrder: "desc",
          });

          if (leadsResponse.data) {
            leadsResponse.data = leadsResponse.data
              .filter((lead) => {
                // Get the current status from timeline if available, otherwise fallback to status field
                const currentStatus =
                  lead.timeline &&
                  Array.isArray(lead.timeline) &&
                  lead.timeline.length > 0
                    ? lead.timeline[lead.timeline.length - 1].status
                    : lead.status;
                return currentTabConfig.statuses.includes(currentStatus);
              })
              .slice(0, limit);
          }
        }
      }

      const newLeads = leadsResponse.data || [];
      const hasMore = leadsResponse.pagination?.hasMore || false;

      console.log(
        `📊 Received ${newLeads.length} more leads, hasMore: ${hasMore}`
      );

      setLeads((prev) => [...prev, ...newLeads]);
      setPagination({
        hasMore,
        offset: currentOffset + newLeads.length,
        limit,
      });
    } catch (err) {
      console.error(`Error loading more leads:`, err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentTab,
    loadingMore,
    pagination.hasMore,
    pagination.offset,
    filteredTabs,
    tabSwitching,
  ]);

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

      // Clear search when changing tabs
      setSearchTerm("");

      // Reset pagination for new tab
      setPagination({ hasMore: true, offset: 0, limit: 25 });

      // Clear current leads to prevent showing old data during transition
      setLeads([]);

      // The useEffect will handle fetching ONLY leads data when currentTab changes
      // No stats refresh needed - they stay the same across tabs
    },
    [currentTab]
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

        const limit = 25;
        console.log(`📊 Fetching ${currentTabConfig.label} data`);

        let leadsResponse;

        if (currentTabConfig.label === "For You") {
          // Special handling for "For You" tab - fetch personal submissions
          leadsResponse = await leadService.getMySubmittedLeads({
            limit,
            page: 1,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          setPersonalLeads(leadsResponse.data || []);
        } else if (currentTabConfig.label === "All Leads") {
          leadsResponse = await leadService.getAllLeads({
            limit,
            offset: 0,
            sortBy: "createdAt",
            sortOrder: "desc",
          });

          if (leadsResponse.data) {
            leadsResponse.data = leadsResponse.data.filter((lead) => {
              // Get the current status from timeline if available, otherwise fallback to status field
              const currentStatus =
                lead.timeline &&
                Array.isArray(lead.timeline) &&
                lead.timeline.length > 0
                  ? lead.timeline[lead.timeline.length - 1].status
                  : lead.status;
              return currentTabConfig.statuses.includes(currentStatus);
            });
          }
        } else {
          if (currentTabConfig.statuses.length === 1) {
            leadsResponse = await leadService.getLeadsByStatus(
              currentTabConfig.statuses[0],
              {
                limit,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "desc",
              }
            );
          } else {
            // For tabs with multiple statuses, get all leads and filter
            leadsResponse = await leadService.getAllLeads({
              limit: limit * 3, // Get more to ensure we have enough after filtering
              offset: 0,
              sortBy: "createdAt",
              sortOrder: "desc",
            });

            if (leadsResponse.data) {
              leadsResponse.data = leadsResponse.data
                .filter((lead) => {
                  // Get the current status from timeline if available, otherwise fallback to status field
                  const currentStatus =
                    lead.timeline &&
                    Array.isArray(lead.timeline) &&
                    lead.timeline.length > 0
                      ? lead.timeline[lead.timeline.length - 1].status
                      : lead.status;
                  return currentTabConfig.statuses.includes(currentStatus);
                })
                .slice(0, limit);
            }
          }
        }

        const newLeads = leadsResponse.data || [];
        const hasMore =
          leadsResponse.pagination?.hasMore || newLeads.length >= limit;

        console.log(
          `📊 Received ${newLeads.length} leads, hasMore: ${hasMore}`
        );

        setLeads(newLeads);
        setPagination({
          hasMore,
          offset: newLeads.length,
          limit,
        });
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
  }, [currentTab, refreshTrigger, userRole]);

  // Auto-refresh every 2 minutes (120 seconds) - only refreshes leads, not stats
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing current tab leads only...");
      setRefreshTrigger((prev) => prev + 1);
    }, 120000); // Changed from 60000 to 120000 (2 minutes)

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

  // Filter data based on search term
  const filteredLeads = useMemo(() => {
    const tabLeads = getCurrentTabLeads;
    if (!searchTerm) return tabLeads;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return tabLeads.filter(
      (lead) =>
        lead.name?.toLowerCase().includes(lowerSearchTerm) ||
        lead.email?.toLowerCase().includes(lowerSearchTerm) ||
        lead.phone?.toLowerCase().includes(lowerSearchTerm) ||
        (typeof lead.program === "string" &&
          lead.program?.toLowerCase().includes(lowerSearchTerm)) ||
        (typeof lead.program === "object" &&
          lead.program !== null &&
          (lead.program.name?.toLowerCase().includes(lowerSearchTerm) ||
            lead.program.code?.toLowerCase().includes(lowerSearchTerm))) ||
        lead.source?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [getCurrentTabLeads, searchTerm]);

  // Keep applications filtering for future use
  // const filteredApplications = applications.filter(
  //   (app) =>
  //     app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     app.program?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

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
                    <TextField
                      id="lead-search-field"
                      placeholder="Search by name, email, phone, program..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ minWidth: 350 }}
                      variant="outlined"
                      size="small"
                      autoComplete="off"
                      disabled={loading || tabSwitching}
                      inputProps={{
                        "aria-label": "search leads",
                      }}
                    />
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
                                {searchTerm
                                  ? "No leads found matching your search."
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

                  {/* Load More Button */}
                  {pagination.hasMore && (
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
                        disabled={loadingMore}
                        startIcon={
                          loadingMore ? <CircularProgress size={16} /> : null
                        }
                      >
                        {loadingMore ? "Loading..." : `Load More Leads`}
                      </Button>
                    </Box>
                  )}

                  {!pagination.hasMore && leads.length > 25 && (
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
