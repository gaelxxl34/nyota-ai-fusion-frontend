import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
  Badge,
  Alert,
} from "@mui/material";
import {
  Search,
  TrendingUp,
  CheckCircle,
  Assignment,
} from "@mui/icons-material";

// Helper function to format dates
const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";

  try {
    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    // Handle Firestore Timestamps
    if (
      typeof dateValue === "object" &&
      (dateValue.seconds || dateValue._seconds)
    ) {
      const seconds = dateValue.seconds || dateValue._seconds;
      return new Date(seconds * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    // Handle string dates
    if (typeof dateValue === "string") {
      // Handle Firestore string format
      if (dateValue.includes(" at ")) {
        const [datePart, timePart] = dateValue.split(" at ");
        if (datePart && timePart) {
          const timeWithoutTimezone = timePart.split(" ")[0];
          const combinedDateTime = `${datePart} ${timeWithoutTimezone}`;
          const parsedDate = new Date(combinedDateTime);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          }
        }
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }

    // Handle timestamp numbers
    if (typeof dateValue === "number") {
      return (
        dateValue > 1000000000000
          ? new Date(dateValue)
          : new Date(dateValue * 1000)
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
  }

  return typeof dateValue === "string" ? dateValue : "Not available";
};

// Helper to get status color
const getStatusColor = (status) => {
  const statusStr = typeof status === "string" ? status.toUpperCase() : "";
  const colors = {
    NEW: "default",
    CONTACTED: "info",
    INTERESTED: "warning",
    APPLIED: "primary",
    ENROLLED: "success",
    NOT_INTERESTED: "error",
    ON_HOLD: "warning",
    DEFERRED: "warning",
    EXPIRED: "default",
  };
  return colors[statusStr] || "default";
};

// Helper to calculate days since
const getDaysSince = (dateValue) => {
  try {
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (
      typeof dateValue === "object" &&
      (dateValue.seconds || dateValue._seconds)
    ) {
      const seconds = dateValue.seconds || dateValue._seconds;
      date = new Date(seconds * 1000);
    } else if (typeof dateValue === "string") {
      date = new Date(dateValue);
    } else if (typeof dateValue === "number") {
      date =
        dateValue > 1000000000000
          ? new Date(dateValue)
          : new Date(dateValue * 1000);
    }

    if (date && !isNaN(date.getTime())) {
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
  } catch (error) {
    console.error("Error calculating days since:", error);
  }
  return null;
};

// Helper to get outcome color
const getOutcomeColor = (outcome) => {
  const outcomeStr = typeof outcome === "string" ? outcome.toLowerCase() : "";
  const colors = {
    positive: "success",
    neutral: "default",
    negative: "error",
  };
  return colors[outcomeStr] || "default";
};

const AgentLeadsDetail = ({ agent, leads, agentEmail, leadApplicationMap }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");

  // Get today's date for filtering - wrapped in useMemo to prevent recreating on every render
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const weekAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() - 7);
    return date;
  }, [today]);

  // Extract agent's interactions from leads
  const getAgentInteractions = useCallback(
    (lead) => {
      const interactions = [];

      if (lead.timeline && Array.isArray(lead.timeline)) {
        lead.timeline.forEach((entry) => {
          if (entry.action === "INTERACTION" && entry.interaction) {
            const interactionAgent =
              entry.interaction.agent ||
              entry.interaction.performedBy ||
              entry.agent ||
              entry.performedBy;

            const isThisAgent =
              (interactionAgent?.email &&
                interactionAgent.email === agentEmail) ||
              (interactionAgent?.name &&
                agent.name &&
                interactionAgent.name.includes(agent.name)) ||
              (typeof interactionAgent === "string" &&
                (interactionAgent === agentEmail ||
                  (agent.name && interactionAgent.includes(agent.name))));

            if (isThisAgent) {
              let interactionDate;
              if (entry.date) {
                if (entry.date._seconds) {
                  interactionDate = new Date(entry.date._seconds * 1000);
                } else if (typeof entry.date === "string") {
                  interactionDate = new Date(entry.date);
                } else if (entry.date instanceof Date) {
                  interactionDate = entry.date;
                }
              }

              interactions.push({
                type: entry.interaction.type || "Interaction",
                outcome: entry.interaction.outcome || "neutral",
                date: interactionDate,
                notes: entry.interaction.notes || entry.notes,
              });
            }
          }
        });
      }

      return interactions;
    },
    [agentEmail, agent.name]
  );

  // Process leads with agent-specific data
  const processedLeads = useMemo(() => {
    return leads.map((lead) => {
      const agentInteractions = getAgentInteractions(lead);
      const latestInteraction =
        agentInteractions.length > 0
          ? agentInteractions.sort((a, b) => (b.date || 0) - (a.date || 0))[0]
          : null;

      const todayInteractions = agentInteractions.filter((int) => {
        if (!int.date) return false;
        const intDate = new Date(int.date);
        intDate.setHours(0, 0, 0, 0);
        return intDate.getTime() === today.getTime();
      }).length;

      const weekInteractions = agentInteractions.filter((int) => {
        if (!int.date) return false;
        return new Date(int.date) >= weekAgo;
      }).length;

      return {
        ...lead,
        agentInteractions: agentInteractions.length,
        todayInteractions,
        weekInteractions,
        latestInteraction,
        daysSinceAssignment: getDaysSince(lead.assignedAt || lead.updatedAt),
        daysSinceLastInteraction: latestInteraction?.date
          ? getDaysSince(latestInteraction.date)
          : null,
        hasApplication: leadApplicationMap
          ? leadApplicationMap.has(lead._id || lead.id)
          : false,
      };
    });
  }, [leads, today, weekAgo, getAgentInteractions, leadApplicationMap]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return processedLeads.filter((lead) => {
      // Search filter - handle objects safely
      const leadName =
        typeof lead.name === "string"
          ? lead.name
          : lead.name?.full || lead.name?.first || "";
      const leadEmail =
        typeof lead.email === "string" ? lead.email : lead.email?.address || "";
      const leadPhone =
        typeof lead.phone === "string" ? lead.phone : lead.phone?.number || "";
      const leadProgram =
        typeof lead.programOfInterest === "string"
          ? lead.programOfInterest
          : typeof lead.program === "string"
          ? lead.program
          : lead.programOfInterest?.name || lead.program?.name || "";

      const matchesSearch =
        !searchTerm ||
        leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leadEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leadPhone.includes(searchTerm) ||
        leadProgram.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const leadStatus =
        typeof lead.status === "string"
          ? lead.status.toUpperCase()
          : lead.status?.code || lead.status?.name || "";

      // Handle special "HAS_APPLICATION" status filter
      let matchesStatus = false;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "HAS_APPLICATION") {
        matchesStatus = lead.hasApplication === true;
      } else {
        matchesStatus = leadStatus === statusFilter;
      }

      // Outcome filter
      const latestOutcome =
        lead.latestInteraction?.outcome?.toLowerCase() || "none";
      const matchesOutcome =
        outcomeFilter === "all" || latestOutcome === outcomeFilter;

      // Activity filter
      let matchesActivity = true;
      if (activityFilter === "today") {
        matchesActivity = lead.todayInteractions > 0;
      } else if (activityFilter === "week") {
        matchesActivity = lead.weekInteractions > 0;
      } else if (activityFilter === "noActivity") {
        matchesActivity = lead.agentInteractions === 0;
      } else if (activityFilter === "needsFollowup") {
        matchesActivity =
          lead.daysSinceLastInteraction > 3 ||
          lead.daysSinceLastInteraction === null ||
          lead.latestInteraction?.outcome?.toLowerCase() === "neutral";
      }

      return (
        matchesSearch && matchesStatus && matchesOutcome && matchesActivity
      );
    });
  }, [processedLeads, searchTerm, statusFilter, outcomeFilter, activityFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: processedLeads.length,
      todayActivity: processedLeads.filter((l) => l.todayInteractions > 0)
        .length,
      weekActivity: processedLeads.filter((l) => l.weekInteractions > 0).length,
      noActivity: processedLeads.filter((l) => l.agentInteractions === 0)
        .length,
      needsFollowup: processedLeads.filter(
        (l) =>
          l.daysSinceLastInteraction > 3 ||
          l.daysSinceLastInteraction === null ||
          l.latestInteraction?.outcome?.toLowerCase() === "neutral"
      ).length,
      hasApplication: processedLeads.filter((l) => l.hasApplication === true)
        .length,
      // Status counts for EXPIRED and DEFERRED
      expiredLeads: processedLeads.filter((l) => {
        const leadStatus =
          typeof l.status === "string"
            ? l.status.toUpperCase()
            : l.status?.code || l.status?.name || "";
        return leadStatus === "EXPIRED";
      }).length,
      deferredLeads: processedLeads.filter((l) => {
        const leadStatus =
          typeof l.status === "string"
            ? l.status.toUpperCase()
            : l.status?.code || l.status?.name || "";
        return leadStatus === "DEFERRED";
      }).length,
      // Outcome statistics - count ALL interactions with outcomes across all leads
      positiveOutcome: processedLeads.reduce((count, lead) => {
        const agentInteractions = getAgentInteractions(lead);
        return (
          count +
          agentInteractions.filter(
            (int) => int.outcome?.toLowerCase() === "positive"
          ).length
        );
      }, 0),
      neutralOutcome: processedLeads.reduce((count, lead) => {
        const agentInteractions = getAgentInteractions(lead);
        return (
          count +
          agentInteractions.filter(
            (int) => int.outcome?.toLowerCase() === "neutral"
          ).length
        );
      }, 0),
      negativeOutcome: processedLeads.reduce((count, lead) => {
        const agentInteractions = getAgentInteractions(lead);
        return (
          count +
          agentInteractions.filter(
            (int) => int.outcome?.toLowerCase() === "negative"
          ).length
        );
      }, 0),
      noInteractions: processedLeads.filter((l) => l.agentInteractions === 0)
        .length,
      // Total interactions count for verification
      totalInteractions: processedLeads.reduce((count, lead) => {
        return count + lead.agentInteractions;
      }, 0),
    };
  }, [processedLeads, getAgentInteractions]);

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Card variant="outlined">
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Leads Assigned to {agent.name || agent.email}
              </Typography>
              {/* Quick Performance Metrics */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Average interactions per lead">
                  <Chip
                    icon={<TrendingUp />}
                    label={`${(
                      stats.totalInteractions / (stats.total || 1)
                    ).toFixed(1)} avg/lead`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Positive outcome rate">
                  <Chip
                    label={`${(
                      (stats.positiveOutcome / (stats.totalInteractions || 1)) *
                      100
                    ).toFixed(0)}% positive`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Tooltip>
              </Box>
            </Box>

            {/* Context Alert - More concise */}
            <Alert severity="info" icon={false} sx={{ mb: 2, py: 1 }}>
              <Typography variant="caption">
                📊 <strong>All-time data</strong> • Use filters below to focus
                on recent activity or specific outcomes
              </Typography>
            </Alert>

            {/* Quick Stats - Reorganized with dividers */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                label={`Total Leads: ${stats.total}`}
                color="primary"
                variant="filled"
                size="small"
              />
              <Box
                sx={{
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  mx: 0.5,
                }}
              />
              <Chip
                label={`Today: ${stats.todayActivity}`}
                color="success"
                variant={activityFilter === "today" ? "filled" : "outlined"}
                size="small"
                onClick={() =>
                  setActivityFilter(
                    activityFilter === "today" ? "all" : "today"
                  )
                }
                clickable
              />
              <Chip
                label={`This Week: ${stats.weekActivity}`}
                color="info"
                variant={activityFilter === "week" ? "filled" : "outlined"}
                size="small"
                onClick={() =>
                  setActivityFilter(activityFilter === "week" ? "all" : "week")
                }
                clickable
              />
              <Box
                sx={{
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  mx: 0.5,
                }}
              />
              <Chip
                label={`Inactive: ${stats.noActivity}`}
                color="error"
                variant={
                  activityFilter === "noActivity" ? "filled" : "outlined"
                }
                size="small"
                onClick={() =>
                  setActivityFilter(
                    activityFilter === "noActivity" ? "all" : "noActivity"
                  )
                }
                clickable
              />
              <Tooltip
                title="Includes: No activity for 3+ days, never contacted, or neutral outcome (needs follow-up)"
                arrow
              >
                <Chip
                  label={`Needs Follow-up: ${stats.needsFollowup}`}
                  color="warning"
                  variant={
                    activityFilter === "needsFollowup" ? "filled" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setActivityFilter(
                      activityFilter === "needsFollowup"
                        ? "all"
                        : "needsFollowup"
                    )
                  }
                  clickable
                />
              </Tooltip>
              <Box
                sx={{
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  mx: 0.5,
                }}
              />
              <Tooltip
                title="Leads deferred to next intake - students still interested but will apply later"
                arrow
              >
                <Chip
                  label={`Deferred: ${stats.deferredLeads}`}
                  sx={{
                    bgcolor:
                      statusFilter === "DEFERRED" ? "#ff9800" : "transparent",
                    color: statusFilter === "DEFERRED" ? "white" : "#ff9800",
                    borderColor: "#ff9800",
                    borderWidth: 1,
                    borderStyle: "solid",
                    "& .MuiChip-label": {
                      color: statusFilter === "DEFERRED" ? "white" : "#ff9800",
                    },
                  }}
                  size="small"
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "DEFERRED" ? "all" : "DEFERRED"
                    )
                  }
                  clickable
                />
              </Tooltip>
              <Tooltip
                title="Leads marked as expired - gone cold or too old to pursue"
                arrow
              >
                <Chip
                  label={`Expired: ${stats.expiredLeads}`}
                  sx={{
                    bgcolor:
                      statusFilter === "EXPIRED" ? "#9e9e9e" : "transparent",
                    color: statusFilter === "EXPIRED" ? "white" : "#9e9e9e",
                    borderColor: "#9e9e9e",
                    borderWidth: 1,
                    borderStyle: "solid",
                    "& .MuiChip-label": {
                      color: statusFilter === "EXPIRED" ? "white" : "#9e9e9e",
                    },
                  }}
                  size="small"
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === "EXPIRED" ? "all" : "EXPIRED"
                    )
                  }
                  clickable
                />
              </Tooltip>
            </Box>

            {/* Interaction Outcome Stats */}
            <Box
              sx={{
                mt: 2,
                p: 2.5,
                bgcolor: "primary.50",
                borderRadius: 2,
                border: "2px solid",
                borderColor: "primary.200",
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
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "text.primary", mb: 0.5 }}
                  >
                    📞 Interaction Outcomes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total {stats.totalInteractions} interactions across{" "}
                    {stats.total} leads
                  </Typography>
                </Box>
                <Chip
                  label={`${stats.totalInteractions} Total`}
                  size="medium"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Outcome breakdown with percentages */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                <Chip
                  label={`✓ Positive: ${stats.positiveOutcome} (${(
                    (stats.positiveOutcome / (stats.totalInteractions || 1)) *
                    100
                  ).toFixed(0)}%)`}
                  color="success"
                  variant={outcomeFilter === "positive" ? "filled" : "outlined"}
                  size="small"
                  onClick={() =>
                    setOutcomeFilter(
                      outcomeFilter === "positive" ? "all" : "positive"
                    )
                  }
                  clickable
                />
                <Tooltip
                  title="Neutral outcomes require follow-up to move forward"
                  arrow
                >
                  <Chip
                    label={`⟳ Neutral (Follow-up): ${stats.neutralOutcome} (${(
                      (stats.neutralOutcome / (stats.totalInteractions || 1)) *
                      100
                    ).toFixed(0)}%)`}
                    color="warning"
                    variant={
                      outcomeFilter === "neutral" ? "filled" : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      setOutcomeFilter(
                        outcomeFilter === "neutral" ? "all" : "neutral"
                      )
                    }
                    clickable
                  />
                </Tooltip>
                <Chip
                  label={`✗ Negative: ${stats.negativeOutcome} (${(
                    (stats.negativeOutcome / (stats.totalInteractions || 1)) *
                    100
                  ).toFixed(0)}%)`}
                  color="error"
                  variant={outcomeFilter === "negative" ? "filled" : "outlined"}
                  size="small"
                  onClick={() =>
                    setOutcomeFilter(
                      outcomeFilter === "negative" ? "all" : "negative"
                    )
                  }
                  clickable
                />
              </Box>

              {/* Only show "No Interactions" if there are leads without interactions */}
              {stats.noInteractions > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: "1px dashed",
                    borderColor: "divider",
                  }}
                >
                  <Chip
                    label={`⚠ ${stats.noInteractions} lead${
                      stats.noInteractions !== 1 ? "s" : ""
                    } with no interactions yet`}
                    color="warning"
                    variant={outcomeFilter === "none" ? "filled" : "outlined"}
                    size="small"
                    onClick={() =>
                      setOutcomeFilter(
                        outcomeFilter === "none" ? "all" : "none"
                      )
                    }
                    clickable
                  />
                </Box>
              )}

              {stats.totalInteractions !==
                stats.positiveOutcome +
                  stats.neutralOutcome +
                  stats.negativeOutcome && (
                <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                  <Typography variant="caption">
                    Note:{" "}
                    {stats.totalInteractions -
                      (stats.positiveOutcome +
                        stats.neutralOutcome +
                        stats.negativeOutcome)}{" "}
                    interaction(s) don't have an outcome recorded
                  </Typography>
                </Alert>
              )}
            </Box>

            {/* Status Flow Explanation */}
            <Alert severity="info" icon={false} sx={{ mt: 2, py: 0.5 }}>
              <Typography variant="caption">
                💡 <strong>Marketing Agent Flow:</strong> New (assigned) →
                Contacted (reach out) → Interested (positive response) → Applied
                (submitted application) → Enrolled (accepted) |
                <strong> On Hold:</strong> Waiting for lead's response or
                decision |<strong> Not Interested:</strong> Lead declined |
                <strong> Deferred:</strong> Will apply next intake |
                <strong> Expired:</strong> Gone cold / no longer pursuing
              </Typography>
            </Alert>

            {/* Filters */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
              <TextField
                size="small"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  renderValue={(selected) => {
                    if (selected === "all") return "All Statuses";
                    if (selected === "HAS_APPLICATION")
                      return `Has Application (${stats.hasApplication})`;
                    if (selected === "NEW") return "New";
                    if (selected === "ON_HOLD") return "On Hold";
                    if (selected === "DEFERRED") return "Deferred";
                    if (selected === "EXPIRED") return "Expired";
                    return selected.replace(/_/g, " ");
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="HAS_APPLICATION">
                    Has Application ({stats.hasApplication})
                  </MenuItem>
                  <MenuItem value="NEW">
                    <Box>
                      <Typography variant="body2">New</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Just assigned - Agent must make first contact
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="CONTACTED">
                    <Box>
                      <Typography variant="body2">Contacted</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Agent reached out, awaiting response
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="INTERESTED">
                    <Box>
                      <Typography variant="body2">Interested</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Lead showed interest - Guide to application
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="APPLIED">
                    <Box>
                      <Typography variant="body2">Applied</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Application submitted - Track admission
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ENROLLED">
                    <Box>
                      <Typography variant="body2">Enrolled</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        ✓ Success! Lead is now a student
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="NOT_INTERESTED">
                    <Box>
                      <Typography variant="body2">Not Interested</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Lead declined - No further action needed
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ON_HOLD">
                    <Box>
                      <Typography variant="body2">On Hold</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Paused - Waiting for lead's response/decision
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="DEFERRED">
                    <Box>
                      <Typography variant="body2">Deferred</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Student wants to apply for next intake
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="EXPIRED">
                    <Box>
                      <Typography variant="body2">Expired</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        Lead has gone cold - No longer pursuing
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Interaction Outcome</InputLabel>
                <Select
                  value={outcomeFilter}
                  label="Interaction Outcome"
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Outcomes</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="none">No Interactions</MenuItem>
                </Select>
              </FormControl>

              {activityFilter !== "all" && (
                <Chip
                  label={`Clear filter: ${activityFilter}`}
                  onDelete={() => setActivityFilter("all")}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </Box>

          {/* Leads Table */}
          {filteredLeads.length === 0 ? (
            <Alert severity="info">No leads found matching your filters.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lead</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Interactions by this agent">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          <TrendingUp fontSize="small" />
                          Activity
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>Last Interaction</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Interaction Outcome</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                          >
                            {lead.name?.charAt(0) || "L"}
                          </Avatar>
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {typeof lead.name === "string"
                                  ? lead.name
                                  : lead.name?.full ||
                                    lead.name?.first ||
                                    "Unknown"}
                              </Typography>
                              {lead.hasApplication && (
                                <Tooltip title="Has application submitted">
                                  <Assignment
                                    fontSize="small"
                                    color="primary"
                                    sx={{ fontSize: "1rem" }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {typeof lead.email === "string"
                                ? lead.email
                                : lead.email?.address || "No email"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            typeof lead.status === "string"
                              ? lead.status
                              : lead.status?.name || "Unknown"
                          }
                          size="small"
                          color={getStatusColor(lead.status)}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {typeof lead.programOfInterest === "string"
                            ? lead.programOfInterest
                            : typeof lead.program === "string"
                            ? lead.program
                            : lead.programOfInterest?.name ||
                              lead.program?.name ||
                              "Not specified"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Chip
                            label={`${lead.agentInteractions} total`}
                            size="small"
                            variant="outlined"
                            color={
                              lead.agentInteractions > 0 ? "primary" : "default"
                            }
                          />
                          {lead.todayInteractions > 0 && (
                            <Badge
                              badgeContent={lead.todayInteractions}
                              color="success"
                            >
                              <CheckCircle fontSize="small" color="success" />
                            </Badge>
                          )}
                          {lead.weekInteractions > 0 &&
                            lead.todayInteractions === 0 && (
                              <Typography variant="caption" color="info.main">
                                {lead.weekInteractions} this week
                              </Typography>
                            )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        {lead.latestInteraction ? (
                          <Box>
                            <Typography variant="body2">
                              {formatDate(lead.latestInteraction.date)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {lead.daysSinceLastInteraction !== null
                                ? `${lead.daysSinceLastInteraction} days ago`
                                : ""}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No interactions
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(lead.assignedAt || lead.updatedAt)}
                        </Typography>
                        {lead.daysSinceAssignment !== null && (
                          <Typography variant="caption" color="text.secondary">
                            {lead.daysSinceAssignment} days ago
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {lead.latestInteraction ? (
                          <Chip
                            label={
                              lead.latestInteraction.outcome
                                ? lead.latestInteraction.outcome
                                    .charAt(0)
                                    .toUpperCase() +
                                  lead.latestInteraction.outcome.slice(1)
                                : "Unknown"
                            }
                            size="small"
                            color={getOutcomeColor(
                              lead.latestInteraction.outcome
                            )}
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="No Interactions"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredLeads.length} of {processedLeads.length} leads
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AgentLeadsDetail;
