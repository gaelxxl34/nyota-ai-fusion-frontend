import React, { useState, useEffect, useCallback } from "react";
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
  Drawer,
  ListSubheader,
  CircularProgress,
  Alert,
  Skeleton,
  Fade,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FiberManualRecord as NeutralIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import InteractionTimeline from "../../components/InteractionTimeline/InteractionTimeline";
import { leadService } from "../../services/leadService";
import { useSnackbar } from "notistack";

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
    WARM: "success",
    APPLIED: "secondary",
    DEFERRED: "warning",
    EXPIRED: "default",
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

  // Time period state - persisted in localStorage
  const [timePeriod, setTimePeriod] = useState(() => {
    return localStorage.getItem("assignedLeadsTimePeriod") || "today";
  });

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [timelineLeadId, setTimelineLeadId] = useState(null);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateLead, setStatusUpdateLead] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Advanced filter states
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    interactionOutcome: "all",
    interactionTag: "all",
    assignDateRange: "all",
    lastContactRange: "all",
    dailyInteractionRange: "all",
    urgency: "all", // New urgency filter
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

  // ============================================
  // TIME PERIOD HELPERS
  // ============================================

  /**
   * Get date range for the selected time period
   * @returns {Object} { startDate, endDate, label, prevStartDate, prevEndDate }
   */
  const getDateRange = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timePeriod) {
      case "today": {
        const startDate = new Date(today);
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        // Yesterday for comparison
        const prevStartDate = new Date(today);
        prevStartDate.setDate(today.getDate() - 1);
        const prevEndDate = new Date(prevStartDate);
        prevEndDate.setHours(23, 59, 59, 999);

        return {
          startDate,
          endDate,
          label: `Today (${startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })})`,
          prevStartDate,
          prevEndDate,
          prevLabel: "Yesterday",
        };
      }

      case "week": {
        // Current week (Monday to Sunday)
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Previous week for comparison
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        prevSunday.setHours(23, 59, 59, 999);

        return {
          startDate: monday,
          endDate: sunday,
          label: `This Week (${monday.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${sunday.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })})`,
          prevStartDate: prevMonday,
          prevEndDate: prevSunday,
          prevLabel: "Last Week",
        };
      }

      case "month": {
        // Current month
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        // Previous month for comparison
        const prevStartDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        prevEndDate.setHours(23, 59, 59, 999);

        return {
          startDate,
          endDate,
          label: `This Month (${startDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })})`,
          prevStartDate,
          prevEndDate,
          prevLabel: "Last Month",
        };
      }

      case "all":
      default:
        return {
          startDate: null,
          endDate: null,
          label: "All Time",
          prevStartDate: null,
          prevEndDate: null,
          prevLabel: null,
        };
    }
  }, [timePeriod]);

  /**
   * Check if a date is within the selected time period
   * @param {*} dateValue - Date to check
   * @param {boolean} isPrevious - Check against previous period
   * @returns {boolean}
   */
  const isDateInRange = useCallback(
    (dateValue, isPrevious = false) => {
      if (!dateValue) return false;

      const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange();

      // All time period - include everything
      if (!startDate || !endDate) return true;

      // Parse the date
      let checkDate = null;
      try {
        if (dateValue instanceof Date) {
          checkDate = dateValue;
        } else if (
          typeof dateValue === "object" &&
          (dateValue.seconds || dateValue._seconds)
        ) {
          const seconds = dateValue.seconds || dateValue._seconds;
          checkDate = new Date(seconds * 1000);
        } else if (typeof dateValue === "string") {
          if (dateValue.includes(" at ")) {
            const [datePart, timePart] = dateValue.split(" at ");
            if (datePart && timePart) {
              const timeWithoutTimezone = timePart.split(" ")[0];
              const combinedDateTime = `${datePart} ${timeWithoutTimezone}`;
              checkDate = new Date(combinedDateTime);
            }
          } else {
            checkDate = new Date(dateValue);
          }
        } else if (typeof dateValue === "number") {
          checkDate =
            dateValue > 1000000000000
              ? new Date(dateValue)
              : new Date(dateValue * 1000);
        }

        if (!checkDate || isNaN(checkDate.getTime())) {
          return false;
        }

        // Check against appropriate range
        if (isPrevious) {
          return (
            prevStartDate &&
            prevEndDate &&
            checkDate >= prevStartDate &&
            checkDate <= prevEndDate
          );
        } else {
          return checkDate >= startDate && checkDate <= endDate;
        }
      } catch (error) {
        console.error("Error checking date range:", error);
        return false;
      }
    },
    [getDateRange]
  );

  /**
   * Handle time period change
   */
  const handleTimePeriodChange = useCallback((newPeriod) => {
    setTimePeriod(newPeriod);
    localStorage.setItem("assignedLeadsTimePeriod", newPeriod);
  }, []);

  // ============================================
  // END TIME PERIOD HELPERS
  // ============================================

  // Helper function to extract last interaction outcome and type
  const extractLastInteraction = useCallback((lead) => {
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
  }, []);

  // Helper function to extract interaction tags from timeline
  const extractInteractionTags = useCallback((lead) => {
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
  }, []);

  // Helper function to determine lead priority
  const determinePriority = useCallback(
    (lead) => {
      // Extract interaction data
      const { lastInteractionOutcome } = extractLastInteraction(lead);
      const interactionTags = lead.interactionTags || [];

      // Define high-priority interaction tags (from InteractionTimeline component)
      const highPriorityTags = [
        "Application Started",
        "Application Submitted",
        "Application Assistance",
        "Will Visit",
        "Campus Visit",
        "Parent Meeting",
      ];

      // Define low-priority interaction tags
      const lowPriorityTags = [
        "Scholarship Information",
        "Financial Assistance Request",
        "Payment Plan Inquiry",
        "Lead Closed",
      ];

      // Check if lead has any high-priority tags
      const hasHighPriorityTag = interactionTags.some((tag) =>
        highPriorityTags.some((hpTag) =>
          tag.toLowerCase().includes(hpTag.toLowerCase())
        )
      );

      // Check if lead has any low-priority tags
      const hasLowPriorityTag = interactionTags.some((tag) =>
        lowPriorityTags.some((lpTag) =>
          tag.toLowerCase().includes(lpTag.toLowerCase())
        )
      );

      // Priority logic based on interaction outcome first
      if (lastInteractionOutcome === "positive") {
        // Positive interactions = engaged leads
        if (hasHighPriorityTag) {
          return "high"; // Positive outcome + high-priority tag = TOP priority
        }
        return "high"; // Any positive interaction is high priority
      } else if (lastInteractionOutcome === "negative") {
        // Negative interactions = disengaged leads
        return "low"; // Always low priority for negative outcomes
      } else if (lastInteractionOutcome === "neutral") {
        // Neutral interactions = needs follow-up
        if (hasHighPriorityTag) {
          return "high"; // Neutral + high tag = still high priority
        }
        if (hasLowPriorityTag) {
          return "low"; // Neutral + low tag = low priority
        }
        return "medium"; // Default neutral = medium priority
      } else {
        // No interactions yet - base priority on tags only
        if (hasHighPriorityTag) {
          return "high";
        }
        if (hasLowPriorityTag) {
          return "low";
        }

        // Completely new lead with no interactions - medium priority
        return "medium";
      }
    },
    [extractLastInteraction]
  );

  // Fetch assigned leads from the API
  const fetchAssignedLeads = useCallback(async () => {
    try {
      setLoading(true);
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

        // Calculate stats for dashboard (currently unused in UI)
        // const statsData = {
        //   total: processedLeads.length,
        //   applied: processedLeads.filter((lead) => lead.status === "APPLIED")
        //     .length,
        //   followUp: processedLeads.filter((lead) => lead.status === "FOLLOW_UP")
        //     .length,
        //   // Only count real interactions, not fake data
        //   positiveInteractions: processedLeads.filter(
        //     (lead) => lead.lastInteractionOutcome === "positive"
        //   ).length,
        //   negativeInteractions: processedLeads.filter(
        //     (lead) => lead.lastInteractionOutcome === "negative"
        //   ).length,
        //   highPriority: processedLeads.filter(
        //     (lead) => lead.priority === "high"
        //   ).length,
        // };

        // setStats(statsData); // Stats not currently used in UI
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
    }
  }, [
    enqueueSnackbar,
    determinePriority,
    extractInteractionTags,
    extractLastInteraction,
  ]);

  // Load data on component mount
  useEffect(() => {
    fetchAssignedLeads();
  }, [fetchAssignedLeads]);

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
      interactionOutcome: "all",
      interactionTag: "all",
      assignDateRange: "all",
      lastContactRange: "all",
      dailyInteractionRange: "all",
      urgency: "all",
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
  };

  const handleStatusUpdateClose = () => {
    setStatusUpdateDialogOpen(false);
    setStatusUpdateLead(null);
    setNewStatus("");
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
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

  // Helper function to calculate days since last contact
  // MUST be defined before filteredLeads calculation
  const getDaysSinceLastContact = (lastContact) => {
    if (!lastContact) return null;

    try {
      let contactDate = null;

      // Handle Firestore Timestamps
      if (
        typeof lastContact === "object" &&
        (lastContact.seconds || lastContact._seconds)
      ) {
        const seconds = lastContact.seconds || lastContact._seconds;
        contactDate = new Date(seconds * 1000);
      }
      // Handle string dates
      else if (typeof lastContact === "string") {
        if (lastContact.includes(" at ")) {
          const [datePart, timePart] = lastContact.split(" at ");
          if (datePart && timePart) {
            const timeWithoutTimezone = timePart.split(" ")[0];
            const combinedDateTime = `${datePart} ${timeWithoutTimezone}`;
            contactDate = new Date(combinedDateTime);
          }
        } else {
          contactDate = new Date(lastContact);
        }
      }
      // Handle Date objects
      else if (lastContact instanceof Date) {
        contactDate = lastContact;
      }

      if (contactDate && !isNaN(contactDate.getTime())) {
        const now = new Date();
        const diffTime = Math.abs(now - contactDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
    } catch (error) {
      console.error("Error calculating days since last contact:", error);
    }

    return null;
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

    const matchesInteractionOutcome =
      filters.interactionOutcome === "all" ||
      lead.lastInteractionOutcome === filters.interactionOutcome;

    const matchesInteractionTag =
      filters.interactionTag === "all" ||
      (lead.interactionTags &&
        lead.interactionTags.includes(filters.interactionTag));

    // Helper function to parse dates consistently
    const parseDate = (dateValue) => {
      if (!dateValue) return null;

      try {
        // Handle Date objects
        if (dateValue instanceof Date) {
          return dateValue;
        }

        // Handle Firestore Timestamps or similar objects with seconds
        if (
          typeof dateValue === "object" &&
          (dateValue.seconds || dateValue._seconds)
        ) {
          const seconds = dateValue.seconds || dateValue._seconds;
          return new Date(seconds * 1000);
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
                return parsedDate;
              }
            }
          }

          // Try standard date parsing for other string formats
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }

        // Handle timestamp numbers
        if (typeof dateValue === "number") {
          return dateValue > 1000000000000
            ? new Date(dateValue) // milliseconds
            : new Date(dateValue * 1000); // seconds
        }
      } catch (error) {
        console.error("Error parsing date:", error, dateValue);
      }

      return null;
    };

    // Date range filters
    const matchesAssignDate = () => {
      if (filters.assignDateRange === "all") return true;

      const assignDate = parseDate(lead.assignedDate);
      if (!assignDate) return false; // If we can't parse the date, exclude it

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

      const lastContact = parseDate(lead.lastContact);
      if (!lastContact) return false; // If we can't parse the date, exclude it

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
        case "thisMonth":
          return (
            lastContact.getMonth() === today.getMonth() &&
            lastContact.getFullYear() === today.getFullYear()
          );
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

    const matchesDailyInteraction = () => {
      if (filters.dailyInteractionRange === "all") return true;

      if (!lead.timeline || !Array.isArray(lead.timeline)) return false;

      const today = new Date();

      // Find interactions based on the filter range
      const hasInteractionInRange = lead.timeline.some((entry) => {
        if (entry.action !== "INTERACTION") return false;

        let entryDate = parseDate(entry.date);
        if (!entryDate) return false;

        switch (filters.dailyInteractionRange) {
          case "today":
            return entryDate.toDateString() === today.toDateString();
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return entryDate.toDateString() === yesterday.toDateString();
          case "thisWeek":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return entryDate >= weekStart;
          case "thisMonth":
            return (
              entryDate.getMonth() === today.getMonth() &&
              entryDate.getFullYear() === today.getFullYear()
            );
          case "last7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return entryDate >= sevenDaysAgo;
          case "last30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            return entryDate >= thirtyDaysAgo;
          default:
            return false;
        }
      });

      return hasInteractionInRange;
    };

    const matchesUrgency = () => {
      if (filters.urgency === "all") return true;

      const daysSince = getDaysSinceLastContact(lead.lastContact);

      switch (filters.urgency) {
        case "never":
          return daysSince === null;
        case "today":
          return daysSince === 0;
        case "1-2days":
          return daysSince >= 1 && daysSince <= 2;
        case "3-7days":
          return daysSince >= 3 && daysSince <= 7;
        case "7plus":
          return daysSince !== null && daysSince > 7;
        case "urgent":
          // Combined filter: never contacted OR 3+ days since last contact
          return daysSince === null || daysSince >= 3;
        default:
          return true;
      }
    };

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesInteractionOutcome &&
      matchesInteractionTag &&
      matchesAssignDate() &&
      matchesLastContact() &&
      matchesDailyInteraction() &&
      matchesUrgency()
    );
  });

  const statusCounts = {
    all: filteredLeads.length,
    INTERESTED: filteredLeads.filter((l) => l.status === "INTERESTED").length,
    CONTACTED: filteredLeads.filter((l) => l.status === "CONTACTED").length,
    // Changed: Use neutral outcomes as follow-up indicator since FOLLOW_UP status doesn't exist
    FOLLOW_UP: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "neutral"
    ).length,
    WARM: filteredLeads.filter((l) => l.status === "WARM").length,
    APPLIED: filteredLeads.filter((l) => l.status === "APPLIED").length,
    EXPIRED: filteredLeads.filter((l) => l.status === "EXPIRED").length,
    DEFERRED: filteredLeads.filter((l) => l.status === "DEFERRED").length,
  };

  // Additional analytics for better insights
  const analyticsData = {
    // Card 1: Total Assigned (Always all-time)
    totalAssigned: assignedLeads.length,
    totalFiltered: filteredLeads.length,

    // Card 2: Applied - Filter by time period
    appliedInPeriod:
      timePeriod === "all"
        ? assignedLeads.filter((l) => l.status === "APPLIED").length
        : assignedLeads.filter((lead) => {
            if (lead.status !== "APPLIED") return false;
            // Check if application date is within period
            return lead.applicationDate
              ? isDateInRange(lead.applicationDate)
              : false;
          }).length,
    appliedAllTime: assignedLeads.filter((l) => l.status === "APPLIED").length,

    // Card 3: Follow-up - Filter by time period (leads with neutral outcomes in period)
    followUpInPeriod:
      timePeriod === "all"
        ? filteredLeads.filter((l) => l.lastInteractionOutcome === "neutral")
            .length
        : assignedLeads.filter((lead) => {
            // Check if last interaction was neutral AND within the time period
            if (lead.lastInteractionOutcome !== "neutral") return false;
            return lead.lastInteractionAt
              ? isDateInRange(lead.lastInteractionAt)
              : false;
          }).length,
    followUpAllTime: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "neutral"
    ).length,

    // Card 4: Positive Interactions - Filter by time period
    positiveInPeriod:
      timePeriod === "all"
        ? filteredLeads.filter((l) => l.lastInteractionOutcome === "positive")
            .length
        : assignedLeads.filter((lead) => {
            if (lead.lastInteractionOutcome !== "positive") return false;
            return lead.lastInteractionAt
              ? isDateInRange(lead.lastInteractionAt)
              : false;
          }).length,
    positiveAllTime: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "positive"
    ).length,

    // Other metrics
    neutralOutcomes: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "neutral"
    ).length,
    negativeOutcomes: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "negative"
    ).length,
    positiveOutcomes: filteredLeads.filter(
      (l) => l.lastInteractionOutcome === "positive"
    ).length,
    highPriority: filteredLeads.filter((l) => l.priority === "high").length,

    // Application started count
    applicationStarted: filteredLeads.filter(
      (l) =>
        l.interactionTags &&
        l.interactionTags.length > 0 &&
        l.interactionTags.some((tag) => tag.includes("Application"))
    ).length,

    // Card 5: Interactions in current time period
    dailyInteractions: assignedLeads.filter((lead) => {
      if (!lead.timeline || !Array.isArray(lead.timeline)) return false;

      return lead.timeline.some((entry) => {
        if (entry.action !== "INTERACTION") return false;
        return isDateInRange(entry.date);
      });
    }).length,

    // Leads contacted in current time period
    contactedToday: assignedLeads.filter((lead) => {
      if (!lead.lastContact) return false;
      return isDateInRange(lead.lastContact);
    }).length,

    // Count leads needing urgent attention (no contact in 3+ days)
    needsUrgentAttention: assignedLeads.filter((lead) => {
      const daysSince = getDaysSinceLastContact(lead.lastContact);
      return daysSince === null || daysSince >= 3;
    }).length,

    // Card 6: Expired - Filter by time period
    expiredInPeriod:
      timePeriod === "all"
        ? assignedLeads.filter((l) => l.status === "EXPIRED").length
        : assignedLeads.filter((lead) => {
            if (lead.status !== "EXPIRED") return false;
            // Check if the status was changed to EXPIRED within the period
            // Use updatedAt as proxy for when status changed
            return lead.updatedAt ? isDateInRange(lead.updatedAt) : false;
          }).length,
    expiredAllTime: assignedLeads.filter((l) => l.status === "EXPIRED").length,

    // Card 7: Deferred - Filter by time period
    deferredInPeriod:
      timePeriod === "all"
        ? assignedLeads.filter((l) => l.status === "DEFERRED").length
        : assignedLeads.filter((lead) => {
            if (lead.status !== "DEFERRED") return false;
            // Check if the status was changed to DEFERRED within the period
            // Use updatedAt as proxy for when status changed
            return lead.updatedAt ? isDateInRange(lead.updatedAt) : false;
          }).length,
    deferredAllTime: assignedLeads.filter((l) => l.status === "DEFERRED")
      .length,
  };

  // Calculate previous period analytics for comparison
  const previousAnalyticsData = {
    dailyInteractions: assignedLeads.filter((lead) => {
      if (!lead.timeline || !Array.isArray(lead.timeline)) return false;

      return lead.timeline.some((entry) => {
        if (entry.action !== "INTERACTION") return false;
        return isDateInRange(entry.date, true); // Check previous period
      });
    }).length,
    contactedPrevious: assignedLeads.filter((lead) => {
      if (!lead.lastContact) return false;
      return isDateInRange(lead.lastContact, true); // Check previous period
    }).length,
    appliedPrevious:
      timePeriod === "all"
        ? 0
        : assignedLeads.filter((lead) => {
            if (lead.status !== "APPLIED") return false;
            return lead.applicationDate
              ? isDateInRange(lead.applicationDate, true)
              : false;
          }).length,
    positivePrevious:
      timePeriod === "all"
        ? 0
        : assignedLeads.filter((lead) => {
            if (lead.lastInteractionOutcome !== "positive") return false;
            return lead.lastInteractionAt
              ? isDateInRange(lead.lastInteractionAt, true)
              : false;
          }).length,
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

      {/* Time Period Selector */}
      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
              gap: 2,
            }}
          >
            {/* Time Period Toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarIcon sx={{ color: "primary.main" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  View Performance:
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  p: 0.5,
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                {[
                  { value: "today", label: "Today", icon: "📅" },
                  { value: "week", label: "This Week", icon: "📊" },
                  { value: "month", label: "This Month", icon: "📆" },
                  { value: "all", label: "All Time", icon: "📈" },
                ].map((period) => (
                  <Button
                    key={period.value}
                    variant={timePeriod === period.value ? "contained" : "text"}
                    size="small"
                    onClick={() => handleTimePeriodChange(period.value)}
                    sx={{
                      minWidth: { xs: "auto", sm: 100 },
                      fontWeight: timePeriod === period.value ? 700 : 500,
                      transition: "all 0.3s ease",
                      ...(timePeriod === period.value
                        ? {
                            boxShadow: 2,
                            transform: "scale(1.05)",
                          }
                        : {
                            color: "text.secondary",
                            "&:hover": {
                              bgcolor: "rgba(0, 0, 0, 0.04)",
                            },
                          }),
                    }}
                    startIcon={
                      <span style={{ fontSize: "1.2rem" }}>{period.icon}</span>
                    }
                  >
                    {period.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Date Range Display */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.9)",
                px: 2,
                py: 1,
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getDateRange().label}
              </Typography>
            </Box>
          </Box>

          {/* Historical Comparison */}
          {timePeriod !== "all" && getDateRange().prevLabel && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TimelineIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                >
                  Comparison with {getDateRange().prevLabel}:
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                {/* Contacts Comparison */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: "info.main" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Leads Contacted:
                  </Typography>
                  <Chip
                    size="small"
                    label={previousAnalyticsData.contactedPrevious}
                    sx={{
                      bgcolor: "rgba(0, 0, 0, 0.06)",
                      fontWeight: 600,
                      minWidth: 40,
                    }}
                  />
                  {analyticsData.contactedToday !==
                    previousAnalyticsData.contactedPrevious && (
                    <Chip
                      size="small"
                      icon={
                        analyticsData.contactedToday >
                        previousAnalyticsData.contactedPrevious ? (
                          <TrendingUpIcon />
                        ) : (
                          <TrendingUpIcon
                            sx={{ transform: "rotate(180deg)" }}
                          />
                        )
                      }
                      label={`${
                        analyticsData.contactedToday >
                        previousAnalyticsData.contactedPrevious
                          ? "+"
                          : ""
                      }${
                        analyticsData.contactedToday -
                        previousAnalyticsData.contactedPrevious
                      }`}
                      color={
                        analyticsData.contactedToday >
                        previousAnalyticsData.contactedPrevious
                          ? "success"
                          : "error"
                      }
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Box>

                {/* Interactions Comparison */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TimelineIcon
                    sx={{ fontSize: 18, color: "secondary.main" }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Total Activities:
                  </Typography>
                  <Chip
                    size="small"
                    label={previousAnalyticsData.dailyInteractions}
                    sx={{
                      bgcolor: "rgba(0, 0, 0, 0.06)",
                      fontWeight: 600,
                      minWidth: 40,
                    }}
                  />
                  {analyticsData.dailyInteractions !==
                    previousAnalyticsData.dailyInteractions && (
                    <Chip
                      size="small"
                      icon={
                        analyticsData.dailyInteractions >
                        previousAnalyticsData.dailyInteractions ? (
                          <TrendingUpIcon />
                        ) : (
                          <TrendingUpIcon
                            sx={{ transform: "rotate(180deg)" }}
                          />
                        )
                      }
                      label={`${
                        analyticsData.dailyInteractions >
                        previousAnalyticsData.dailyInteractions
                          ? "+"
                          : ""
                      }${
                        analyticsData.dailyInteractions -
                        previousAnalyticsData.dailyInteractions
                      }`}
                      color={
                        analyticsData.dailyInteractions >
                        previousAnalyticsData.dailyInteractions
                          ? "success"
                          : "error"
                      }
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Personal Performance Widget */}
      {!loading && !error && assignedLeads.length > 0 && (
        <Card
          sx={{
            mb: 4,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              width: "200px",
              height: "200px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              transform: "translate(50%, -50%)",
            },
          }}
        >
          <CardContent sx={{ position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🎯 {getDateRange().label} Performance
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {timePeriod === "today"
                    ? "Keep up the great work!"
                    : timePeriod === "week"
                    ? "Your weekly progress"
                    : timePeriod === "month"
                    ? "Your monthly performance"
                    : "Your overall statistics"}
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUpIcon />}
                label={`${analyticsData.dailyInteractions} interactions`}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
            </Box>

            <Grid container spacing={3}>
              {/* Leads Contacted in Period */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 500 }}
                  >
                    Leads Contacted{" "}
                    {timePeriod === "all"
                      ? "Ever"
                      : getDateRange().label.split("(")[0]}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mr: 1 }}>
                      {analyticsData.contactedToday}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>
                      / {assignedLeads.length}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      position: "relative",
                      height: 8,
                      bgcolor: "rgba(255,255,255,0.3)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${Math.min(
                          (analyticsData.contactedToday /
                            assignedLeads.length) *
                            100,
                          100
                        )}%`,
                        bgcolor: "white",
                        borderRadius: 4,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.5, opacity: 0.8, display: "block" }}
                  >
                    {Math.round(
                      (analyticsData.contactedToday / assignedLeads.length) *
                        100
                    )}
                    % completion rate
                  </Typography>
                </Box>
              </Grid>

              {/* Interactions Made in Period */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 500 }}
                  >
                    Total Interactions Made
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mr: 1 }}>
                      {analyticsData.dailyInteractions}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>
                      {timePeriod === "all" ? "total" : "in period"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, opacity: 0.9 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {analyticsData.positiveOutcomes} positive outcomes
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Urgent Attention Needed */}
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 500 }}
                  >
                    Needs Urgent Attention
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mr: 1 }}>
                      {analyticsData.needsUrgentAttention}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8 }}>
                      leads
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16, opacity: 0.9 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Not contacted in 3+ days
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Card 1: Total Assigned (Always All-Time) */}
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              bgcolor: "primary.main",
              color: "white",
              height: 160,
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
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                {getActiveFilterCount() > 0
                  ? "Filtered Results"
                  : "Total Assigned"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  display: "block",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mt: 1,
                }}
              >
                {getActiveFilterCount() > 0
                  ? `of ${analyticsData.totalAssigned} total`
                  : "📊 All Time"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Applied (Adapts to Time Period) */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip
            title={`Shows leads who applied ${
              timePeriod === "all" ? "ever" : "during the selected time period"
            }. Application date is used to determine if it falls within the period.`}
            arrow
            placement="top"
          >
            <Card
              sx={{
                bgcolor: "success.main",
                color: "white",
                height: 160,
                display: "flex",
                alignItems: "center",
                cursor: "help",
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
                    analyticsData.appliedInPeriod
                  )}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Applied
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    display: "block",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  {timePeriod === "today"
                    ? "📅 Today"
                    : timePeriod === "week"
                    ? "📊 This Week"
                    : timePeriod === "month"
                    ? "📆 This Month"
                    : "📈 All Time"}
                </Typography>
                {timePeriod !== "all" &&
                  analyticsData.appliedAllTime >
                    analyticsData.appliedInPeriod && (
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, fontSize: "0.65rem" }}
                    >
                      {analyticsData.appliedAllTime} total
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card 3: Follow-up (Adapts to Time Period) */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip
            title={`Shows leads with neutral interaction outcomes ${
              timePeriod === "all" ? "overall" : "during the selected period"
            } - these need follow-up to move forward.`}
            arrow
            placement="top"
          >
            <Card
              sx={{
                bgcolor: "warning.main",
                color: "white",
                height: 160,
                display: "flex",
                alignItems: "center",
                cursor: "help",
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
                    analyticsData.followUpInPeriod
                  )}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Need Follow-up
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    display: "block",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  {timePeriod === "today"
                    ? "📅 Today"
                    : timePeriod === "week"
                    ? "📊 This Week"
                    : timePeriod === "month"
                    ? "📆 This Month"
                    : "📈 All Time"}
                </Typography>
                {analyticsData.highPriority > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, fontSize: "0.65rem" }}
                  >
                    {analyticsData.highPriority} high priority
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card 4: Positive Interactions (Adapts to Time Period) */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip
            title={`Shows leads with positive interaction outcomes ${
              timePeriod === "all" ? "overall" : "during the selected period"
            } - these are engaged and progressing well.`}
            arrow
            placement="top"
          >
            <Card
              sx={{
                bgcolor: "info.main",
                color: "white",
                height: 160,
                display: "flex",
                alignItems: "center",
                cursor: "help",
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
                    analyticsData.positiveInPeriod
                  )}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Positive Interactions
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    display: "block",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  {timePeriod === "today"
                    ? "📅 Today"
                    : timePeriod === "week"
                    ? "📊 This Week"
                    : timePeriod === "month"
                    ? "📆 This Month"
                    : "📈 All Time"}
                </Typography>
                {analyticsData.negativeOutcomes > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, fontSize: "0.65rem" }}
                  >
                    {analyticsData.negativeOutcomes} negative
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card 5: Interactions (Adapts to Time Period) */}
        <Grid item xs={12} sm={6} md={2}>
          <Card
            sx={{
              bgcolor: "secondary.main",
              color: "white",
              height: 160,
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
                  analyticsData.dailyInteractions
                )}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Interactions Made
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.9,
                  display: "block",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mt: 1,
                }}
              >
                {timePeriod === "today"
                  ? "📅 Today"
                  : timePeriod === "week"
                  ? "📊 This Week"
                  : timePeriod === "month"
                  ? "📆 This Month"
                  : "📈 All Time"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.8, fontSize: "0.65rem" }}
              >
                {analyticsData.contactedToday} leads contacted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 6: Expired Leads (NEW) */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip
            title="Shows leads that have been marked as EXPIRED - these leads have gone cold or are too old to pursue effectively."
            arrow
            placement="top"
          >
            <Card
              sx={{
                bgcolor: "#9e9e9e",
                color: "white",
                height: 160,
                display: "flex",
                alignItems: "center",
                cursor: "help",
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
                    analyticsData.expiredInPeriod
                  )}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Expired
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    display: "block",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  {timePeriod === "today"
                    ? "📅 Today"
                    : timePeriod === "week"
                    ? "📊 This Week"
                    : timePeriod === "month"
                    ? "📆 This Month"
                    : "📈 All Time"}
                </Typography>
                {timePeriod !== "all" &&
                  analyticsData.expiredAllTime >
                    analyticsData.expiredInPeriod && (
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, fontSize: "0.65rem" }}
                    >
                      {analyticsData.expiredAllTime} total
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>

        {/* Card 7: Deferred Leads (NEW) */}
        <Grid item xs={12} sm={6} md={2}>
          <Tooltip
            title="Shows leads that have been deferred to the next intake - these students are interested but will apply later."
            arrow
            placement="top"
          >
            <Card
              sx={{
                bgcolor: "#ff9800",
                color: "white",
                height: 160,
                display: "flex",
                alignItems: "center",
                cursor: "help",
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
                    analyticsData.deferredInPeriod
                  )}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Deferred to Next Intake
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    display: "block",
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  {timePeriod === "today"
                    ? "📅 Today"
                    : timePeriod === "week"
                    ? "📊 This Week"
                    : timePeriod === "month"
                    ? "📆 This Month"
                    : "📈 All Time"}
                </Typography>
                {timePeriod !== "all" &&
                  analyticsData.deferredAllTime >
                    analyticsData.deferredInPeriod && (
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, fontSize: "0.65rem" }}
                    >
                      {analyticsData.deferredAllTime} total
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Tooltip>
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
        <ListSubheader sx={{ color: "text.secondary", fontWeight: "bold" }}>
          📊 Status Tracking
        </ListSubheader>
        <MenuItem
          onClick={() => {
            setSelectedStatus("DEFERRED");
            handleFilterClose();
          }}
          selected={selectedStatus === "DEFERRED"}
        >
          <Chip
            label={`Deferred (${statusCounts.DEFERRED})`}
            sx={{
              mr: 1,
              bgcolor: "#ff9800",
              color: "white",
              "& .MuiChip-label": { color: "white" },
            }}
            size="small"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedStatus("EXPIRED");
            handleFilterClose();
          }}
          selected={selectedStatus === "EXPIRED"}
        >
          <Chip
            label={`Expired (${statusCounts.EXPIRED})`}
            sx={{
              mr: 1,
              bgcolor: "#9e9e9e",
              color: "white",
              "& .MuiChip-label": { color: "white" },
            }}
            size="small"
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
        <Divider />
        <MenuItem
          onClick={() => {
            handleFilterChange("dailyInteractionRange", "today");
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon color="secondary" fontSize="small" />
            Worked on{" "}
            {timePeriod === "today"
              ? "Today"
              : timePeriod === "week"
              ? "This Week"
              : timePeriod === "month"
              ? "This Month"
              : ""}{" "}
            ({analyticsData.dailyInteractions})
          </Box>
        </MenuItem>
        <Divider />
        <ListSubheader>⏰ Contact Urgency</ListSubheader>
        <MenuItem
          onClick={() => {
            setSearchTerm("");
            setSelectedStatus("all");
            // Use the urgency filter to show leads needing attention (3+ days or never contacted)
            handleFilterChange("urgency", "urgent"); // This will match never contacted OR 3+ days
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ScheduleIcon sx={{ color: "#f57c00" }} fontSize="small" />
            Need Contact Today ({analyticsData.needsUrgentAttention})
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSearchTerm("");
            setSelectedStatus("all");
            // Filter to show only leads never contacted
            handleFilterChange("urgency", "never");
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CancelIcon sx={{ color: "#d32f2f" }} fontSize="small" />
            Never Contacted (
            {
              assignedLeads.filter(
                (l) => getDaysSinceLastContact(l.lastContact) === null
              ).length
            }
            )
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSearchTerm("");
            setSelectedStatus("all");
            // Filter to show only leads contacted in current period
            handleFilterChange(
              "urgency",
              timePeriod === "today" ? "today" : "all"
            );
            handleFilterClose();
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: "#2e7d32" }} fontSize="small" />
            Contacted{" "}
            {timePeriod === "today"
              ? "Today"
              : timePeriod === "week"
              ? "This Week"
              : timePeriod === "month"
              ? "This Month"
              : "Ever"}{" "}
            ({analyticsData.contactedToday})
          </Box>
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
        <Fade in={loading}>
          <Box>
            {/* Stats Cards Skeleton */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Grid item xs={12} sm={6} md={2.4} key={item}>
                  <Card
                    sx={{ height: 140, display: "flex", alignItems: "center" }}
                  >
                    <CardContent
                      sx={{
                        textAlign: "center",
                        width: "100%",
                        py: 2,
                        "&:last-child": { pb: 2 },
                      }}
                    >
                      <Skeleton
                        variant="text"
                        width={80}
                        height={60}
                        sx={{ mx: "auto", mb: 1 }}
                      />
                      <Skeleton
                        variant="text"
                        width={120}
                        height={20}
                        sx={{ mx: "auto", mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width={100}
                        height={16}
                        sx={{ mx: "auto" }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Search and Filter Skeleton */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Skeleton variant="rounded" height={56} sx={{ flexGrow: 1 }} />
                <Skeleton variant="rounded" width={150} height={56} />
                <Skeleton variant="rounded" width={180} height={56} />
              </Box>
            </Box>

            {/* Lead Cards Skeleton */}
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} key={item}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        {/* Avatar Skeleton */}
                        <Skeleton variant="circular" width={56} height={56} />

                        {/* Content Skeleton */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Box sx={{ width: "70%" }}>
                              <Skeleton
                                variant="text"
                                width="60%"
                                height={32}
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                <Skeleton
                                  variant="rounded"
                                  width={100}
                                  height={24}
                                />
                                <Skeleton
                                  variant="rounded"
                                  width={120}
                                  height={24}
                                />
                              </Box>
                            </Box>
                            <Skeleton
                              variant="rounded"
                              width={150}
                              height={24}
                            />
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                              <Skeleton
                                variant="text"
                                width="80%"
                                height={20}
                                sx={{ mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="75%"
                                height={20}
                                sx={{ mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="70%"
                                height={20}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Skeleton
                                variant="text"
                                width="85%"
                                height={20}
                                sx={{ mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="80%"
                                height={20}
                                sx={{ mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="75%"
                                height={20}
                                sx={{ mb: 1 }}
                              />
                              <Skeleton
                                variant="text"
                                width="70%"
                                height={20}
                              />
                            </Grid>
                          </Grid>

                          <Skeleton
                            variant="rounded"
                            width="100%"
                            height={48}
                            sx={{ mb: 2 }}
                          />

                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Skeleton
                              variant="rounded"
                              width={120}
                              height={36}
                            />
                            <Skeleton
                              variant="rounded"
                              width={140}
                              height={36}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
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
        <Fade in={!loading} timeout={800}>
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
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {lead.name}
                              </Typography>
                              {/* Days Since Last Contact Badge */}
                              {(() => {
                                const daysSince = getDaysSinceLastContact(
                                  lead.lastContact
                                );
                                if (daysSince === null) {
                                  return (
                                    <Tooltip title="No contact recorded yet - High priority!">
                                      <Chip
                                        icon={<ScheduleIcon />}
                                        label="Never contacted"
                                        size="small"
                                        sx={{
                                          bgcolor: "#d32f2f",
                                          color: "white",
                                          fontWeight: 700,
                                          animation: "pulse 2s infinite",
                                          "@keyframes pulse": {
                                            "0%, 100%": { opacity: 1 },
                                            "50%": { opacity: 0.7 },
                                          },
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                } else if (daysSince === 0) {
                                  return (
                                    <Tooltip title="Contacted today - Great job!">
                                      <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Today"
                                        size="small"
                                        sx={{
                                          bgcolor: "#2e7d32",
                                          color: "white",
                                          fontWeight: 600,
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                } else if (daysSince === 1) {
                                  return (
                                    <Tooltip title="Last contacted yesterday">
                                      <Chip
                                        icon={<ScheduleIcon />}
                                        label="1 day ago"
                                        size="small"
                                        sx={{
                                          bgcolor: "#388e3c",
                                          color: "white",
                                          fontWeight: 600,
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                } else if (daysSince === 2) {
                                  return (
                                    <Tooltip title="Last contacted 2 days ago - Follow up soon">
                                      <Chip
                                        icon={<ScheduleIcon />}
                                        label="2 days ago"
                                        size="small"
                                        sx={{
                                          bgcolor: "#f57c00",
                                          color: "white",
                                          fontWeight: 600,
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                } else if (daysSince >= 3 && daysSince <= 7) {
                                  return (
                                    <Tooltip
                                      title={`Last contacted ${daysSince} days ago - Urgent follow up needed!`}
                                    >
                                      <Chip
                                        icon={<ScheduleIcon />}
                                        label={`${daysSince} days ago`}
                                        size="small"
                                        sx={{
                                          bgcolor: "#e64a19",
                                          color: "white",
                                          fontWeight: 700,
                                          animation: "pulse 2s infinite",
                                          "@keyframes pulse": {
                                            "0%, 100%": { opacity: 1 },
                                            "50%": { opacity: 0.7 },
                                          },
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                } else {
                                  return (
                                    <Tooltip
                                      title={`Last contacted ${daysSince} days ago - VERY URGENT!`}
                                    >
                                      <Chip
                                        icon={<CancelIcon />}
                                        label={`${daysSince}+ days`}
                                        size="small"
                                        sx={{
                                          bgcolor: "#b71c1c",
                                          color: "white",
                                          fontWeight: 700,
                                          animation: "pulse 1.5s infinite",
                                          "@keyframes pulse": {
                                            "0%, 100%": { opacity: 1 },
                                            "50%": { opacity: 0.6 },
                                          },
                                          "& .MuiChip-icon": { color: "white" },
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                }
                              })()}
                            </Box>
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
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
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
                              <SchoolIcon color="action" fontSize="small" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
        </Fade>
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
                <ListSubheader>Active Lead Statuses</ListSubheader>
                <MenuItem value="INTERESTED">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      INTERESTED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lead has shown initial interest
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="CONTACTED">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      CONTACTED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      First contact has been made
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="WARM">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      WARM
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lead is actively engaged and interested
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="APPLIED">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      APPLIED
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Student has submitted application
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <ListSubheader>Inactive Lead Statuses</ListSubheader>
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
              <Divider />
              <ListSubheader>Active Statuses</ListSubheader>
              <MenuItem value="INTERESTED">Interested</MenuItem>
              <MenuItem value="CONTACTED">Contacted</MenuItem>
              <MenuItem value="WARM">Warm</MenuItem>
              <MenuItem value="APPLIED">Applied</MenuItem>
              <Divider />
              <ListSubheader>Inactive Statuses</ListSubheader>
              <MenuItem value="DEFERRED">Deferred to Next Intake</MenuItem>
              <MenuItem value="EXPIRED">Expired / Cold</MenuItem>
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

          {/* Urgency Filter - NEW */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Contact Urgency
            </InputLabel>
            <Select
              value={filters.urgency}
              label="Contact Urgency"
              onChange={(e) => handleFilterChange("urgency", e.target.value)}
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
              <MenuItem value="all">All Urgency Levels</MenuItem>
              <MenuItem value="urgent">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon sx={{ color: "#f57c00" }} fontSize="small" />
                  🔥 Needs Urgent Attention (Never or 3+ Days)
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem value="never">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CancelIcon sx={{ color: "#d32f2f" }} fontSize="small" />
                  Never Contacted (Most Urgent)
                </Box>
              </MenuItem>
              <MenuItem value="7plus">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CancelIcon sx={{ color: "#b71c1c" }} fontSize="small" />
                  7+ Days (Very Urgent)
                </Box>
              </MenuItem>
              <MenuItem value="3-7days">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon sx={{ color: "#e64a19" }} fontSize="small" />
                  3-7 Days (Urgent)
                </Box>
              </MenuItem>
              <MenuItem value="1-2days">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ScheduleIcon sx={{ color: "#f57c00" }} fontSize="small" />
                  1-2 Days (Follow Up Soon)
                </Box>
              </MenuItem>
              <MenuItem value="today">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: "#2e7d32" }} fontSize="small" />
                  Contacted Today
                </Box>
              </MenuItem>
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
              <Divider />
              <ListSubheader>📅 Quick Filters</ListSubheader>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="thisWeek">📊 This Week (Weekly View)</MenuItem>
              <MenuItem value="thisMonth">
                📊 This Month (Monthly View)
              </MenuItem>
              <Divider />
              <ListSubheader>📆 Rolling Periods</ListSubheader>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
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
              <Divider />
              <ListSubheader>📅 Quick Filters</ListSubheader>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="thisWeek">📊 This Week (Weekly View)</MenuItem>
              <MenuItem value="thisMonth">
                📊 This Month (Monthly View)
              </MenuItem>
              <Divider />
              <ListSubheader>📆 Rolling Periods</ListSubheader>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Daily Interaction Range Filter */}
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: "#666666", "&.Mui-focused": { color: "#1976d2" } }}
            >
              Interaction Date Range
            </InputLabel>
            <Select
              value={filters.dailyInteractionRange}
              label="Interaction Date Range"
              onChange={(e) =>
                handleFilterChange("dailyInteractionRange", e.target.value)
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
              <Divider />
              <ListSubheader>📅 Quick Filters</ListSubheader>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="thisWeek">📊 This Week (Weekly View)</MenuItem>
              <MenuItem value="thisMonth">
                📊 This Month (Monthly View)
              </MenuItem>
              <Divider />
              <ListSubheader>📆 Rolling Periods</ListSubheader>
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
