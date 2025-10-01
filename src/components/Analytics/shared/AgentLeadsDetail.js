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

  // Get today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

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
          lead.daysSinceLastInteraction === null;
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
          l.daysSinceLastInteraction > 3 || l.daysSinceLastInteraction === null
      ).length,
      hasApplication: processedLeads.filter((l) => l.hasApplication === true)
        .length,
      // Outcome statistics
      positiveOutcome: processedLeads.filter(
        (l) => l.latestInteraction?.outcome?.toLowerCase() === "positive"
      ).length,
      neutralOutcome: processedLeads.filter(
        (l) => l.latestInteraction?.outcome?.toLowerCase() === "neutral"
      ).length,
      negativeOutcome: processedLeads.filter(
        (l) => l.latestInteraction?.outcome?.toLowerCase() === "negative"
      ).length,
      noInteractions: processedLeads.filter((l) => !l.latestInteraction).length,
    };
  }, [processedLeads]);

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Card variant="outlined">
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Leads Assigned to {agent.name || agent.email}
            </Typography>

            {/* Quick Stats */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip
                label={`Total: ${stats.total}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`Active Today: ${stats.todayActivity}`}
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
                label={`Active This Week: ${stats.weekActivity}`}
                color="info"
                variant={activityFilter === "week" ? "filled" : "outlined"}
                size="small"
                onClick={() =>
                  setActivityFilter(activityFilter === "week" ? "all" : "week")
                }
                clickable
              />
              <Chip
                label={`No Activity: ${stats.noActivity}`}
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
              <Chip
                label={`Needs Follow-up: ${stats.needsFollowup}`}
                color="warning"
                variant={
                  activityFilter === "needsFollowup" ? "filled" : "outlined"
                }
                size="small"
                onClick={() =>
                  setActivityFilter(
                    activityFilter === "needsFollowup" ? "all" : "needsFollowup"
                  )
                }
                clickable
              />
            </Box>

            {/* Interaction Outcome Stats */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 600, color: "text.secondary" }}
              >
                Interaction Outcomes
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`Positive: ${stats.positiveOutcome}`}
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
                <Chip
                  label={`Neutral: ${stats.neutralOutcome}`}
                  color="default"
                  variant={outcomeFilter === "neutral" ? "filled" : "outlined"}
                  size="small"
                  onClick={() =>
                    setOutcomeFilter(
                      outcomeFilter === "neutral" ? "all" : "neutral"
                    )
                  }
                  clickable
                />
                <Chip
                  label={`Negative: ${stats.negativeOutcome}`}
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
                <Chip
                  label={`No Interactions: ${stats.noInteractions}`}
                  color="default"
                  variant={outcomeFilter === "none" ? "filled" : "outlined"}
                  size="small"
                  onClick={() =>
                    setOutcomeFilter(outcomeFilter === "none" ? "all" : "none")
                  }
                  clickable
                />
              </Box>
            </Box>

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
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="HAS_APPLICATION">
                    Has Application ({stats.hasApplication})
                  </MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="CONTACTED">Contacted</MenuItem>
                  <MenuItem value="INTERESTED">Interested</MenuItem>
                  <MenuItem value="APPLIED">Applied</MenuItem>
                  <MenuItem value="ENROLLED">Enrolled</MenuItem>
                  <MenuItem value="NOT_INTERESTED">Not Interested</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
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
