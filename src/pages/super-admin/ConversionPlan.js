import React, { useState, useEffect } from "react";
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
  Menu,
  Skeleton,
  Fade,
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
import { axiosInstance } from "../../services/axiosConfig";
import { leadService } from "../../services/leadService";
import { teamService } from "../../services/teamService";
import { superAdminService } from "../../services/superAdminService";

const ConversionPlan = () => {
  const { user, getUserRole } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const currentUserName =
    user?.name || user?.email?.split("@")[0] || "Current User";

  // State management - Must be declared before any conditional returns
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(200); // Reasonable default to prevent freezing
  const [filters, setFilters] = useState({
    status: "all", // all, contacted, interested
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

  // Team members state - no mock data initially, will be populated from API
  const [teamMembers, setTeamMembers] = useState([]);

  // Function to calculate priority based on creation date
  const calculatePriorityByDate = (contactedDate) => {
    const currentDate = new Date();
    const leadDate = new Date(contactedDate);
    const daysDifference = Math.floor(
      (currentDate - leadDate) / (1000 * 60 * 60 * 24)
    );

    // Priority based on age:
    // 0-3 days: high priority
    // 4-10 days: medium priority
    // 11+ days: low priority
    if (daysDifference <= 3) {
      return "high";
    } else if (daysDifference <= 10) {
      return "medium";
    } else {
      return "low";
    }
  };

  // Function to generate realistic lead data
  const generateMockLeads = () => {
    const firstNames = {
      Uganda: [
        "John",
        "Grace",
        "Moses",
        "Sarah",
        "David",
        "Mary",
        "Peter",
        "Jane",
        "Joseph",
        "Rebecca",
      ],
      Kenya: [
        "James",
        "Mary",
        "Peter",
        "Grace",
        "David",
        "Jane",
        "Joseph",
        "Sarah",
        "Michael",
        "Faith",
      ],
      Tanzania: [
        "Emmanuel",
        "Fatima",
        "Hassan",
        "Amina",
        "Said",
        "Zubeda",
        "Ali",
        "Mwajuma",
        "Omar",
        "Halima",
      ],
      Rwanda: [
        "Jean",
        "Marie",
        "Claude",
        "Jeanne",
        "Pierre",
        "Diane",
        "Eric",
        "Rose",
        "Alain",
        "Chantal",
      ],
      Nigeria: [
        "Chidi",
        "Adaeze",
        "Emeka",
        "Chioma",
        "Kemi",
        "Tunde",
        "Folake",
        "Biodun",
        "Segun",
        "Funmi",
      ],
      Ghana: [
        "Kwame",
        "Akosua",
        "Kofi",
        "Ama",
        "Yaw",
        "Efua",
        "Kweku",
        "Abena",
        "Kwadwo",
        "Adjoa",
      ],
    };

    const lastNames = {
      Uganda: [
        "Mukasa",
        "Namugga",
        "Ssekandi",
        "Nakato",
        "Kato",
        "Namusoke",
        "Ssentongo",
        "Nalubega",
        "Wasswa",
        "Nakimuli",
      ],
      Kenya: [
        "Wanjiku",
        "Mwangi",
        "Njeri",
        "Kamau",
        "Wambui",
        "Kariuki",
        "Nyong'o",
        "Mburu",
        "Gitau",
        "Waithaka",
      ],
      Tanzania: [
        "Mwinyi",
        "Mkuu",
        "Juma",
        "Salim",
        "Hamisi",
        "Bakari",
        "Mwalimu",
        "Rajabu",
        "Hassani",
        "Khamis",
      ],
      Rwanda: [
        "Ndayishimiye",
        "Uwimana",
        "Habimana",
        "Mukamana",
        "Niyonzima",
        "Uwingabire",
        "Bizimana",
        "Umurungi",
        "Nsengimana",
        "Mukashema",
      ],
      Nigeria: [
        "Okafor",
        "Adebayo",
        "Okonkwo",
        "Olumide",
        "Eze",
        "Chukwu",
        "Ogbonna",
        "Okoro",
        "Nwosu",
        "Emeka",
      ],
      Ghana: [
        "Asante",
        "Osei",
        "Boateng",
        "Adjei",
        "Mensah",
        "Owusu",
        "Amoah",
        "Agyeman",
        "Appiah",
        "Darko",
      ],
    };

    const sources = [
      "Facebook",
      "WhatsApp",
      "Website",
      "Referral",
      "Instagram",
      "LinkedIn",
      "Google Ads",
      "Direct",
    ];
    const priorities = ["high", "medium", "low"];
    const countries = [
      "Uganda",
      "Kenya",
      "Tanzania",
      "Rwanda",
      "Nigeria",
      "Ghana",
    ];
    const countryCodes = {
      Uganda: "256",
      Kenya: "254",
      Tanzania: "255",
      Rwanda: "250",
      Nigeria: "234",
      Ghana: "233",
    };

    const leads = [];

    // Generate 40 contacted leads
    for (let i = 1; i <= 40; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const firstName =
        firstNames[country][
          Math.floor(Math.random() * firstNames[country].length)
        ];
      const lastName =
        lastNames[country][
          Math.floor(Math.random() * lastNames[country].length)
        ];

      leads.push({
        id: i,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        phone: `+${countryCodes[country]}${Math.floor(
          Math.random() * 900000000 + 100000000
        )}`,
        country: country,
        countryCode: countryCodes[country],
        status: "contacted",
        source: sources[Math.floor(Math.random() * sources.length)],
        contactedDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        lastActivity: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        assignedTo: null,
        get priority() {
          return calculatePriorityByDate(this.contactedDate);
        },
        notes: `Initial contact made via ${
          sources[Math.floor(Math.random() * sources.length)]
        }.`,
      });
    }

    // Generate 160 interested leads
    for (let i = 41; i <= 200; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const firstName =
        firstNames[country][
          Math.floor(Math.random() * firstNames[country].length)
        ];
      const lastName =
        lastNames[country][
          Math.floor(Math.random() * lastNames[country].length)
        ];

      leads.push({
        id: i,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        phone: `+${countryCodes[country]}${Math.floor(
          Math.random() * 900000000 + 100000000
        )}`,
        country: country,
        countryCode: countryCodes[country],
        status: "interested",
        source: sources[Math.floor(Math.random() * sources.length)],
        contactedDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        lastActivity: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        assignedTo: null,
        get priority() {
          return calculatePriorityByDate(this.contactedDate);
        },
        notes: `Lead expressed interest via ${
          sources[Math.floor(Math.random() * sources.length)]
        }. ${
          Math.random() > 0.5
            ? "Requesting more information."
            : "Ready for follow-up call."
        }`,
      });
    }

    return leads;
  };

  // Comprehensive country mapping with flags and names
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

  // Extract unique country codes from leads data
  const getAvailableCountries = (leadsData) => {
    const countryCodes = new Set();

    leadsData.forEach((lead) => {
      if (lead.phone) {
        // Extract country code from phone number
        let code = lead.phone.replace(/\D/g, ""); // Remove non-digits

        if (code.startsWith("0")) {
          code = code.substring(1); // Remove leading 0
        }

        // Try different country code lengths (1-4 digits)
        for (let len = 1; len <= 4; len++) {
          const potentialCode = code.substring(0, len);
          const countryInfo = getCountryInfo(potentialCode);

          if (countryInfo.name !== `Unknown (+${potentialCode})`) {
            countryCodes.add(potentialCode);
            break;
          }
        }
      }
    });

    // Convert to array and create mapping
    const availableCountries = {};
    countryCodes.forEach((code) => {
      availableCountries[code] = getCountryInfo(code);
    });

    return availableCountries;
  };

  // State for dynamic countries
  const [availableCountries, setAvailableCountries] = useState({});

  // Legacy country mapping for fallback
  const countryMapping = {
    256: { name: "Uganda", flag: "🇺🇬", code: "UG" },
    254: { name: "Kenya", flag: "🇰🇪", code: "KE" },
    250: { name: "Rwanda", flag: "🇷🇼", code: "RW" },
    255: { name: "Tanzania", flag: "🇹🇿", code: "TZ" },
    234: { name: "Nigeria", flag: "🇳🇬", code: "NG" },
    233: { name: "Ghana", flag: "🇬🇭", code: "GH" },
  };

  // Fetch marketing agents from API using TeamService approach
  const fetchMarketingAgents = async () => {
    try {
      console.log("📋 Fetching marketing agents from team service...");

      const response = await teamService.getTeamMembers();

      if (response.success && response.members) {
        // Filter for marketing agents only
        const marketingAgents = response.members.filter(
          (member) => member.role === "marketingAgent"
        );

        console.log(`✅ Found ${marketingAgents.length} marketing agents`);

        // Get assigned lead counts for each agent
        const agentsWithLeadCounts = await Promise.all(
          marketingAgents.map(async (agent) => {
            try {
              // Count assigned leads for this agent (CONTACTED + INTERESTED only)
              const assignedLeadsPromises = ["CONTACTED", "INTERESTED"].map(
                async (status) => {
                  try {
                    const response = await leadService.getLeadsByStatus(
                      status,
                      {
                        limit: 10000,
                        offset: 0,
                      }
                    );
                    const leads = response?.data || [];
                    return leads.filter(
                      (lead) => lead.assignedTo === agent.email
                    ).length;
                  } catch (error) {
                    console.error(
                      `Error fetching ${status} leads for ${agent.email}:`,
                      error
                    );
                    return 0;
                  }
                }
              );

              const leadCounts = await Promise.all(assignedLeadsPromises);
              const totalAssignedCount = leadCounts.reduce(
                (sum, count) => sum + count,
                0
              );

              return {
                id: agent.id,
                name:
                  agent.name || agent.email?.split("@")[0] || "Unknown Agent",
                email: agent.email,
                avatar: null, // You can add photoURL if available
                assignedCount: totalAssignedCount,
                status: agent.status === "active" ? "online" : "offline",
                conversionRate: 0, // You can calculate this based on historical data
                maxCapacity: 1000, // No practical limit to assignments
                role: agent.role,
                lastSignIn: agent.lastSignIn,
                createdAt: agent.createdAt,
              };
            } catch (error) {
              console.error(`Error processing agent ${agent.email}:`, error);
              return {
                id: agent.id,
                name:
                  agent.name || agent.email?.split("@")[0] || "Unknown Agent",
                email: agent.email,
                avatar: null,
                assignedCount: 0,
                status: "offline",
                conversionRate: 0,
                maxCapacity: 1000, // No practical limit
                role: agent.role,
              };
            }
          })
        );

        // Sort by availability (least assigned first)
        agentsWithLeadCounts.sort((a, b) => {
          const aAvailability =
            (a.maxCapacity - a.assignedCount) / a.maxCapacity;
          const bAvailability =
            (b.maxCapacity - b.assignedCount) / b.maxCapacity;
          return bAvailability - aAvailability;
        });

        setTeamMembers(agentsWithLeadCounts);
        console.log(
          `✅ Loaded ${agentsWithLeadCounts.length} marketing agents with lead counts`
        );

        return agentsWithLeadCounts; // Return the data for promise chaining
      } else {
        throw new Error("Failed to fetch team members");
      }
    } catch (error) {
      console.error("❌ Error fetching marketing agents:", error);
      enqueueSnackbar("Failed to load marketing agents", { variant: "error" });
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  // Fetch conversion leads from API using efficient DataCenter approach
  const fetchConversionLeads = async () => {
    try {
      setRefreshing(true);
      setError(null);

      console.log("📋 Fetching conversion leads (CONTACTED + INTERESTED)...");

      // Use the same efficient approach as DataCenter
      const statusPromises = ["CONTACTED", "INTERESTED"].map(async (status) => {
        try {
          console.log(`📊 Fetching leads for status: ${status}`);
          const statusResponse = await leadService.getLeadsByStatus(status, {
            limit: 10000, // Get all leads for each status
            offset: 0,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          const leads = statusResponse?.data || [];
          console.log(`📊 Fetched ${leads.length} leads for status: ${status}`);
          return leads.map((lead) => ({
            ...lead,
            status: status.toLowerCase(), // Normalize status for frontend
            contactedDate: lead.createdAt,
            // Extract country code from phone number using improved logic
            countryCode: (() => {
              if (!lead.phone) return null;
              let code = lead.phone.replace(/\D/g, ""); // Remove non-digits
              if (code.startsWith("0")) code = code.substring(1); // Remove leading 0

              // Try different country code lengths (1-4 digits)
              for (let len = 1; len <= 4; len++) {
                const potentialCode = code.substring(0, len);
                const countryInfo = getCountryInfo(potentialCode);
                if (countryInfo.name !== `Unknown (+${potentialCode})`) {
                  return potentialCode;
                }
              }
              return code.substring(0, 3); // Fallback to first 3 digits
            })(),
            // Calculate priority based on creation date
            priority: calculatePriorityByDate(lead.createdAt),
          }));
        } catch (error) {
          console.error(`❌ Error fetching leads for status ${status}:`, error);
          return []; // Return empty array on error
        }
      });

      // Wait for both status fetches to complete
      const statusResults = await Promise.all(statusPromises);

      // Combine all results and sort by createdAt desc
      const allCombinedLeads = statusResults.flat();
      console.log(
        `📊 Combined ${allCombinedLeads.length} leads from all statuses`
      );

      // Sort by creation date (newest first)
      allCombinedLeads.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt
            : new Date(a.createdAt || 0);
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt
            : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setLeads(allCombinedLeads);
      setFilteredLeads(allCombinedLeads);

      // Extract and set available countries from the leads data
      const dynamicCountries = getAvailableCountries(allCombinedLeads);
      setAvailableCountries(dynamicCountries);
      console.log(
        `📊 Extracted ${
          Object.keys(dynamicCountries).length
        } unique countries from leads`
      );

      console.log(
        `✅ Successfully loaded ${allCombinedLeads.length} conversion leads`
      );
      enqueueSnackbar(`Loaded ${allCombinedLeads.length} leads successfully`, {
        variant: "success",
      });

      return allCombinedLeads; // Return data for promise chaining
    } catch (error) {
      console.error("❌ Error fetching conversion leads:", error);
      setError("Failed to load leads data");
      enqueueSnackbar("Failed to load leads data", { variant: "error" });
      throw error; // Re-throw to be handled by the caller
    } finally {
      setRefreshing(false);
    }
  };

  // Initialize data - first fetch marketing agents, then fetch the leads
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // First, get the team members
        await fetchMarketingAgents();
        // Then, fetch the leads
        await fetchConversionLeads();
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to initialize data");
        enqueueSnackbar("Failed to load data", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter leads based on current filters
  useEffect(() => {
    let filtered = [...leads];

    // Role-based filtering: Since agents can't access this screen,
    // we only need to handle admin roles that can see all leads
    // No role-based filtering needed for admins

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((lead) => lead.status === filters.status);
    }

    // Country filter
    if (filters.country !== "all") {
      filtered = filtered.filter(
        (lead) => lead.countryCode === filters.country
      );
    }

    // Assignment filter (all admin roles can see all assignments)
    if (filters.assignedTo !== "all") {
      if (filters.assignedTo === "unassigned") {
        filtered = filtered.filter((lead) => !lead.assignedTo);
      } else {
        // Now directly filter by email since we store the email in the dropdown value
        filtered = filtered.filter(
          (lead) => lead.assignedTo === filters.assignedTo
        );
      }
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.phone.includes(searchLower)
      );
    }

    setFilteredLeads(filtered);
    setPage(0); // Reset to first page when filtering
  }, [leads, filters]);

  // Selected leads for bulk operations
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Check if user is an agent and deny access
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
      // Find the selected agent
      const selectedAgent = teamMembers.find((m) => m.name === agentName);
      if (!selectedAgent) {
        enqueueSnackbar("Agent not found", { variant: "error" });
        return;
      }

      // Optimistic update - update UI immediately
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          leadIds.includes(lead.id)
            ? { ...lead, assignedTo: selectedAgent.email }
            : lead
        )
      );

      // Update team member assigned count optimistically
      setTeamMembers((prevTeam) =>
        prevTeam.map((member) => {
          if (member.name === agentName) {
            return {
              ...member,
              assignedCount: member.assignedCount + leadIds.length,
            };
          }
          return member;
        })
      );

      // Make API call
      const response = await axiosInstance.post("/api/leads/bulk-assign", {
        leadIds,
        assignTo: selectedAgent,
        assignedBy: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        },
      });

      if (response.data.success) {
        enqueueSnackbar(
          `${response.data.results.assigned} leads assigned successfully`,
          { variant: "success" }
        );

        // Refresh data to ensure consistency
        await fetchConversionLeads();
        await fetchMarketingAgents();
      } else {
        throw new Error("Assignment failed");
      }
    } catch (error) {
      console.error("Error assigning leads:", error);
      enqueueSnackbar("Failed to assign leads", { variant: "error" });

      // Revert optimistic updates on error
      await fetchConversionLeads();
      await fetchMarketingAgents();
    } finally {
      // Clear selections and close dialog
      setSelectedLeads([]);
      setSelectAll(false);
      setAssignmentDialog({
        open: false,
        selectedLeads: [],
        selectedAgent: "",
      });
    }
  };

  // Handle single lead assignment directly from table
  const handleQuickAssign = (leadId, agentName) => {
    handleAssignLeads([leadId], agentName);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // First, get the team members
      await fetchMarketingAgents();
      // Then, fetch the leads
      await fetchConversionLeads();
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
      enqueueSnackbar("Failed to refresh data", { variant: "error" });
    } finally {
      setLoading(false);
    }
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

  // Statistics calculations
  const stats = {
    totalLeads: filteredLeads.length,
    unassigned: filteredLeads.filter((lead) => !lead.assignedTo).length,
    contacted: filteredLeads.filter((lead) => lead.status === "contacted")
      .length,
    interested: filteredLeads.filter((lead) => lead.status === "interested")
      .length,
    highPriority: filteredLeads.filter((lead) => lead.priority === "high")
      .length,
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
            {Object.values(availableCountries)
              .slice(0, 8)
              .map((country, index) => (
                <span key={index}>
                  {country.flag} {country.name}
                  {index <
                  Math.min(7, Object.keys(availableCountries).length - 1)
                    ? ", "
                    : ""}
                </span>
              ))}
            {Object.keys(availableCountries).length > 8 && (
              <span>
                {" "}
                and {Object.keys(availableCountries).length - 8} more...
              </span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Loading indicator */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                              {member.name}
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
                                                lead.countryCode
                                              ] ||
                                              countryMapping[
                                                lead.countryCode
                                              ] ||
                                              getCountryInfo(lead.countryCode)
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
                                                lead.countryCode
                                              ] ||
                                              countryMapping[
                                                lead.countryCode
                                              ] ||
                                              getCountryInfo(lead.countryCode)
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
                            {lead.assignedTo ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {lead.assignedTo.charAt(0)}
                                </Avatar>
                                <Typography variant="body2">
                                  {lead.assignedTo}
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
                          {/* Assignment dropdown - Always show for admins */}
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={lead.assignedTo || ""}
                                  displayEmpty
                                  onChange={(e) => {
                                    if (
                                      e.target.value &&
                                      e.target.value !== lead.assignedTo
                                    ) {
                                      handleQuickAssign(
                                        lead.id,
                                        e.target.value
                                      );
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
                                      value={member.name}
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
            disabled={!assignmentDialog.selectedAgent}
          >
            Assign Leads
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversionPlan;
