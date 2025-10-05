/**
 * ConversionPlan Component - Lead Management Dashboard
 *
 * UI/UX Improvements Applied:
 * - Simplified color system with solid colors (removed gradients)
 * - Reduced visual clutter and improved information hierarchy
 * - Compact stat cards with better readability
 * - Streamlined table design with consistent styling
 * - Simplified filter section for better usability
 * - Optimized team sidebar with cleaner layout
 * - Removed unnecessary animations and hover effects
 * - Cleaned up unused imports for better performance
 *
 * Key Features:
 * - Lead filtering and search functionality
 * - Bulk lead assignment to team members
 * - Real-time data refresh with caching
 * - Country-based lead organization
 * - Team member capacity tracking
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Alert,
  LinearProgress,
  Badge,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useSnackbar } from "notistack";
import { leadService } from "../../services/leadService";
import { useConversionLeadsCache } from "../../hooks/useConversionLeadsCache";
import logger from "../../utils/logger";

const ConversionPlan = () => {
  const { user, getUserRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Comprehensive country mapping with flags and names - MEMOIZED FOR PERFORMANCE
  const getCountryInfo = useCallback((countryCode) => {
    // Remove + and normalize country code
    const cleanCode = countryCode?.toString().replace("+", "");

    const countryDatabase = {
      // East Africa
      256: { name: "Uganda", flag: "🇺🇬", code: "UG" },
      254: { name: "Kenya", flag: "🇰🇪", code: "KE" },
      250: { name: "Rwanda", flag: "🇷🇼", code: "RW" },
      255: { name: "Tanzania", flag: "🇹🇿", code: "TZ" },
      257: { name: "Burundi", flag: "🇧🇮", code: "BI" },
      251: { name: "Ethiopia", flag: "🇪🇹", code: "ET" },
      252: { name: "Somalia", flag: "🇸🇴", code: "SO" },
      253: { name: "Djibouti", flag: "🇩🇯", code: "DJ" },

      // West Africa
      234: { name: "Nigeria", flag: "🇳🇬", code: "NG" },
      233: { name: "Ghana", flag: "🇬🇭", code: "GH" },
      221: { name: "Senegal", flag: "🇸🇳", code: "SN" },
      225: { name: "Ivory Coast", flag: "🇨🇮", code: "CI" },
      226: { name: "Burkina Faso", flag: "🇧🇫", code: "BF" },
      227: { name: "Niger", flag: "🇳🇪", code: "NE" },
      228: { name: "Togo", flag: "🇹🇬", code: "TG" },
      229: { name: "Benin", flag: "🇧🇯", code: "BJ" },
      230: { name: "Mauritius", flag: "🇲🇺", code: "MU" },
      231: { name: "Liberia", flag: "🇱🇷", code: "LR" },
      232: { name: "Sierra Leone", flag: "🇸🇱", code: "SL" },
      235: { name: "Chad", flag: "🇹🇩", code: "TD" },
      236: { name: "Central African Republic", flag: "🇨🇫", code: "CF" },
      237: { name: "Cameroon", flag: "🇨🇲", code: "CM" },
      238: { name: "Cape Verde", flag: "🇨🇻", code: "CV" },
      239: { name: "Sao Tome and Principe", flag: "🇸🇹", code: "ST" },
      240: { name: "Equatorial Guinea", flag: "🇬🇶", code: "GQ" },
      241: { name: "Gabon", flag: "🇬🇦", code: "GA" },
      242: { name: "Republic of Congo", flag: "🇨🇬", code: "CG" },
      243: { name: "Democratic Republic of Congo", flag: "🇨🇩", code: "CD" },
      244: { name: "Angola", flag: "🇦🇴", code: "AO" },
      245: { name: "Guinea-Bissau", flag: "🇬🇼", code: "GW" },
      246: { name: "British Indian Ocean Territory", flag: "🇮🇴", code: "IO" },
      247: { name: "Ascension Island", flag: "🇦🇨", code: "AC" },
      248: { name: "Seychelles", flag: "🇸🇨", code: "SC" },
      249: { name: "Sudan", flag: "🇸🇩", code: "SD" },

      // Southern Africa
      260: { name: "Zambia", flag: "🇿🇲", code: "ZM" },
      261: { name: "Madagascar", flag: "🇲🇬", code: "MG" },
      262: { name: "Reunion", flag: "🇷🇪", code: "RE" },
      263: { name: "Zimbabwe", flag: "🇿🇼", code: "ZW" },
      264: { name: "Namibia", flag: "🇳🇦", code: "NA" },
      265: { name: "Malawi", flag: "🇲🇼", code: "MW" },
      266: { name: "Lesotho", flag: "🇱🇸", code: "LS" },
      267: { name: "Botswana", flag: "🇧🇼", code: "BW" },
      268: { name: "Swaziland", flag: "🇸🇿", code: "SZ" },
      269: { name: "Comoros", flag: "🇰🇲", code: "KM" },
      27: { name: "South Africa", flag: "🇿🇦", code: "ZA" },

      // North Africa
      20: { name: "Egypt", flag: "🇪🇬", code: "EG" },
      212: { name: "Morocco", flag: "🇲🇦", code: "MA" },
      213: { name: "Algeria", flag: "🇩🇿", code: "DZ" },
      216: { name: "Tunisia", flag: "🇹🇳", code: "TN" },
      218: { name: "Libya", flag: "🇱🇾", code: "LY" },

      // Middle East & Gulf States
      961: { name: "Lebanon", flag: "🇱🇧", code: "LB" },
      962: { name: "Jordan", flag: "🇯🇴", code: "JO" },
      963: { name: "Syria", flag: "🇸🇾", code: "SY" },
      964: { name: "Iraq", flag: "🇮🇶", code: "IQ" },
      965: { name: "Kuwait", flag: "🇰🇼", code: "KW" },
      966: { name: "Saudi Arabia", flag: "🇸🇦", code: "SA" },
      967: { name: "Yemen", flag: "🇾🇪", code: "YE" },
      968: { name: "Oman", flag: "🇴🇲", code: "OM" },
      970: { name: "Palestine", flag: "🇵🇸", code: "PS" },
      971: { name: "United Arab Emirates", flag: "🇦🇪", code: "AE" },
      972: { name: "Israel", flag: "🇮🇱", code: "IL" },
      973: { name: "Bahrain", flag: "🇧🇭", code: "BH" },
      974: { name: "Qatar", flag: "🇶🇦", code: "QA" },

      // Other Asian Countries
      92: { name: "Pakistan", flag: "🇵🇰", code: "PK" },
      93: { name: "Afghanistan", flag: "🇦🇫", code: "AF" },
      94: { name: "Sri Lanka", flag: "🇱🇰", code: "LK" },
      95: { name: "Myanmar", flag: "🇲🇲", code: "MM" },
      98: { name: "Iran", flag: "🇮🇷", code: "IR" },
      60: { name: "Malaysia", flag: "🇲🇾", code: "MY" },
      62: { name: "Indonesia", flag: "🇮🇩", code: "ID" },
      63: { name: "Philippines", flag: "🇵🇭", code: "PH" },
      65: { name: "Singapore", flag: "🇸🇬", code: "SG" },
      66: { name: "Thailand", flag: "🇹🇭", code: "TH" },
      84: { name: "Vietnam", flag: "🇻🇳", code: "VN" },
      880: { name: "Bangladesh", flag: "🇧🇩", code: "BD" },

      // European Countries
      30: { name: "Greece", flag: "🇬🇷", code: "GR" },
      36: { name: "Hungary", flag: "🇭🇺", code: "HU" },
      40: { name: "Romania", flag: "🇷🇴", code: "RO" },
      351: { name: "Portugal", flag: "🇵🇹", code: "PT" },

      // Other regions (common international codes)
      1: { name: "United States/Canada", flag: "🇺🇸", code: "US" },
      44: { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
      33: { name: "France", flag: "🇫🇷", code: "FR" },
      49: { name: "Germany", flag: "🇩🇪", code: "DE" },
      39: { name: "Italy", flag: "🇮🇹", code: "IT" },
      34: { name: "Spain", flag: "🇪🇸", code: "ES" },
      31: { name: "Netherlands", flag: "🇳🇱", code: "NL" },
      32: { name: "Belgium", flag: "🇧🇪", code: "BE" },
      41: { name: "Switzerland", flag: "🇨🇭", code: "CH" },
      43: { name: "Austria", flag: "🇦🇹", code: "AT" },
      45: { name: "Denmark", flag: "🇩🇰", code: "DK" },
      46: { name: "Sweden", flag: "🇸🇪", code: "SE" },
      47: { name: "Norway", flag: "🇳🇴", code: "NO" },
      48: { name: "Poland", flag: "🇵🇱", code: "PL" },
      90: { name: "Turkey", flag: "🇹🇷", code: "TR" },
      91: { name: "India", flag: "🇮🇳", code: "IN" },
      86: { name: "China", flag: "🇨🇳", code: "CN" },
      81: { name: "Japan", flag: "🇯🇵", code: "JP" },
      82: { name: "South Korea", flag: "🇰🇷", code: "KR" },
      61: { name: "Australia", flag: "🇦🇺", code: "AU" },
      64: { name: "New Zealand", flag: "🇳🇿", code: "NZ" },
      55: { name: "Brazil", flag: "🇧🇷", code: "BR" },
      52: { name: "Mexico", flag: "🇲🇽", code: "MX" },
      7: { name: "Russia", flag: "🇷🇺", code: "RU" },
    };

    return (
      countryDatabase[cleanCode] || {
        name: `Unknown (+${cleanCode})`,
        flag: "🌍",
        code: cleanCode,
      }
    );
  }, []); // Memoized - no dependencies needed

  // Use the caching hook for leads and team data
  const {
    leads,
    teamMembers,
    loading,
    refreshing,
    error,
    lastFetch,
    refresh,
    clearCache,
    isCacheValid,
    optimisticallyAssignLeads,
    reconcileAfterBulk,
  } = useConversionLeadsCache();

  // Debug logging when data changes
  useEffect(() => {
    logger.debug("ConversionPlan dataset updated", {
      leads: leads.length,
      teamMembers: teamMembers.length,
      loading,
      error: Boolean(error),
      lastFetch,
      isCacheValid,
    });
  }, [leads, teamMembers, loading, error, lastFetch, isCacheValid]);

  // State management for UI
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50); // Reduced from 200 for faster initial render
  const [filters, setFilters] = useState({
    status: "all",
    country: "all",
    assignedTo: "all",
    searchTerm: "",
    startDate: "", // Single date - filters from this date to today
  });

  // Debounced search term for performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchDebounceRef = useRef(null);

  // Assignment dialog state
  const [assignmentDialog, setAssignmentDialog] = useState({
    open: false,
    selectedLeads: [],
    selectedAgent: "",
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null); // {assigned, failed, errors}

  // Selected leads for bulk operations
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // State for dynamic countries
  const [availableCountries, setAvailableCountries] = useState({});

  // Debounce search input for performance (300ms delay)
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [filters.searchTerm]);

  // Extract unique country codes from leads data - OPTIMIZED
  const availableCountriesFromLeads = useMemo(() => {
    if (!leads.length) return {};

    logger.debug("Extracting countries from leads", { count: leads.length });

    // Use a Map for O(1) lookups instead of Set
    const countryCodesMap = new Map();

    // Single pass through leads - much faster
    for (const lead of leads) {
      const countryCode = lead.countryCode || lead.country_code;

      if (countryCode && !countryCodesMap.has(countryCode)) {
        countryCodesMap.set(countryCode, getCountryInfo(countryCode));
      }
    }

    logger.debug("Found country codes", Array.from(countryCodesMap.keys()));

    // Convert Map to object for component compatibility
    return Object.fromEntries(countryCodesMap);
  }, [leads, getCountryInfo]);

  // Update available countries when leads change
  useEffect(() => {
    setAvailableCountries(availableCountriesFromLeads);
  }, [availableCountriesFromLeads]);

  // Handle refresh with cache invalidation
  const handleRefresh = async () => {
    try {
      logger.info("Refreshing data (manual trigger)");
      clearCache(); // Clear the cache first
      await refresh();
      enqueueSnackbar("Data refreshed successfully", { variant: "success" });
    } catch (error) {
      console.error("Error refreshing data:", error);
      enqueueSnackbar("Failed to refresh data", { variant: "error" });
    }
  };

  // Filter leads based on current filters - OPTIMIZED with useMemo
  const filteredLeadsData = useMemo(() => {
    try {
      // Early return for empty leads
      if (!leads || leads.length === 0) {
        return [];
      }

      logger.debug("Filter debug sample", {
        sampleLeadId: leads[0]?.id,
        totalLeads: leads.length,
        filters,
      });

      // Single-pass filtering with combined conditions for better performance
      const filtered = leads.filter((lead) => {
        // Status filter - early return
        if (filters.status !== "all") {
          const leadStatus = lead.status?.toLowerCase();
          if (leadStatus !== filters.status.toLowerCase()) {
            return false;
          }
        }

        // Country filter - early return
        if (filters.country !== "all") {
          const countryCode = lead.countryCode || lead.country_code;
          if (countryCode !== filters.country) {
            return false;
          }
        }

        // Assignment filter - early return
        if (filters.assignedTo !== "all") {
          const assignedTo =
            lead.assignedTo || lead.assigned_to || lead.assignedAgent;

          if (filters.assignedTo === "unassigned") {
            if (assignedTo && assignedTo !== "" && assignedTo !== null) {
              return false;
            }
          } else {
            if (assignedTo !== filters.assignedTo) {
              return false;
            }
          }
        }

        // Search filter using DEBOUNCED term - early return
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();
          const name = (lead.name || "").toLowerCase();
          const email = (lead.email || "").toLowerCase();
          const phone = (lead.phone || "").toLowerCase();

          if (
            !name.includes(searchLower) &&
            !email.includes(searchLower) &&
            !phone.includes(searchLower)
          ) {
            return false;
          }
        }

        // Date filter - from selected date to today - early return
        if (filters.startDate) {
          const leadDate =
            lead.createdAt ||
            lead.created_at ||
            lead.dateCreated ||
            lead.date_created;

          if (leadDate) {
            const leadDateObj = new Date(leadDate);

            // Only filter if date is valid
            if (!isNaN(leadDateObj.getTime())) {
              // Check if lead date is on or after the start date
              const startDate = new Date(filters.startDate);
              startDate.setHours(0, 0, 0, 0);

              // Check if lead date is before today (end of today)
              const today = new Date();
              today.setHours(23, 59, 59, 999);

              // Lead must be between startDate and today
              if (leadDateObj < startDate || leadDateObj > today) {
                return false;
              }
            }
          }
        }

        // If all filters pass, include the lead
        return true;
      });

      logger.info("Filtered leads computed", { count: filtered.length });
      return filtered;
    } catch (error) {
      console.error("❌ Error in filtering logic:", error);
      // Fallback to showing all leads if filtering fails
      return leads;
    }
  }, [leads, filters, debouncedSearchTerm]);

  // Update filtered leads state when filtered data changes
  useEffect(() => {
    setFilteredLeads(filteredLeadsData);
    setPage(0); // Reset to first page when filtering
  }, [filteredLeadsData]);

  // Statistics calculations - OPTIMIZED with single pass
  const stats = useMemo(() => {
    // Single pass through filtered leads instead of 5 separate iterations
    return filteredLeads.reduce(
      (acc, lead) => {
        acc.totalLeads++;

        if (!lead.assignedTo) {
          acc.unassigned++;
        }

        if (lead.status === "contacted") {
          acc.contacted++;
        }

        if (lead.status === "interested") {
          acc.interested++;
        }

        if (lead.priority === "high") {
          acc.highPriority++;
        }

        return acc;
      },
      {
        totalLeads: 0,
        unassigned: 0,
        contacted: 0,
        interested: 0,
        highPriority: 0,
      }
    );
  }, [filteredLeads]);

  // Check if user is an agent and deny access - AFTER all hooks
  const userRole = getUserRole();
  const isAgent =
    userRole === "marketingAgent" || userRole === "admissionAgent";

  if (isAgent) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          You don't have permission to access the conversion plan.
        </Typography>
      </Box>
    );
  }

  // Legacy country mapping for fallback
  const countryMapping = {
    256: { name: "Uganda", flag: "🇺🇬", code: "UG" },
    254: { name: "Kenya", flag: "🇰🇪", code: "KE" },
    250: { name: "Rwanda", flag: "🇷🇼", code: "RW" },
    255: { name: "Tanzania", flag: "🇹🇿", code: "TZ" },
    234: { name: "Nigeria", flag: "🇳🇬", code: "NG" },
    233: { name: "Ghana", flag: "🇬🇭", code: "GH" },
  };

  // Handle select all checkbox
  const handleSelectAll = (event) => {
    setSelectAll(event.target.checked);
    if (event.target.checked) {
      const currentPageLeads = filteredLeads
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((lead) => lead.id);
      setSelectedLeads(currentPageLeads);
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle individual lead selection
  const handleLeadSelect = (leadId) => {
    setSelectedLeads((prev) => {
      if (prev.includes(leadId)) {
        return prev.filter((id) => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    // Reset selections when filters change
    setSelectedLeads([]);
    setSelectAll(false);
  };

  // Handle assignment with real API calls
  const handleAssignLeads = async (leadIds, agentName) => {
    try {
      setIsAssigning(true);
      setAssignmentResult(null);
      // Find the selected agent
      const selectedAgent = teamMembers.find((m) => m.name === agentName);
      if (!selectedAgent) {
        enqueueSnackbar("Agent not found", { variant: "error" });
        setIsAssigning(false);
        return;
      }

      // Optimistic local update
      optimisticallyAssignLeads(
        leadIds,
        { email: selectedAgent.email, name: selectedAgent.name },
        {
          assignedByEmail: user?.email,
          assignedByName: user?.displayName || user?.email,
          notes: `Bulk assigned to ${selectedAgent.name} by ${
            user.displayName || user.email
          }`,
        }
      );

      // Make API call using leadService for consistency
      const response = await leadService.bulkAssignLeads(
        leadIds,
        selectedAgent,
        `Bulk assigned to ${selectedAgent.name} by ${
          user.displayName || user.email
        }`
      );

      if (response.success) {
        setAssignmentResult(response.results);
        reconcileAfterBulk(response.results, leadIds);
        enqueueSnackbar(
          `${response.results.assigned} assigned, ${response.results.failed} failed`,
          { variant: response.results.failed ? "warning" : "success" }
        );
        // Background refresh (do not await to keep UI snappy)
        refresh();
      } else throw new Error("Assignment failed");
    } catch (error) {
      console.error("Error assigning leads:", error);
      enqueueSnackbar("Failed to assign leads", { variant: "error" });
      setAssignmentResult({
        assigned: 0,
        failed: leadIds?.length || 0,
        errors: [{ error: error.message }],
      });
    } finally {
      setIsAssigning(false);
      // Clear selections and close dialog
      setSelectedLeads([]);
      setSelectAll(false);
      // Keep dialog open briefly to display results if any
      setTimeout(() => {
        setAssignmentDialog({
          open: false,
          selectedLeads: [],
          selectedAgent: "",
        });
        setAssignmentResult(null);
      }, 1200);
    }
  };

  // Handle single lead assignment directly from table
  const handleQuickAssign = (leadId, agentName) => {
    handleAssignLeads([leadId], agentName);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "contacted":
        return "primary";
      case "interested":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#f9fafb",
        minHeight: "100vh",
        p: 3,
      }}
    >
      {/* Simplified Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight="600"
          sx={{ color: "#111827", mb: 0.5 }}
        >
          Lead Conversion Management
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          Manage and assign leads to your marketing team
        </Typography>
      </Box>

      {/* Simplified Statistics Dashboard with Progressive Loading */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 1.5,
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "#d1d5db",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <GroupIcon sx={{ fontSize: 20, color: "#6b7280" }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  Total Leads
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width={80} height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight="700"
                  sx={{ color: "#111827" }}
                >
                  {stats.totalLeads}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 1.5,
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "#fcd34d",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <PersonAddIcon sx={{ fontSize: 20, color: "#d97706" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#92400e", fontWeight: 500 }}
                >
                  Unassigned
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width={80} height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight="700"
                  sx={{ color: "#92400e" }}
                >
                  {stats.unassigned}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 1.5,
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "#93c5fd",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <PhoneIcon sx={{ fontSize: 20, color: "#2563eb" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#1e40af", fontWeight: 500 }}
                >
                  Contacted
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width={80} height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight="700"
                  sx={{ color: "#1e40af" }}
                >
                  {stats.contacted}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 1.5,
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "#86efac",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 20, color: "#16a34a" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#166534", fontWeight: 500 }}
                >
                  Interested
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width={80} height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight="700"
                  sx={{ color: "#166534" }}
                >
                  {stats.interested}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 1.5,
              transition: "border-color 0.2s",
              "&:hover": {
                borderColor: "#fca5a5",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <FlagIcon sx={{ fontSize: 20, color: "#dc2626" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "#991b1b", fontWeight: 500 }}
                >
                  High Priority
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width={80} height={40} />
              ) : (
                <Typography
                  variant="h4"
                  fontWeight="700"
                  sx={{ color: "#991b1b" }}
                >
                  {stats.highPriority}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Countries Info */}
      {Object.keys(availableCountries).length > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={false}>
          <Typography variant="body2" component="span">
            <strong>Available Countries:</strong>{" "}
            {Object.keys(availableCountries).length} countries detected from
            leads data:{" "}
            {Object.values(availableCountries).map((country, index) => (
              <span key={index}>
                {country.flag} {country.name}
                {index < Object.keys(availableCountries).length - 1 ? ", " : ""}
              </span>
            ))}
          </Typography>
        </Alert>
      )}

      {/* Loading indicator */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Simplified Leads Management Center */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: "#ffffff",
              borderRadius: 1.5,
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Simplified Header with Actions */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ color: "#111827" }}
                  >
                    Lead Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredLeads.length} leads
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outlined"
                  >
                    Refresh
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    variant="outlined"
                  >
                    Export
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AssignmentIcon />}
                    onClick={() =>
                      setAssignmentDialog((prev) => ({
                        ...prev,
                        open: true,
                        selectedLeads:
                          selectedLeads.length > 0 ? selectedLeads : [],
                      }))
                    }
                    disabled={selectedLeads.length === 0}
                  >
                    Assign ({selectedLeads.length})
                  </Button>
                </Stack>
              </Box>

              {/* Simplified Filter Controls */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 1.5,
                }}
              >
                <Grid container spacing={2}>
                  {/* Search Input - Full Width */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by name, email, or phone..."
                      value={filters.searchTerm}
                      onChange={(e) =>
                        handleFilterChange("searchTerm", e.target.value)
                      }
                      InputProps={{
                        startAdornment: (
                          <SearchIcon
                            sx={{
                              mr: 1,
                              color: "text.secondary",
                              fontSize: 20,
                            }}
                          />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>

                  {/* Filter Dropdowns */}
                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) =>
                          handleFilterChange("status", e.target.value)
                        }
                        sx={{ bgcolor: "white" }}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="contacted">Contacted</MenuItem>
                        <MenuItem value="interested">Interested</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={filters.country}
                        label="Country"
                        onChange={(e) =>
                          handleFilterChange("country", e.target.value)
                        }
                        sx={{ bgcolor: "white" }}
                      >
                        <MenuItem value="all">All Countries</MenuItem>
                        {Object.entries(availableCountries).length > 0
                          ? Object.entries(availableCountries).map(
                              ([code, country]) => (
                                <MenuItem key={code} value={code}>
                                  {country.flag} {country.name}
                                </MenuItem>
                              )
                            )
                          : Object.entries(countryMapping).map(
                              ([code, country]) => (
                                <MenuItem key={code} value={code}>
                                  {country.flag} {country.name}
                                </MenuItem>
                              )
                            )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Assignment</InputLabel>
                      <Select
                        value={filters.assignedTo}
                        label="Assignment"
                        onChange={(e) =>
                          handleFilterChange("assignedTo", e.target.value)
                        }
                        sx={{ bgcolor: "white" }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        {teamMembers.map((member) => (
                          <MenuItem key={member.id} value={member.email}>
                            {member.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Streamlined Date Picker matching other filters */}
                  <Grid item xs={12} sm={6} md={2.4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Date Filter"
                      value={filters.startDate}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#6b7280",
                        },
                      }}
                      inputProps={{
                        max: new Date().toISOString().split("T")[0],
                      }}
                      sx={{
                        bgcolor: "white",
                        "& .MuiOutlinedInput-root": {
                          fontSize: "0.875rem",
                          "& fieldset": {
                            borderColor: "#e5e7eb",
                          },
                          "&:hover fieldset": {
                            borderColor: "#d1d5db",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                            borderWidth: "1px",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: filters.startDate ? "#111827" : "#9ca3af",
                        },
                      }}
                    />
                    {filters.startDate && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#059669",
                          fontSize: "0.688rem",
                          display: "block",
                          mt: 0.5,
                          fontWeight: 500,
                        }}
                      >
                        ✓{" "}
                        {new Date(filters.startDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}{" "}
                        → Today
                      </Typography>
                    )}
                  </Grid>

                  {/* Reset Button */}
                  <Grid item xs={12}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setFilters({
                          status: "all",
                          country: "all",
                          assignedTo: "all",
                          searchTerm: "",
                          startDate: "",
                        });
                      }}
                      sx={{
                        color: "#6b7280",
                        textTransform: "uppercase",
                        fontSize: "0.813rem",
                        letterSpacing: 0.5,
                        fontWeight: 500,
                        "&:hover": {
                          bgcolor: "#f3f4f6",
                          color: "#111827",
                        },
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Simplified Data Table */}
            <TableContainer
              sx={{
                bgcolor: "white",
                borderRadius: 1.5,
                border: "1px solid #e5e7eb",
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "#f9fafb",
                      "& .MuiTableCell-head": {
                        fontWeight: 600,
                        fontSize: "0.813rem",
                        color: "#374151",
                        borderBottom: "1px solid #e5e7eb",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={
                          selectedLeads.length > 0 &&
                          selectedLeads.length <
                            filteredLeads.slice(
                              page * rowsPerPage,
                              page * rowsPerPage + rowsPerPage
                            ).length
                        }
                      />
                    </TableCell>
                    <TableCell>Lead</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell padding="checkbox">
                          <Skeleton
                            variant="rectangular"
                            width={20}
                            height={20}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Skeleton
                              variant="circular"
                              width={44}
                              height={44}
                            />
                            <Box>
                              <Skeleton
                                variant="text"
                                width={120}
                                height={20}
                              />
                              <Skeleton variant="text" width={80} height={16} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Skeleton variant="text" width={100} height={16} />
                            <Skeleton variant="text" width={150} height={16} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Skeleton
                            variant="rectangular"
                            width={80}
                            height={24}
                          />
                        </TableCell>
                        <TableCell>
                          <Skeleton
                            variant="rectangular"
                            width={80}
                            height={24}
                          />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} height={16} />
                        </TableCell>
                        <TableCell>
                          <Skeleton
                            variant="rectangular"
                            width={120}
                            height={32}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredLeads.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          {error
                            ? "Failed to load leads"
                            : "No leads found matching your criteria"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Simplified data rows
                    filteredLeads
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((lead, index) => {
                        const countryInfo =
                          availableCountries[
                            lead.countryCode || lead.country_code
                          ] ||
                          countryMapping[
                            lead.countryCode || lead.country_code
                          ] ||
                          getCountryInfo(lead.countryCode || lead.country_code);

                        const assignedTo =
                          lead.assignedTo ||
                          lead.assigned_to ||
                          lead.assignedAgent;
                        const teamMember = assignedTo
                          ? teamMembers.find(
                              (m) =>
                                m.email === assignedTo || m.name === assignedTo
                            )
                          : null;
                        const displayName = teamMember
                          ? teamMember.name
                          : assignedTo;

                        return (
                          <TableRow
                            key={lead.id}
                            hover
                            sx={{
                              "&:nth-of-type(even)": {
                                bgcolor: "#f9fafb",
                              },
                              "&:hover": {
                                bgcolor: "#f3f4f6",
                              },
                              cursor: "pointer",
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedLeads.includes(lead.id)}
                                onChange={() => handleLeadSelect(lead.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: "#2563eb",
                                    width: 36,
                                    height: 36,
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {lead.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight="600"
                                    sx={{ color: "#111827" }}
                                  >
                                    {lead.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#6b7280" }}
                                  >
                                    {countryInfo?.flag} {countryInfo?.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#374151", mb: 0.5 }}
                                >
                                  {lead.phone}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#6b7280" }}
                                  noWrap
                                >
                                  {lead.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={lead.status}
                                color={getStatusColor(lead.status)}
                                size="small"
                                sx={{
                                  textTransform: "capitalize",
                                  fontWeight: 500,
                                  fontSize: "0.75rem",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={lead.priority}
                                color={getPriorityColor(lead.priority)}
                                size="small"
                                variant="outlined"
                                sx={{
                                  textTransform: "capitalize",
                                  fontWeight: 500,
                                  fontSize: "0.75rem",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {assignedTo ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {displayName.charAt(0)}
                                  </Avatar>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#374151" }}
                                  >
                                    {displayName}
                                  </Typography>
                                </Box>
                              ) : (
                                <Chip
                                  label="Unassigned"
                                  color="warning"
                                  variant="outlined"
                                  size="small"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={assignedTo || ""}
                                  displayEmpty
                                  onChange={(e) => {
                                    if (
                                      e.target.value &&
                                      e.target.value !== assignedTo
                                    ) {
                                      const selectedMember = teamMembers.find(
                                        (m) => m.email === e.target.value
                                      );
                                      const agentName = selectedMember
                                        ? selectedMember.name
                                        : e.target.value;
                                      handleQuickAssign(lead.id, agentName);
                                    }
                                  }}
                                  sx={{ fontSize: "0.813rem" }}
                                >
                                  <MenuItem value="">
                                    <em>Select Agent</em>
                                  </MenuItem>
                                  {teamMembers.map((member) => (
                                    <MenuItem
                                      key={member.id}
                                      value={member.email}
                                    >
                                      {member.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[50, 100, 200, 500, 1000, 5000]}
              component="div"
              count={filteredLeads.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </Grid>

        {/* Simplified Team Members Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: "1px solid #e5e7eb",
              borderRadius: 1.5,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="600"
              sx={{ mb: 0.5, color: "#111827" }}
            >
              Team Members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {teamMembers.length} active agents
            </Typography>

            <List sx={{ p: 0 }}>
              {teamMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: "#f9fafb",
                      borderRadius: 1,
                      mb: 1,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color={
                          member.status === "online" ? "success" : "default"
                        }
                        variant="dot"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                      >
                        <Avatar
                          sx={{ bgcolor: "#2563eb", width: 36, height: 36 }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#111827" }}
                        >
                          {member.name}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {member.conversionRate}% conversion rate
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="h6" fontWeight="600" color="primary">
                        {member.assignedCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        leads
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            <Button
              variant="outlined"
              fullWidth
              size="small"
              startIcon={<PersonAddIcon />}
              sx={{ mt: 2 }}
            >
              Add Team Member
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialog.open}
        onClose={() =>
          setAssignmentDialog({
            open: false,
            selectedLeads: [],
            selectedAgent: "",
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon />
            Assign Leads to Marketing Agent
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Select a marketing agent to assign the selected leads.
          </Alert>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Marketing Agent</InputLabel>
            <Select
              value={assignmentDialog.selectedAgent}
              label="Select Marketing Agent"
              onChange={(e) =>
                setAssignmentDialog((prev) => ({
                  ...prev,
                  selectedAgent: e.target.value,
                }))
              }
            >
              {teamMembers.map((member) => (
                <MenuItem key={member.id} value={member.name}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{member.name}</Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Current assignments
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {member.assignedCount} leads
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Leads to be assigned:{" "}
            {selectedLeads.length > 0
              ? selectedLeads.length
              : assignmentDialog.selectedLeads.length}
          </Typography>

          {/* Show selected leads preview */}
          {(selectedLeads.length > 0 ||
            assignmentDialog.selectedLeads.length > 0) && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selected leads:
              </Typography>
              <Box sx={{ maxHeight: 150, overflow: "auto" }}>
                {leads
                  .filter((lead) =>
                    (selectedLeads.length > 0
                      ? selectedLeads
                      : assignmentDialog.selectedLeads
                    ).includes(lead.id)
                  )
                  .map((lead) => (
                    <Chip
                      key={lead.id}
                      label={`${lead.name} (${lead.country})`}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setAssignmentDialog({
                open: false,
                selectedLeads: [],
                selectedAgent: "",
              })
            }
          >
            Cancel
          </Button>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Button
              variant="contained"
              onClick={() =>
                handleAssignLeads(
                  selectedLeads.length > 0
                    ? selectedLeads
                    : assignmentDialog.selectedLeads,
                  assignmentDialog.selectedAgent
                )
              }
              disabled={!assignmentDialog.selectedAgent || isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign Leads"}
            </Button>
            {isAssigning && (
              <LinearProgress
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -4,
                  height: 3,
                  borderRadius: 2,
                }}
              />
            )}
          </Box>
        </DialogActions>
        {isAssigning && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Processing assignment... This may take a moment.
            </Typography>
          </Box>
        )}
        {assignmentResult && !isAssigning && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity={assignmentResult.failed ? "warning" : "success"}>
              Assigned: {assignmentResult.assigned} | Failed:{" "}
              {assignmentResult.failed}
            </Alert>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default ConversionPlan;
