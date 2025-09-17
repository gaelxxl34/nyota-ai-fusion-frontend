import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Paper,
  AutocompleteChangeDetails,
  Autocomplete,
  TextField as MuiTextField,
  Drawer,
  Switch,
  FormControlLabel,
  ListSubheader,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Update as UpdateIcon,
  Tag as TagIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FiberManualRecord as NeutralIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  DateRange as DateRangeIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import InteractionTimeline from "../../components/InteractionTimeline/InteractionTimeline";
import { leadService } from "../../services/leadService";
import { useSnackbar } from "notistack";

// Predefined interaction tags - Organized by conversion priority
const predefinedInteractionTags = [
  // 🟢 HIGH PRIORITY - Strong Conversion Signals
  "Application Started",
  "Application Submitted",
  "Application Assistance",
  "Will Visit",
  "Parent Meeting",

  // 🟡 MEDIUM PRIORITY - Neutral Activities
  "Document Shared",
  "Follow-up Scheduled",
  "Reminder Sent",
  "Deferred",

  // 🔴 LOW PRIORITY - Negative Conversion Signals
  "Scholarship Information",
  "Financial Assistance Request",
  "Payment Plan Inquiry",
  "Lead Closed",
];

// Function to generate stats from actual lead data
const generateLeadStats = (leads) => {
  if (!leads || leads.length === 0) {
    return {
      priorities: [],
      status: [],
      sources: [],
      outcomes: [],
    };
  }

  // Count priorities
  const priorityCounts = {};
  leads.forEach((lead) => {
    const priority = lead.priority || "Unknown";
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  // Count statuses
  const statusCounts = {};
  leads.forEach((lead) => {
    const status = lead.status || "NEW";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Count sources
  const sourceCounts = {};
  leads.forEach((lead) => {
    const source = lead.source || "Unknown";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  // Count outcomes
  const outcomeCounts = {};
  leads.forEach((lead) => {
    const outcome = lead.lastInteractionOutcome || "Unknown";
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  });

  // Convert to array format
  return {
    priorities: Object.keys(priorityCounts).map((name) => ({
      name,
      count: priorityCounts[name],
    })),
    status: Object.keys(statusCounts).map((name) => ({
      name,
      count: statusCounts[name],
    })),
    sources: Object.keys(sourceCounts).map((name) => ({
      name,
      count: sourceCounts[name],
    })),
    outcomes: Object.keys(outcomeCounts).map((name) => ({
      name,
      count: outcomeCounts[name],
    })),
  };
};

const getOutcomeColor = (outcome) => {
  const colors = {
    positive: "success",
    neutral: "warning",
    negative: "error",
  };
  return colors[outcome] || "default";
};

const getOutcomeIcon = (outcome) => {
  switch (outcome) {
    case "positive":
      return "✓";
    case "neutral":
      return "○";
    case "negative":
      return "✗";
    default:
      return "○";
  }
};

const getStatusColor = (status) => {
  const colors = {
    INTERESTED: "primary",
    CONTACTED: "info",
    FOLLOW_UP: "warning",
    WARM: "success",
    APPLIED: "secondary",
  };
  return colors[status] || "default";
};

const getPriorityColor = (priority) => {
  const colors = {
    high: "error",
    medium: "warning",
    low: "info",
  };
  return colors[priority] || "default";
};

const AssignedLeads = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State for assigned leads data
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [timelineLeadId, setTimelineLeadId] = useState(null);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateLead, setStatusUpdateLead] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Stats for the dashboard
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    followUp: 0,
    positiveInteractions: 0,
    negativeInteractions: 0,
    highPriority: 0,
  });

  // Get real-time filter stats from the actual lead data
  const filterStats = generateLeadStats(assignedLeads);

  // Advanced filter states
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    source: "all",
    interactionOutcome: "all",
    interactionTag: "all",
    assignDateRange: "all",
    lastContactRange: "all",
    course: "all",
  });

  // Helper function to format dates consistently (like DataCenter.js)
  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available yet";

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
      if (
        typeof dateValue === "object" &&
        (dateValue.seconds || dateValue._seconds)
      ) {
        const seconds = dateValue.seconds || dateValue._seconds;
        return new Date(seconds * 1000).toLocaleString(
          "en-US",
          dateTimeOptions
        );
      }

      // Handle string dates
      if (typeof dateValue === "string") {
        // Handle Firestore string format: "11 September 2025 at 20:29:00 UTC+3"
        if (dateValue.includes(" at ")) {
          const [datePart, timePart] = dateValue.split(" at ");
          if (datePart && timePart) {
            // Remove timezone part and combine date and time
            const timeWithoutTimezone = timePart.split(" ")[0]; // Remove "UTC+3" part
            const combinedDateTime = `${datePart} ${timeWithoutTimezone}`;
            const parsedDate = new Date(combinedDateTime);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toLocaleString("en-US", dateTimeOptions);
            }
          }
        }

        // Try standard date parsing for other string formats
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

        // If we can't parse it, return the original string (but cleaned up)
        return dateValue.replace(" at ", " ").replace(/ UTC\+\d+/, "");
      }

      // Handle timestamp numbers
      if (typeof dateValue === "number") {
        return dateValue > 1000000000000
          ? new Date(dateValue).toLocaleString("en-US", dateTimeOptions) // milliseconds
          : new Date(dateValue * 1000).toLocaleString("en-US", dateTimeOptions); // seconds
      }
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
    }

    return typeof dateValue === "string" ? dateValue : "Not available yet";
  };

  // Fetch assigned leads from the API
  const fetchAssignedLeads = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await leadService.getMyAssignedLeads({
        limit: 100,
        offset: 0,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      if (response && response.success) {
        // Debug logging
        console.log("Raw lead data from API:", response.data[0]);

        // Process the lead data and add additional properties needed for UI
        const processedLeads = response.data.map((lead) => {
          // Extract the initials for avatar
          const initials = lead.name
            ? lead.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            : lead.email
            ? lead.email[0].toUpperCase()
            : "U";

          // Determine priority based on status and createdAt date
          const priority = determinePriority(lead);

          // Extract interaction tags from timeline
          const interactionTags = extractInteractionTags(lead);

          // Extract last interaction outcome and type
          const { lastInteractionOutcome, lastInteractionType } =
            extractLastInteraction(lead);

          // Debug logging for first lead
          if (lead === response.data[0]) {
            console.log("Processed interaction data for first lead:", {
              interactionTags,
              lastInteractionOutcome,
              lastInteractionType,
              hasInteractionSummary: !!lead.interactionSummary,
              interactionSummary: lead.interactionSummary,
              timelineLength: lead.timeline ? lead.timeline.length : 0,
              timelineInteractions: lead.timeline
                ? lead.timeline.filter((t) => t.action === "INTERACTION")
                : [],
            });
          }

          // Keep raw dates for proper formatting
          const createdDate = lead.createdAt; // Keep raw Firestore date string
          const assignedDate = lead.assignment?.assignedAt || lead.updatedAt; // Keep raw Firestore date string

          // Only use lastInteractionAt if it exists, don't fall back to updatedAt for fake interaction data
          const lastContact = lead.lastInteractionAt || null;

          // Format for our component
          return {
            ...lead,
            avatar: initials,
            priority,
            interactionTags,
            lastInteractionOutcome,
            lastInteractionType,
            // Keep raw dates for formatDate function to handle
            createdDate: createdDate,
            assignedDate: assignedDate,
            lastContact: lastContact,
            course: lead.programOfInterest || lead.program || "Not specified",
            source: lead.source || "Unknown",
            phone: lead.phone || lead.contactInfo?.phone || "Not provided",
            email: lead.email || lead.contactInfo?.email || "Not provided",
            name: lead.name || lead.contactInfo?.name || "Unknown Lead",
            // Preserve interaction data from backend
            interactionSummary: lead.interactionSummary,
            lastInteraction: lead.lastInteraction,
          };
        });

        // Calculate stats for dashboard
        const statsData = {
          total: processedLeads.length,
          applied: processedLeads.filter((lead) => lead.status === "APPLIED")
            .length,
          followUp: processedLeads.filter((lead) => lead.status === "FOLLOW_UP")
            .length,
          // Only count real interactions, not fake data
          positiveInteractions: processedLeads.filter(
            (lead) => lead.lastInteractionOutcome === "positive"
          ).length,
          negativeInteractions: processedLeads.filter(
            (lead) => lead.lastInteractionOutcome === "negative"
          ).length,
          highPriority: processedLeads.filter(
            (lead) => lead.priority === "high"
          ).length,
        };

        setStats(statsData);
        setAssignedLeads(processedLeads);
        console.log(`✅ Loaded ${processedLeads.length} assigned leads`);
      } else {
        throw new Error("Failed to fetch assigned leads");
      }
    } catch (error) {
      console.error("Error fetching assigned leads:", error);
      setError("Failed to load your assigned leads. Please try again.");
      enqueueSnackbar("Failed to load your assigned leads", {
        variant: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to determine lead priority
  const determinePriority = (lead) => {
    // Logic to determine priority based on lead data
    if (lead.status === "APPLIED" || lead.status === "WARM") {
      return "high";
    } else if (lead.status === "INTERESTED") {
      return "medium";
    } else if (lead.status === "CONTACTED" || lead.status === "FOLLOW_UP") {
      // Check recency - if recently contacted, higher priority
      let createdDate;

      // Handle Firestore date format properly
      if (
        typeof lead.createdAt === "string" &&
        lead.createdAt.includes(" at ")
      ) {
        const [datePart, timePart] = lead.createdAt.split(" at ");
        const timeWithoutTimezone = timePart.split(" ")[0];
        createdDate = new Date(`${datePart} ${timeWithoutTimezone}`);
      } else {
        createdDate = new Date(lead.createdAt);
      }

      const now = new Date();
      const daysSinceCreation = Math.floor(
        (now - createdDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation < 3) {
        return "high";
      } else if (daysSinceCreation < 7) {
        return "medium";
      } else {
        return "low";
      }
    }

    return "low";
  };

  // Helper function to extract interaction tags from timeline
  const extractInteractionTags = (lead) => {
    // Check if there's real interaction data
    if (
      !lead.timeline ||
      !Array.isArray(lead.timeline) ||
      lead.timeline.length === 0
    ) {
      // No real interaction data available
      return [];
    }

    // Extract all tags from timeline interactions
    const tags = [];

    // Look for interactions in the timeline
    lead.timeline.forEach((entry) => {
      // Fixed: check for action === "INTERACTION" instead of type === "INTERACTION"
      if (entry.action === "INTERACTION" && entry.interaction) {
        const interaction = entry.interaction;

        // Priority 1: Use interaction tag if available (this is the most specific)
        if (interaction.interactionTag) {
          const formattedTag = interaction.interactionTag
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          tags.push(formattedTag);
        }
        // Priority 2: Only add interaction type if no specific tag exists
        else if (interaction.type) {
          tags.push(interaction.type.replace(/_/g, " "));
        }

        // Don't add channel information as it's not relevant for interaction tags
        // The specific interaction tag is more valuable than knowing it was a phone call
      } else if (entry.action === "STATUS_CHANGE") {
        // Add status change as a tag for tracking
        tags.push(`Status: ${entry.status}`);
      }
    });

    // If no timeline interactions found, check interactionSummary for basic info
    if (
      tags.length === 0 &&
      lead.interactionSummary &&
      lead.interactionSummary.totalInteractions > 0
    ) {
      if (lead.interactionSummary.lastInteractionType) {
        tags.push(
          lead.interactionSummary.lastInteractionType.replace(/_/g, " ")
        );
      }
    }

    // Remove duplicates and return only real interaction tags
    return [...new Set(tags)];
  };

  // Helper function to extract last interaction outcome and type
  const extractLastInteraction = (lead) => {
    // First check if interactionSummary exists (preferred source)
    if (
      lead.interactionSummary &&
      lead.interactionSummary.totalInteractions > 0
    ) {
      return {
        lastInteractionOutcome:
          lead.interactionSummary.lastInteractionOutcome || null,
        lastInteractionType:
          lead.interactionSummary.lastInteractionType || null,
      };
    }

    // Fallback to timeline parsing if interactionSummary is not available
    const hasRealInteractions =
      lead.timeline &&
      Array.isArray(lead.timeline) &&
      lead.timeline.length > 0 &&
      lead.timeline.some((entry) => entry.action === "INTERACTION"); // Fixed: use 'action' not 'type'

    // If no real interactions exist, return null values
    if (!hasRealInteractions) {
      return { lastInteractionOutcome: null, lastInteractionType: null };
    }

    let lastInteractionOutcome = "neutral";
    let lastInteractionType = "";

    // Check timeline for real interactions
    if (
      lead.timeline &&
      Array.isArray(lead.timeline) &&
      lead.timeline.length > 0
    ) {
      // Sort timeline by date (newest first)
      const sortedTimeline = [...lead.timeline].sort((a, b) => {
        const dateA = a.date?._seconds
          ? new Date(a.date._seconds * 1000)
          : new Date(a.date || a.timestamp || 0);
        const dateB = b.date?._seconds
          ? new Date(b.date._seconds * 1000)
          : new Date(b.date || b.timestamp || 0);
        return dateB - dateA;
      });

      // Find the latest real interaction (not status changes)
      const latestInteraction = sortedTimeline.find(
        (entry) => entry.action === "INTERACTION" // Fixed: use 'action' not 'type'
      );

      if (latestInteraction && latestInteraction.interaction) {
        const interaction = latestInteraction.interaction;

        // Use the interaction outcome and type directly from the API
        lastInteractionOutcome = interaction.outcome || "neutral";
        lastInteractionType = interaction.type || "Interaction";

        // Also check for interaction tag
        if (interaction.interactionTag) {
          lastInteractionType = interaction.interactionTag
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }
    }

    return { lastInteractionOutcome, lastInteractionType };
  };

  // Load data on component mount
  useEffect(() => {
    fetchAssignedLeads();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    setError(null);
    fetchAssignedLeads();
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleAdvancedFiltersToggle = () => {
    setAdvancedFiltersOpen(!advancedFiltersOpen);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: "all",
      priority: "all",
      source: "all",
      interactionOutcome: "all",
      interactionTag: "all",
      assignDateRange: "all",
      lastContactRange: "all",
      course: "all",
    });
    setSelectedStatus("all");
    setSearchTerm("");
  };

  const getActiveFilterCount = () => {
    const activeFilters = Object.values(filters).filter(
      (value) => value !== "all"
    ).length;
    const hasSearch = searchTerm.trim() !== "";
    const hasStatusFilter = selectedStatus !== "all";
    return activeFilters + (hasSearch ? 1 : 0) + (hasStatusFilter ? 1 : 0);
  };

  const handleActionClick = (event, lead) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedLead(null);
  };

  const handleTimelineOpen = (leadId) => {
    setTimelineLeadId(leadId);
    setTimelineDialogOpen(true);
  };

  const handleTimelineClose = () => {
    setTimelineDialogOpen(false);
    setTimelineLeadId(null);
  };

  const handleStatusUpdateOpen = (lead) => {
    setStatusUpdateLead(lead);
    setNewStatus("");
    setStatusUpdateDialogOpen(true);
    handleActionClose();
  };

  const handleStatusUpdateClose = () => {
    setStatusUpdateDialogOpen(false);
    setStatusUpdateLead(null);
    setNewStatus("");
  };

  const handleStatusUpdate = async () => {
    if (statusUpdateLead && newStatus) {
      try {
        setLoading(true);
        // Call the API to update the lead status
        const response = await leadService.updateLeadStatus(
          statusUpdateLead.id,
          newStatus,
          `Status updated by marketing agent to ${newStatus}`,
          null, // Use authenticated user
          true // Force update
        );

        if (response && response.success) {
          enqueueSnackbar(`Lead status updated to ${newStatus}`, {
            variant: "success",
          });
        } else {
          throw new Error("Failed to update lead status");
        }

        // Refresh the leads data to show the updated status
        fetchAssignedLeads();

        // Close the dialog
        handleStatusUpdateClose();
      } catch (error) {
        console.error("Error updating lead status:", error);
        enqueueSnackbar("Failed to update lead status", { variant: "error" });
        setLoading(false);
      }
    }
  };

  const filteredLeads = assignedLeads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || lead.status === selectedStatus;

    // Advanced filters
    const matchesPriority =
      filters.priority === "all" || lead.priority === filters.priority;

    const matchesSource =
      filters.source === "all" || lead.source === filters.source;

    const matchesInteractionOutcome =
      filters.interactionOutcome === "all" ||
      lead.lastInteractionOutcome === filters.interactionOutcome;

    const matchesInteractionTag =
      filters.interactionTag === "all" ||
      (lead.interactionTags &&
        lead.interactionTags.includes(filters.interactionTag));

    const matchesCourse =
      filters.course === "all" ||
      (lead.course && lead.course.includes(filters.course));

    // Date range filters
    const matchesAssignDate = () => {
      if (filters.assignDateRange === "all") return true;
      const assignDate = new Date(lead.assignedDate);
      const today = new Date();

      switch (filters.assignDateRange) {
        case "today":
          return assignDate.toDateString() === today.toDateString();
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return assignDate.toDateString() === yesterday.toDateString();
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return assignDate >= weekStart;
        case "thisMonth":
          return (
            assignDate.getMonth() === today.getMonth() &&
            assignDate.getFullYear() === today.getFullYear()
          );
        case "last7days":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return assignDate >= sevenDaysAgo;
        case "last30days":
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return assignDate >= thirtyDaysAgo;
        default:
          return true;
      }
    };

    const matchesLastContact = () => {
      if (filters.lastContactRange === "all") return true;
      const lastContact = new Date(lead.lastContact);
      const today = new Date();

      switch (filters.lastContactRange) {
        case "today":
          return lastContact.toDateString() === today.toDateString();
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return lastContact.toDateString() === yesterday.toDateString();
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return lastContact >= weekStart;
        case "last7days":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return lastContact >= sevenDaysAgo;
        case "last30days":
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return lastContact >= thirtyDaysAgo;
        default:
          return true;
      }
    };

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesSource &&
      matchesInteractionOutcome &&
      matchesInteractionTag &&
      matchesCourse &&
      matchesAssignDate() &&
      matchesLastContact()
    );
  });

  const statusCounts = {
    all: filteredLeads.length,
    INTERESTED: filteredLeads.filter((l) => l.status === "INTERESTED").length,
    CONTACTED: filteredLeads.filter((l) => l.status === "CONTACTED").length,
    FOLLOW_UP: filteredLeads.filter((l) => l.status === "FOLLOW_UP").length,
    WARM: filteredLeads.filter((l) => l.status === "WARM").length,
    APPLIED: filteredLeads.filter((l) => l.status === "APPLIED").length,
  };

  // Additional analytics for better insights
  const analyticsData = {
    totalAssigned: assignedLeads.length,
    totalFiltered: filteredLeads.length,
    // Only count real interactions, not fake data
    positiveOutcomes: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "positive"
    ).length,
    negativeOutcomes: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "negative"
    ).length,
    highPriority: filteredLeads.filter((l) => l.priority === "high").length,
    // Only count real interaction tags, not fake ones
    applicationStarted: filteredLeads.filter(
      (l) =>
        l.interactionTags &&
        l.interactionTags.length > 0 &&
        l.interactionTags.some((tag) => tag.includes("Application"))
    ).length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Your Leads to Convert
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and convert your assigned leads into applications
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "primary.main",
              color: "white",
              height: 140,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                width: "100%",
                py: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {loading ? (
                  <CircularProgress size={30} color="inherit" />
                ) : (
                  analyticsData.totalFiltered
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {getActiveFilterCount() > 0
                  ? "Filtered Results"
                  : "Total Assigned"}
              </Typography>
              {getActiveFilterCount() > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  of {analyticsData.totalAssigned} total
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "success.main",
              color: "white",
              height: 140,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                width: "100%",
                py: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {loading ? (
                  <CircularProgress size={30} color="inherit" />
                ) : (
                  statusCounts.APPLIED || 0
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Applied
              </Typography>
              {analyticsData.applicationStarted > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {analyticsData.applicationStarted} with applications
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "warning.main",
              color: "white",
              height: 140,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                width: "100%",
                py: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {loading ? (
                  <CircularProgress size={30} color="inherit" />
                ) : (
                  statusCounts.FOLLOW_UP || 0
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Need Follow-up
              </Typography>
              {analyticsData.highPriority > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {analyticsData.highPriority} high priority
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: "info.main",
              color: "white",
              height: 140,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent
              sx={{
                textAlign: "center",
                width: "100%",
                py: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {loading ? (
                  <CircularProgress size={30} color="inherit" />
                ) : (
                  analyticsData.positiveOutcomes
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Positive Interactions
              </Typography>
              {analyticsData.negativeOutcomes > 0 && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {analyticsData.negativeOutcomes} negative outcomes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <TextField
            placeholder="Search leads by name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm("")} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            endIcon={
              selectedStatus !== "all" && (
                <Badge badgeContent="1" color="primary" />
              )
            }
          >
            Quick Filter
          </Button>
          <Button
            variant={getActiveFilterCount() > 0 ? "contained" : "outlined"}
            startIcon={<TuneIcon />}
            onClick={handleAdvancedFiltersToggle}
            endIcon={
              getActiveFilterCount() > 0 && (
                <Badge
                  badgeContent={getActiveFilterCount()}
                  color="secondary"
                />
              )
            }
          >
            Advanced Filters
          </Button>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="text"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              color="secondary"
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Active filters:
            </Typography>
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={() => setSearchTerm("")}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedStatus !== "all" && (
              <Chip
                label={`Status: ${selectedStatus.replace("_", " ")}`}
                onDelete={() => setSelectedStatus("all")}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== "all" && (
                  <Chip
                    key={key}
                    label={`${
                      key.charAt(0).toUpperCase() +
                      key.slice(1).replace(/([A-Z])/g, " $1")
                    }: ${value.replace(/([A-Z])/g, " $1")}`}
                    onDelete={() => handleFilterChange(key, "all")}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )
            )}
          </Box>
        )}
      </Box>

      {/* Quick Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem
          onClick={() => {
            setSelectedStatus("all");
            handleFilterClose();
          }}
          selected={selectedStatus === "all"}
        >
          All Leads ({statusCounts.all})
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setSelectedStatus("INTERESTED");
            handleFilterClose();
          }}
          selected={selectedStatus === "INTERESTED"}
        >
          <Chip
            label={`Interested (${statusCounts.INTERESTED})`}
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus("CONTACTED");
            handleFilterClose();
          }}
          selected={selectedStatus === "CONTACTED"}
        >
          <Chip
            label={`Contacted (${statusCounts.CONTACTED})`}
            color="info"
            size="small"
            sx={{ mr: 1 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus("FOLLOW_UP");
            handleFilterClose();
          }}
          selected={selectedStatus === "FOLLOW_UP"}
        >
          <Chip
            label={`Follow-up (${statusCounts.FOLLOW_UP})`}
            color="warning"
            size="small"
            sx={{ mr: 1 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus("WARM");
            handleFilterClose();
          }}
          selected={selectedStatus === "WARM"}
        >
          <Chip
            label={`Warm (${statusCounts.WARM})`}
            color="success"
            size="small"
            sx={{ mr: 1 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus("APPLIED");
            handleFilterClose();
          }}
          selected={selectedStatus === "APPLIED"}
        >
          <Chip
            label={`Applied (${statusCounts.APPLIED})`}
            color="secondary"
            size="small"
            sx={{ mr: 1 }}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleFilterChange("interactionOutcome", "positive");
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" fontSize="small" />
            Positive Interactions ({analyticsData.positiveOutcomes})
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleFilterChange("interactionOutcome", "negative");
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CancelIcon color="error" fontSize="small" />
            Negative Interactions ({analyticsData.negativeOutcomes})
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleFilterChange("priority", "high");
            handleFilterClose();
          }}
        >
          High Priority Leads ({analyticsData.highPriority})
        </MenuItem>
      </Menu>

      {/* Leads List */}
      {filteredLeads.length > 0 && !loading && !error && (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="text.primary">
            Leads ({filteredLeads.length})
          </Typography>
          {getActiveFilterCount() > 0 && (
            <Typography variant="body2" color="text.secondary">
              Filtered from {assignedLeads.length} total leads
            </Typography>
          )}
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Loading your assigned leads...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </Box>
      )}

      {!loading && !error && (
        <Grid container spacing={3}>
          {filteredLeads.map((lead) => (
            <Grid item xs={12} key={lead.id}>
              <Card sx={{ "&:hover": { boxShadow: 3 } }}>
                <CardContent>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    {/* Avatar */}
                    <Avatar
                      sx={{
                        bgcolor: getPriorityColor(lead.priority) + ".main",
                        width: 56,
                        height: 56,
                        fontSize: "1.2rem",
                        fontWeight: 600,
                      }}
                    >
                      {lead.avatar}
                    </Avatar>

                    {/* Lead Info */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {lead.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Chip
                              label={lead.status?.replace("_", " ") || "NEW"}
                              color={getStatusColor(lead.status)}
                              size="small"
                            />
                            <Chip
                              label={`${lead.priority} priority`}
                              color={getPriorityColor(lead.priority)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {/* Display Last Interaction Tag */}
                          {lead.interactionTags &&
                          lead.interactionTags.length > 0 ? (
                            <Chip
                              label={`Last: ${
                                lead.interactionTags[
                                  lead.interactionTags.length - 1
                                ]
                              }`}
                              color={
                                // Color based on tag priority
                                lead.interactionTags[
                                  lead.interactionTags.length - 1
                                ].includes("Application") ||
                                lead.interactionTags[
                                  lead.interactionTags.length - 1
                                ].includes("Will Visit") ||
                                lead.interactionTags[
                                  lead.interactionTags.length - 1
                                ].includes("Parent")
                                  ? "success"
                                  : lead.interactionTags[
                                      lead.interactionTags.length - 1
                                    ].includes("Scholarship") ||
                                    lead.interactionTags[
                                      lead.interactionTags.length - 1
                                    ].includes("Financial") ||
                                    lead.interactionTags[
                                      lead.interactionTags.length - 1
                                    ].includes("Payment")
                                  ? "error"
                                  : "primary"
                              }
                              size="small"
                              variant="filled"
                              sx={{
                                fontWeight: "bold",
                                "& .MuiChip-label": {
                                  color: "white",
                                },
                              }}
                            />
                          ) : (
                            <Chip
                              label="No Interactions"
                              color="default"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <EmailIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {lead.email}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <PhoneIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
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
                            <SchoolIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {lead.course}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <CalendarIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Created: {formatDate(lead.createdDate)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <ScheduleIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Assigned: {formatDate(lead.assignedDate)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <TrendingUpIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Source: {lead.source || "Unknown"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <PersonIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Last interacted: {formatDate(lead.lastContact)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Notes */}
                      {lead.notes && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {lead.notes}
                          </Typography>
                        </Box>
                      )}

                      {/* Last Interaction Status */}
                      {lead.lastInteractionOutcome ? (
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 1.5,
                              backgroundColor: `${getOutcomeColor(
                                lead.lastInteractionOutcome
                              )}.50`,
                              borderRadius: 1,
                              border: `1px solid`,
                              borderColor: `${getOutcomeColor(
                                lead.lastInteractionOutcome
                              )}.main`,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: `${getOutcomeColor(
                                  lead.lastInteractionOutcome
                                )}.main`,
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {getOutcomeIcon(lead.lastInteractionOutcome)}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: `${getOutcomeColor(
                                  lead.lastInteractionOutcome
                                )}.dark`,
                              }}
                            >
                              Last interaction: {lead.lastInteractionOutcome}
                            </Typography>
                            {lead.lastInteractionType && (
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mx: 1 }}
                                >
                                  •
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {lead.lastInteractionType}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 1.5,
                              backgroundColor: `grey.100`,
                              borderRadius: 1,
                              border: `1px solid`,
                              borderColor: `grey.300`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: `grey.600`,
                              }}
                            >
                              No interaction logs available
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Tooltip title="View Timeline">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TimelineIcon />}
                            onClick={() => handleTimelineOpen(lead.id)}
                          >
                            Timeline
                          </Button>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UpdateIcon />}
                          onClick={() => handleStatusUpdateOpen(lead)}
                        >
                          Update Status
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleActionClose}>View Details</MenuItem>
        <MenuItem onClick={handleActionClose}>Edit Lead</MenuItem>
        <MenuItem onClick={handleActionClose}>Add Note</MenuItem>
        <MenuItem onClick={handleActionClose}>Schedule Follow-up</MenuItem>
        <Divider />
        <MenuItem onClick={handleActionClose} sx={{ color: "error.main" }}>
          Unassign Lead
        </MenuItem>
      </Menu>

      {/* No results */}
      {!loading && !error && filteredLeads.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {getActiveFilterCount() > 0 || searchTerm
              ? "No leads match your criteria"
              : "No leads assigned to you yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {getActiveFilterCount() > 0 || searchTerm
              ? "Try adjusting your search or filter criteria to find more leads"
              : "You don't have any assigned leads yet. Check back later."}
          </Typography>
          {(getActiveFilterCount() > 0 || searchTerm) && (
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onClose={handleStatusUpdateClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Lead Status
          {statusUpdateLead && ` - ${statusUpdateLead.name}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="DEFERRED">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      DEFERRED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Student wants to apply for next intake
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="EXPIRED">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      EXPIRED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lead has gone cold/too old to pursue
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusUpdateClose}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interaction Timeline Dialog */}
      <Dialog
        open={timelineDialogOpen}
        onClose={handleTimelineClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: "80vh",
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TimelineIcon />
            <Typography variant="h6">
              Interaction Timeline
              {timelineLeadId &&
                (() => {
                  const lead = assignedLeads.find(
                    (l) => l.id === timelineLeadId
                  );
                  return lead ? ` - ${lead.name}` : "";
                })()}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {timelineLeadId && <InteractionTimeline leadId={timelineLeadId} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTimelineClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Filters Drawer */}
      <Drawer
        anchor="right"
        open={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        PaperProps={{
          sx: {
            width: 400,
            p: 3,
            backgroundColor: "#f5f5f5", // Light gray background
            color: "#333333", // Dark text for better contrast
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: "#333333", fontWeight: 600 }}>
            Advanced Filters
          </Typography>
          <IconButton
            onClick={() => setAdvancedFiltersOpen(false)}
            sx={{ color: "#666666" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          {/* Status Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Lead Status
            </InputLabel>
            <Select
              value={filters.status}
              label="Lead Status"
              onChange={(e) => handleFilterChange("status", e.target.value)}
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="INTERESTED">Interested</MenuItem>
              <MenuItem value="CONTACTED">Contacted</MenuItem>
              <MenuItem value="FOLLOW_UP">Follow-up Required</MenuItem>
              <MenuItem value="WARM">Warm</MenuItem>
              <MenuItem value="APPLIED">Applied</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Priority Level
            </InputLabel>
            <Select
              value={filters.priority}
              label="Priority Level"
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="high">High Priority</MenuItem>
              <MenuItem value="medium">Medium Priority</MenuItem>
              <MenuItem value="low">Low Priority</MenuItem>
            </Select>
          </FormControl>

          {/* Source Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Lead Source
            </InputLabel>
            <Select
              value={filters.source}
              label="Lead Source"
              onChange={(e) => handleFilterChange("source", e.target.value)}
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Sources</MenuItem>
              <MenuItem value="Facebook">Facebook</MenuItem>
              <MenuItem value="Website">Website</MenuItem>
              <MenuItem value="Instagram">Instagram</MenuItem>
              <MenuItem value="Referral">Referral</MenuItem>
            </Select>
          </FormControl>

          {/* Course/Program Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Course/Program
            </InputLabel>
            <Select
              value={filters.course}
              label="Course/Program"
              onChange={(e) => handleFilterChange("course", e.target.value)}
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Courses</MenuItem>
              <MenuItem value="Computer Science">Computer Science</MenuItem>
              <MenuItem value="Business Administration">
                Business Administration
              </MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Engineering">Engineering</MenuItem>
              <MenuItem value="Medicine">Medicine</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ borderColor: "#d0d0d0" }} />

          {/* Interaction Outcome Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Last Interaction Outcome
            </InputLabel>
            <Select
              value={filters.interactionOutcome}
              label="Last Interaction Outcome"
              onChange={(e) =>
                handleFilterChange("interactionOutcome", e.target.value)
              }
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Outcomes</MenuItem>
              <MenuItem value="positive">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  Positive
                </Box>
              </MenuItem>
              <MenuItem value="neutral">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <NeutralIcon color="warning" fontSize="small" />
                  Neutral
                </Box>
              </MenuItem>
              <MenuItem value="negative">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CancelIcon color="error" fontSize="small" />
                  Negative
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Interaction Tag Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Interaction Tag
            </InputLabel>
            <Select
              value={filters.interactionTag}
              label="Interaction Tag"
              onChange={(e) =>
                handleFilterChange("interactionTag", e.target.value)
              }
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Tags</MenuItem>
              <ListSubheader sx={{ color: "success.main", fontWeight: "bold" }}>
                🟢 High Priority - Strong Conversion Signals
              </ListSubheader>
              <MenuItem value="Application Started">
                Application Started
              </MenuItem>
              <MenuItem value="Application Submitted">
                Application Submitted
              </MenuItem>
              <MenuItem value="Application Assistance">
                Application Assistance
              </MenuItem>
              <MenuItem value="Will Visit">Will Visit</MenuItem>
              <MenuItem value="Parent Meeting">Parent Meeting</MenuItem>

              <ListSubheader sx={{ color: "warning.main", fontWeight: "bold" }}>
                🟡 Medium Priority - Neutral Activities
              </ListSubheader>
              <MenuItem value="Document Shared">Document Shared</MenuItem>
              <MenuItem value="Follow-up Scheduled">
                Follow-up Scheduled
              </MenuItem>
              <MenuItem value="Reminder Sent">Reminder Sent</MenuItem>
              <MenuItem value="Deferred">Deferred</MenuItem>

              <ListSubheader sx={{ color: "error.main", fontWeight: "bold" }}>
                🔴 Low Priority - Negative Conversion Signals
              </ListSubheader>
              <MenuItem value="Scholarship Information">
                Scholarship Information
              </MenuItem>
              <MenuItem value="Financial Assistance Request">
                Financial Assistance Request
              </MenuItem>
              <MenuItem value="Payment Plan Inquiry">
                Payment Plan Inquiry
              </MenuItem>
              <MenuItem value="Lead Closed">Lead Closed</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ borderColor: "#d0d0d0" }} />

          {/* Assign Date Range Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Assigned Date Range
            </InputLabel>
            <Select
              value={filters.assignDateRange}
              label="Assigned Date Range"
              onChange={(e) =>
                handleFilterChange("assignDateRange", e.target.value)
              }
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Last Contact Range Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Last Contact Range
            </InputLabel>
            <Select
              value={filters.lastContactRange}
              label="Last Contact Range"
              onChange={(e) =>
                handleFilterChange("lastContactRange", e.target.value)
              }
              sx={{
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d0d0d0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                },
              }}
            >
              <MenuItem value="all">Any Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Filter Summary */}
          <Paper sx={{ p: 2, bgcolor: "#e8e8e8", border: "1px solid #d0d0d0" }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ color: "#333333", fontWeight: 600 }}
            >
              Filter Summary
            </Typography>
            <Typography variant="body2" sx={{ color: "#666666" }}>
              {getActiveFilterCount()} active filter
              {getActiveFilterCount() !== 1 ? "s" : ""} • Showing{" "}
              {filteredLeads.length} of {assignedLeads.length} leads
            </Typography>
          </Paper>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setAdvancedFiltersOpen(false)}
            >
              Apply Filters
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default AssignedLeads;
