import React, { useState, useEffect, useMemo } from "react";
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
  Divider,
  Alert,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
  Stack,
  ButtonGroup,
  Skeleton,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useSnackbar } from "notistack";
import { leadService } from "../../services/leadService";
import { useConversionLeadsCache } from "../../hooks/useConversionLeadsCache";
import logger from "../../utils/logger";

const ConversionPlan = () => {
  const { user, getUserRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Comprehensive country mapping with flags and names - MOVED TO TOP TO AVOID HOISTING ISSUES
  const getCountryInfo = (countryCode) => {
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
  };

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
  const [rowsPerPage, setRowsPerPage] = useState(200);
  const [filters, setFilters] = useState({
    status: "all",
    country: "all",
    assignedTo: "all",
    searchTerm: "",
  });

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

  // Extract unique country codes from leads data
  const availableCountriesFromLeads = useMemo(() => {
    if (!leads.length) return {};

    logger.debug("Extracting countries from leads", { count: leads.length });
    const countryCodes = new Set();

    leads.forEach((lead, index) => {
      // Use the countryCode field that was already extracted in the hook
      const countryCode = lead.countryCode || lead.country_code;

      if (countryCode) {
        countryCodes.add(countryCode);

        // Debug logging for first few leads
        // trimmed verbose per-lead logging
      } else if (lead.phone) {
        // Fallback: extract from phone if countryCode is missing
        let cleanPhone = lead.phone.replace(/\D/g, "");

        // Remove leading zeros
        while (cleanPhone.startsWith("0")) {
          cleanPhone = cleanPhone.substring(1);
        }

        // Complete country code mapping (same as hook)
        const countryCodeMap = {
          // 3-digit codes (most common for our region)
          212: "Morocco",
          213: "Algeria",
          216: "Tunisia",
          218: "Libya",
          220: "Gambia",
          221: "Senegal",
          222: "Mauritania",
          223: "Mali",
          224: "Guinea",
          225: "Ivory Coast",
          226: "Burkina Faso",
          227: "Niger",
          228: "Togo",
          229: "Benin",
          230: "Mauritius",
          231: "Liberia",
          232: "Sierra Leone",
          233: "Ghana",
          234: "Nigeria",
          235: "Chad",
          236: "Central African Republic",
          237: "Cameroon",
          238: "Cape Verde",
          239: "Sao Tome and Principe",
          240: "Equatorial Guinea",
          241: "Gabon",
          242: "Republic of Congo",
          243: "Democratic Republic of Congo",
          244: "Angola",
          245: "Guinea-Bissau",
          246: "British Indian Ocean Territory",
          248: "Seychelles",
          249: "Sudan",
          250: "Rwanda",
          251: "Ethiopia",
          252: "Somalia",
          253: "Djibouti",
          254: "Kenya",
          255: "Tanzania",
          256: "Uganda",
          257: "Burundi",
          258: "Mozambique",
          260: "Zambia",
          261: "Madagascar",
          262: "Reunion",
          263: "Zimbabwe",
          264: "Namibia",
          265: "Malawi",
          266: "Lesotho",
          267: "Botswana",
          268: "Swaziland",
          269: "Comoros",
          290: "Saint Helena",
          291: "Eritrea",
          297: "Aruba",
          298: "Faroe Islands",
          299: "Greenland",
          350: "Gibraltar",
          351: "Portugal",
          352: "Luxembourg",
          353: "Ireland",
          354: "Iceland",
          355: "Albania",
          356: "Malta",
          357: "Cyprus",
          358: "Finland",
          359: "Bulgaria",
          370: "Lithuania",
          371: "Latvia",
          372: "Estonia",
          373: "Moldova",
          374: "Armenia",
          375: "Belarus",
          376: "Andorra",
          377: "Monaco",
          378: "San Marino",
          380: "Ukraine",
          381: "Serbia",
          382: "Montenegro",
          383: "Kosovo",
          385: "Croatia",
          386: "Slovenia",
          387: "Bosnia and Herzegovina",
          389: "North Macedonia",
          420: "Czech Republic",
          421: "Slovakia",
          423: "Liechtenstein",
          500: "Falkland Islands",
          501: "Belize",
          502: "Guatemala",
          503: "El Salvador",
          504: "Honduras",
          505: "Nicaragua",
          506: "Costa Rica",
          507: "Panama",
          508: "Saint Pierre and Miquelon",
          509: "Haiti",
          590: "Guadeloupe",
          591: "Bolivia",
          592: "Guyana",
          593: "Ecuador",
          594: "French Guiana",
          595: "Paraguay",
          596: "Martinique",
          597: "Suriname",
          598: "Uruguay",
          599: "Netherlands Antilles",
          670: "East Timor",
          672: "Antarctica",
          673: "Brunei",
          674: "Nauru",
          675: "Papua New Guinea",
          676: "Tonga",
          677: "Solomon Islands",
          678: "Vanuatu",
          679: "Fiji",
          680: "Palau",
          681: "Wallis and Futuna",
          682: "Cook Islands",
          683: "Niue",
          684: "American Samoa",
          685: "Samoa",
          686: "Kiribati",
          687: "New Caledonia",
          688: "Tuvalu",
          689: "French Polynesia",
          690: "Tokelau",
          691: "Micronesia",
          692: "Marshall Islands",
          850: "North Korea",
          852: "Hong Kong",
          853: "Macau",
          855: "Cambodia",
          856: "Laos",
          880: "Bangladesh",
          886: "Taiwan",
          960: "Maldives",
          961: "Lebanon",
          962: "Jordan",
          963: "Syria",
          964: "Iraq",
          965: "Kuwait",
          966: "Saudi Arabia",
          967: "Yemen",
          968: "Oman",
          970: "Palestine",
          971: "United Arab Emirates",
          972: "Israel",
          973: "Bahrain",
          974: "Qatar",
          975: "Bhutan",
          976: "Mongolia",
          977: "Nepal",
          992: "Tajikistan",
          993: "Turkmenistan",
          994: "Azerbaijan",
          995: "Georgia",
          996: "Kyrgyzstan",
          998: "Uzbekistan",

          // 2-digit codes
          20: "Egypt",
          27: "South Africa",
          30: "Greece",
          31: "Netherlands",
          32: "Belgium",
          33: "France",
          34: "Spain",
          36: "Hungary",
          39: "Italy",
          40: "Romania",
          41: "Switzerland",
          43: "Austria",
          44: "United Kingdom",
          45: "Denmark",
          46: "Sweden",
          47: "Norway",
          48: "Poland",
          49: "Germany",
          51: "Peru",
          52: "Mexico",
          53: "Cuba",
          54: "Argentina",
          55: "Brazil",
          56: "Chile",
          57: "Colombia",
          58: "Venezuela",
          60: "Malaysia",
          61: "Australia",
          62: "Indonesia",
          63: "Philippines",
          64: "New Zealand",
          65: "Singapore",
          66: "Thailand",
          81: "Japan",
          82: "South Korea",
          84: "Vietnam",
          86: "China",
          90: "Turkey",
          91: "India",
          92: "Pakistan",
          93: "Afghanistan",
          94: "Sri Lanka",
          95: "Myanmar",
          98: "Iran",

          // 1-digit codes
          1: "United States/Canada",
          7: "Russia/Kazakhstan",
        };

        // Try to match country codes by length (longest first for accuracy)
        const codeLengths = [4, 3, 2, 1];

        for (const length of codeLengths) {
          if (cleanPhone.length >= length) {
            const potentialCode = cleanPhone.substring(0, length);
            if (countryCodeMap[potentialCode]) {
              countryCodes.add(potentialCode);
              break;
            }
          }
        }

        // Debug logging for first few leads
        // trimmed verbose per-lead fallback logging
      }
    });

    logger.debug("Found country codes", Array.from(countryCodes));

    // Convert to array and create mapping
    const availableCountries = {};
    countryCodes.forEach((code) => {
      availableCountries[code] = getCountryInfo(code);
    });

    return availableCountries;
  }, [leads]);

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

  // Filter leads based on current filters
  useEffect(() => {
    try {
      // Debug: Log the first few leads to understand data structure
      if (leads.length > 0) {
        logger.debug("Filter debug sample", {
          sampleLeadId: leads[0].id,
          totalLeads: leads.length,
          filters,
        });
      }

      let filtered = [...leads];

      // Status filter
      if (filters.status !== "all") {
        filtered = filtered.filter((lead) => {
          const leadStatus = lead.status?.toLowerCase();
          return leadStatus === filters.status.toLowerCase();
        });
        logger.debug("After status filter", {
          status: filters.status,
          count: filtered.length,
        });
      }

      // Country filter
      if (filters.country !== "all") {
        filtered = filtered.filter((lead) => {
          // Check multiple possible country code fields
          const countryCode = lead.countryCode || lead.country_code;
          const isMatch = countryCode === filters.country;

          // Debug logging for country filtering
          if (filtered.length < 5) {
            // omit noisy country filter debug
          }

          return isMatch;
        });
        logger.debug("After country filter", {
          country: filters.country,
          count: filtered.length,
        });
      }

      // Assignment filter
      if (filters.assignedTo !== "all") {
        if (filters.assignedTo === "unassigned") {
          filtered = filtered.filter((lead) => {
            // Check multiple possible assignment fields
            const assignedTo =
              lead.assignedTo || lead.assigned_to || lead.assignedAgent;
            return !assignedTo || assignedTo === "" || assignedTo === null;
          });
        } else {
          filtered = filtered.filter((lead) => {
            // Check multiple possible assignment fields and match with email
            const assignedTo =
              lead.assignedTo || lead.assigned_to || lead.assignedAgent;
            return assignedTo === filters.assignedTo;
          });
        }
        logger.debug("After assignment filter", {
          assignedTo: filters.assignedTo,
          count: filtered.length,
        });
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter((lead) => {
          // Add safety checks for undefined/null fields
          const name = (lead.name || "").toLowerCase();
          const email = (lead.email || "").toLowerCase();
          const phone = (lead.phone || "").toLowerCase();

          return (
            name.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower)
          );
        });
        logger.debug("After search filter", {
          term: filters.searchTerm,
          count: filtered.length,
        });
      }

      logger.info("Filtered leads computed", { count: filtered.length });
      setFilteredLeads(filtered);
      setPage(0); // Reset to first page when filtering
    } catch (error) {
      console.error("❌ Error in filtering logic:", error);
      // Fallback to showing all leads if filtering fails
      setFilteredLeads(leads);
    }
  }, [leads, filters]);

  // Statistics calculations
  const stats = useMemo(
    () => ({
      totalLeads: filteredLeads.length,
      unassigned: filteredLeads.filter((lead) => !lead.assignedTo).length,
      contacted: filteredLeads.filter((lead) => lead.status === "contacted")
        .length,
      interested: filteredLeads.filter((lead) => lead.status === "interested")
        .length,
      highPriority: filteredLeads.filter((lead) => lead.priority === "high")
        .length,
    }),
    [filteredLeads]
  );

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
        bgcolor: "#f8fafc",
        minHeight: "100vh",
        p: 3,
      }}
    >
      {/* Professional Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          bgcolor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
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
              variant="h4"
              fontWeight="600"
              sx={{
                color: "#1e293b",
                mb: 1,
              }}
            >
              Lead Conversion Management
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#64748b", fontWeight: 400 }}
            >
              Strategic lead assignment and conversion optimization platform
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Tooltip title="Real-time Analytics">
              <IconButton
                sx={{
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  "&:hover": {
                    bgcolor: "#e2e8f0",
                    borderColor: "#cbd5e1",
                  },
                }}
              >
                <AnalyticsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Performance Dashboard">
              <IconButton
                sx={{
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  "&:hover": {
                    bgcolor: "#e2e8f0",
                    borderColor: "#cbd5e1",
                  },
                }}
              >
                <TimelineIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mt: 3,
            p: 3,
            bgcolor: "#f8fafc",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <BusinessIcon sx={{ color: "#475569" }} />
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Enterprise-grade lead management with intelligent assignment
            algorithms and real-time performance tracking
          </Typography>
        </Box>
      </Paper>

      {/* Professional Statistics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#ffffff",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#f8fafc",
                    width: 56,
                    height: 56,
                  }}
                >
                  <GroupIcon sx={{ fontSize: 24, color: "#475569" }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{ color: "#1e293b", mb: 0.5 }}
              >
                {stats.totalLeads}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748b", fontWeight: 500, mb: 0.5 }}
              >
                Total Leads
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontSize: "0.75rem" }}
              >
                Active pipeline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#ffffff",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(251,191,36,0.12)",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#fef3c7",
                    width: 56,
                    height: 56,
                  }}
                >
                  <PersonAddIcon sx={{ fontSize: 24, color: "#d97706" }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{ color: "#d97706", mb: 0.5 }}
              >
                {stats.unassigned}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#92400e", fontWeight: 500, mb: 0.5 }}
              >
                Unassigned
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#a16207", fontSize: "0.75rem" }}
              >
                Requires attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#ffffff",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(59,130,246,0.12)",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#dbeafe",
                    width: 56,
                    height: 56,
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 24, color: "#1d4ed8" }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{ color: "#1d4ed8", mb: 0.5 }}
              >
                {stats.contacted}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#1e40af", fontWeight: 500, mb: 0.5 }}
              >
                Contacted
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#3730a3", fontSize: "0.75rem" }}
              >
                In progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#ffffff",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(16,185,129,0.12)",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#d1fae5",
                    width: 56,
                    height: 56,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 24, color: "#047857" }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{ color: "#047857", mb: 0.5 }}
              >
                {stats.interested}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#065f46", fontWeight: 500, mb: 0.5 }}
              >
                Interested
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#059669", fontSize: "0.75rem" }}
              >
                Warm prospects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            sx={{
              height: "100%",
              bgcolor: "#ffffff",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(239,68,68,0.12)",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#fee2e2",
                    width: 56,
                    height: 56,
                  }}
                >
                  <FlagIcon sx={{ fontSize: 24, color: "#dc2626" }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{ color: "#dc2626", mb: 0.5 }}
              >
                {stats.highPriority}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#991b1b", fontWeight: 500, mb: 0.5 }}
              >
                High Priority
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#b91c1c", fontSize: "0.75rem" }}
              >
                Urgent follow-up
              </Typography>
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
        {/* Professional Leads Management Center */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: "#ffffff",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {/* Professional Header with Actions */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    sx={{
                      background:
                        "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      mb: 0.5,
                    }}
                  >
                    Lead Management Center
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced lead processing and assignment workflow
                  </Typography>
                </Box>

                <ButtonGroup variant="contained" sx={{ boxShadow: 3 }}>
                  <Tooltip title="Refresh Data">
                    <Button
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{
                        background:
                          "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
                        },
                      }}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export Data">
                    <Button
                      startIcon={<DownloadIcon />}
                      sx={{
                        background:
                          "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)",
                        },
                      }}
                    >
                      Export
                    </Button>
                  </Tooltip>
                  <Tooltip title="Bulk Assignment">
                    <Button
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
                      sx={{
                        background:
                          "linear-gradient(45deg, #FF5722 30%, #FF7043 90%)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #D84315 30%, #FF5722 90%)",
                        },
                      }}
                    >
                      Assign ({selectedLeads.length})
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </Box>

              {/* Professional Filter Controls */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  background:
                    "linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 203, 243, 0.03) 100%)",
                  border: "1px solid rgba(33, 150, 243, 0.1)",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color="primary"
                  >
                    Advanced Filters
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search leads, emails, phones..."
                      value={filters.searchTerm}
                      onChange={(e) =>
                        handleFilterChange("searchTerm", e.target.value)
                      }
                      InputProps={{
                        startAdornment: (
                          <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          background: "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(10px)",
                          "&:hover": {
                            background: "rgba(255, 255, 255, 0.9)",
                          },
                          "&.Mui-focused": {
                            background: "rgba(255, 255, 255, 1)",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          background: "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(10px)",
                        },
                      }}
                    >
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) =>
                          handleFilterChange("status", e.target.value)
                        }
                      >
                        <MenuItem value="all">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                            All Status
                          </Box>
                        </MenuItem>
                        <MenuItem value="contacted">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <PhoneIcon
                              sx={{ fontSize: 16, color: "info.main" }}
                            />
                            Contacted
                          </Box>
                        </MenuItem>
                        <MenuItem value="interested">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <TrendingUpIcon
                              sx={{ fontSize: 16, color: "success.main" }}
                            />
                            Interested
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          background: "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(10px)",
                        },
                      }}
                    >
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={filters.country}
                        label="Country"
                        onChange={(e) =>
                          handleFilterChange("country", e.target.value)
                        }
                      >
                        <MenuItem value="all">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LocationIcon sx={{ fontSize: 16 }} />
                            All Countries
                          </Box>
                        </MenuItem>
                        {Object.entries(availableCountries).length > 0
                          ? Object.entries(availableCountries).map(
                              ([code, country]) => (
                                <MenuItem key={code} value={code}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography sx={{ fontSize: 16 }}>
                                      {country.flag}
                                    </Typography>
                                    {country.name}
                                  </Box>
                                </MenuItem>
                              )
                            )
                          : Object.entries(countryMapping).map(
                              ([code, country]) => (
                                <MenuItem key={code} value={code}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography sx={{ fontSize: 16 }}>
                                      {country.flag}
                                    </Typography>
                                    {country.name}
                                  </Box>
                                </MenuItem>
                              )
                            )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          background: "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(10px)",
                        },
                      }}
                    >
                      <InputLabel>Assignment</InputLabel>
                      <Select
                        value={filters.assignedTo}
                        label="Assignment"
                        onChange={(e) =>
                          handleFilterChange("assignedTo", e.target.value)
                        }
                      >
                        <MenuItem value="all">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <GroupIcon sx={{ fontSize: 16 }} />
                            All Assignments
                          </Box>
                        </MenuItem>
                        <MenuItem value="unassigned">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <WarningIcon
                              sx={{ fontSize: 16, color: "warning.main" }}
                            />
                            Unassigned
                          </Box>
                        </MenuItem>
                        {teamMembers.map((member) => (
                          <MenuItem key={member.id} value={member.email}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{ width: 20, height: 20, fontSize: 12 }}
                              >
                                {member.name.charAt(0)}
                              </Avatar>
                              {member.name} ({member.email})
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setFilters({
                          status: "all",
                          country: "all",
                          assignedTo: "all",
                          searchTerm: "",
                        });
                      }}
                      sx={{
                        height: "40px",
                        background: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        "&:hover": {
                          background: "rgba(255, 255, 255, 0.9)",
                        },
                      }}
                    >
                      Reset
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {/* Professional Data Table */}
            <TableContainer
              sx={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                borderRadius: 2,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 203, 243, 0.08) 100%)",
                      "& .MuiTableCell-head": {
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "primary.main",
                        borderBottom: "2px solid rgba(33, 150, 243, 0.2)",
                        py: 2,
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Tooltip title="Select All Leads">
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
                          sx={{
                            color: "primary.main",
                            "&.Mui-checked": {
                              color: "primary.main",
                            },
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GroupIcon sx={{ fontSize: 16 }} />
                        Lead Information
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PhoneIcon sx={{ fontSize: 16 }} />
                        Contact Details
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                        Status
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FlagIcon sx={{ fontSize: 16 }} />
                        Priority
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonAddIcon sx={{ fontSize: 16 }} />
                        Assigned To
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AssignmentIcon sx={{ fontSize: 16 }} />
                        Actions
                      </Box>
                    </TableCell>
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
                    // Actual data rows
                    filteredLeads
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((lead, index) => (
                        <TableRow
                          key={lead.id}
                          hover
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "rgba(33, 150, 243, 0.02)",
                            },
                            "&:hover": {
                              backgroundColor: "rgba(33, 150, 243, 0.08)",
                              transform: "scale(1.001)",
                              boxShadow: "0 4px 20px rgba(33, 150, 243, 0.15)",
                            },
                            transition: "all 0.2s ease-in-out",
                            cursor: "pointer",
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleLeadSelect(lead.id)}
                              sx={{
                                color: "primary.main",
                                "&.Mui-checked": {
                                  color: "primary.main",
                                },
                              }}
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
                              <Avatar
                                sx={{
                                  background: `linear-gradient(135deg, ${
                                    [
                                      "#667eea",
                                      "#f093fb",
                                      "#4facfe",
                                      "#a8edea",
                                      "#ffecd2",
                                    ][index % 5]
                                  } 0%, ${
                                    [
                                      "#764ba2",
                                      "#f5576c",
                                      "#00f2fe",
                                      "#fed6e3",
                                      "#fcb69f",
                                    ][index % 5]
                                  } 100%)`,
                                  color: "white",
                                  width: 44,
                                  height: 44,
                                  fontWeight: "bold",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {lead.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="700"
                                  sx={{ color: "text.primary", mb: 0.5 }}
                                >
                                  {lead.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Chip
                                    label={
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{ fontSize: "1.1em" }}
                                        >
                                          {
                                            (
                                              availableCountries[
                                                lead.countryCode ||
                                                  lead.country_code
                                              ] ||
                                              countryMapping[
                                                lead.countryCode ||
                                                  lead.country_code
                                              ] ||
                                              getCountryInfo(
                                                lead.countryCode ||
                                                  lead.country_code
                                              )
                                            )?.flag
                                          }
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          fontWeight="500"
                                        >
                                          {
                                            (
                                              availableCountries[
                                                lead.countryCode ||
                                                  lead.country_code
                                              ] ||
                                              countryMapping[
                                                lead.countryCode ||
                                                  lead.country_code
                                              ] ||
                                              getCountryInfo(
                                                lead.countryCode ||
                                                  lead.country_code
                                              )
                                            )?.name
                                          }
                                        </Typography>
                                      </Box>
                                    }
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: "primary.light",
                                      color: "primary.main",
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack spacing={1}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: "success.light",
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <PhoneIcon
                                    sx={{ fontSize: 14, color: "success.dark" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight="500"
                                  sx={{ color: "text.primary" }}
                                >
                                  {lead.phone}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: "info.light",
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <EmailIcon
                                    sx={{ fontSize: 14, color: "info.dark" }}
                                  />
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{
                                    maxWidth: 160,
                                    color: "text.secondary",
                                    fontWeight: 400,
                                  }}
                                >
                                  {lead.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={lead.status}
                              color={getStatusColor(lead.status)}
                              size="medium"
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: "bold",
                                minWidth: "90px",
                                boxShadow: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  {lead.priority === "high" && (
                                    <FlagIcon sx={{ fontSize: 14 }} />
                                  )}
                                  {lead.priority === "medium" && (
                                    <ScheduleIcon sx={{ fontSize: 14 }} />
                                  )}
                                  {lead.priority === "low" && (
                                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                                  )}
                                  {lead.priority}
                                </Box>
                              }
                              color={getPriorityColor(lead.priority)}
                              size="medium"
                              variant="outlined"
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: "bold",
                                minWidth: "100px",
                                borderWidth: 2,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const assignedTo =
                                lead.assignedTo ||
                                lead.assigned_to ||
                                lead.assignedAgent;
                              if (assignedTo) {
                                // Try to find the team member by email first, then by name
                                const teamMember = teamMembers.find(
                                  (m) =>
                                    m.email === assignedTo ||
                                    m.name === assignedTo
                                );
                                const displayName = teamMember
                                  ? teamMember.name
                                  : assignedTo;

                                return (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                      {displayName.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {displayName}
                                    </Typography>
                                  </Box>
                                );
                              } else {
                                return (
                                  <Chip
                                    label="Unassigned"
                                    color="warning"
                                    variant="outlined"
                                    size="small"
                                  />
                                );
                              }
                            })()}
                          </TableCell>
                          {/* Assignment dropdown - Always show for admins */}
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={
                                    lead.assignedTo ||
                                    lead.assigned_to ||
                                    lead.assignedAgent ||
                                    ""
                                  }
                                  displayEmpty
                                  onChange={(e) => {
                                    if (
                                      e.target.value &&
                                      e.target.value !==
                                        (lead.assignedTo ||
                                          lead.assigned_to ||
                                          lead.assignedAgent)
                                    ) {
                                      // Find the team member by email to get their name
                                      const selectedMember = teamMembers.find(
                                        (m) => m.email === e.target.value
                                      );
                                      const agentName = selectedMember
                                        ? selectedMember.name
                                        : e.target.value;
                                      handleQuickAssign(lead.id, agentName);
                                    }
                                  }}
                                  sx={{ fontSize: "0.875rem" }}
                                >
                                  <MenuItem value="">
                                    <em>Select Agent</em>
                                  </MenuItem>
                                  {teamMembers.map((member) => (
                                    <MenuItem
                                      key={member.id}
                                      value={member.email}
                                    >
                                      {member.name.split(" ")[0]}
                                      <Chip
                                        label={`${member.assignedCount}/${member.maxCapacity}`}
                                        size="small"
                                        sx={{
                                          ml: 1,
                                          fontSize: "0.7rem",
                                          height: 16,
                                        }}
                                        color={
                                          member.assignedCount >=
                                          member.maxCapacity
                                            ? "error"
                                            : "default"
                                        }
                                      />
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
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

        {/* Team Members Sidebar - Always show for admins */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Marketing Team
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Available agents for lead assignment
            </Typography>

            <List>
              {teamMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem
                    sx={{
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color={
                          member.status === "online" ? "success" : "warning"
                        }
                        variant="dot"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                      >
                        <Avatar src={member.avatar}>
                          {member.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="bold">
                          {member.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ mt: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Conversion rate
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={member.conversionRate}
                              color="success"
                              sx={{ mt: 0.5, height: 4, mb: 0.5 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="primary"
                        >
                          {member.assignedCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          assigned leads
                        </Typography>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < teamMembers.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>

            <Button
              variant="outlined"
              fullWidth
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
