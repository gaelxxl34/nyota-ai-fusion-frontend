import React, { useState, useEffect } from "react";
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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Collapse,
  Fade,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import {
  Refresh,
  TrendingUp,
  Assignment,
  People,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import TimeFilter from "../shared/TimeFilter";
import InteractionMetrics from "../shared/InteractionMetrics";
import AgentLeadsDetail from "../shared/AgentLeadsDetail";
import { leadService } from "../../../services/leadService";
import { applicationService } from "../../../services/applicationService";

const LeadAssignmentsTab = ({ teamService, analytics, refreshAnalytics }) => {
  const [assignmentData, setAssignmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [leadApplicationMap, setLeadApplicationMap] = useState(new Map());

  // Fetch assignment performance function
  const fetchAssignmentPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get marketing agents
      const membersResponse = await teamService.getTeamMembers();
      const members = membersResponse.members || [];

      // Filter to get only marketing agents
      const marketingAgents = members.filter(
        (member) => member && member.role === "marketingAgent"
      );

      // Fetch ALL leads to ensure we get assigned leads with all statuses
      const allLeads = [];
      try {
        const allLeadsResponse = await leadService.getAllLeads({
          limit: 10000,
          offset: 0,
        });

        if (allLeadsResponse?.data) {
          allLeads.push(...allLeadsResponse.data);
        }
      } catch (allLeadsError) {
        console.error("Failed to fetch all leads:", allLeadsError);
      }

      // EXPIRED/DEFERRED TRACKING: Count total leads with these statuses
      const expiredTotal = allLeads.filter(
        (l) => String(l.status || "").toUpperCase() === "EXPIRED"
      ).length;
      const deferredTotal = allLeads.filter(
        (l) => String(l.status || "").toUpperCase() === "DEFERRED"
      ).length;
      console.log(`🔍 EXPIRED leads in fetched data: ${expiredTotal}`);
      console.log(`🔍 DEFERRED leads in fetched data: ${deferredTotal}`);

      // Debug: Count leads with EXPIRED or DEFERRED that are assigned
      const assignedExpired = allLeads.filter((l) => {
        const hasAssignment = l.assignedTo || l.assigned_to;
        const isExpired = String(l.status || "").toUpperCase() === "EXPIRED";
        return hasAssignment && isExpired;
      }).length;
      const assignedDeferred = allLeads.filter((l) => {
        const hasAssignment = l.assignedTo || l.assigned_to;
        const isDeferred = String(l.status || "").toUpperCase() === "DEFERRED";
        return hasAssignment && isDeferred;
      }).length;
      console.log(`🎯 Assigned EXPIRED leads: ${assignedExpired}`);
      console.log(`🎯 Assigned DEFERRED leads: ${assignedDeferred}`);

      // Fetch all applications to map leadId to application existence
      let allApplications = [];
      try {
        const applicationsResponse = await applicationService.getApplications({
          limit: 10000,
        });

        if (
          applicationsResponse?.success &&
          applicationsResponse?.applications
        ) {
          allApplications = applicationsResponse.applications;
        } else if (applicationsResponse?.data?.data) {
          allApplications = applicationsResponse.data.data;
        }
      } catch (appError) {
        console.error("Failed to fetch applications:", appError);
      }

      // Create a map of leadId to application count for quick lookup
      const leadApplicationMap = new Map();
      allApplications.forEach((app) => {
        if (app.leadId) {
          leadApplicationMap.set(
            app.leadId,
            (leadApplicationMap.get(app.leadId) || 0) + 1
          );
        }
      });

      // Store the map in state so it can be passed to AgentLeadsDetail
      setLeadApplicationMap(leadApplicationMap);

      // Calculate performance for each marketing agent
      const performanceData = marketingAgents.map((agent) => {
        try {
          // Get leads assigned to this agent - using ALL leads, not time-filtered
          const assignedLeads = allLeads.filter((lead) => {
            const assignedTo =
              lead.assignedTo ||
              lead.assigned_to ||
              lead.assignedAgent ||
              (lead.assignment?.email ? lead.assignment.email : null);

            // Check email match with agent
            const isAssigned =
              assignedTo === agent.email ||
              (typeof assignedTo === "object" &&
                assignedTo?.email === agent.email);

            return isAssigned;
          });

          // EXPIRED/DEFERRED TRACKING: Count for this agent
          const expiredCount = assignedLeads.filter((l) => {
            // Handle both string and object status formats
            let status;
            if (typeof l.status === "object") {
              status =
                l.status?.code || l.status?.name || l.status?.value || "";
            } else {
              status = l.status || "";
            }
            const upperStatus = String(status).toUpperCase().trim();
            return upperStatus === "EXPIRED";
          }).length;
          const deferredCount = assignedLeads.filter((l) => {
            // Handle both string and object status formats
            let status;
            if (typeof l.status === "object") {
              status =
                l.status?.code || l.status?.name || l.status?.value || "";
            } else {
              status = l.status || "";
            }
            const upperStatus = String(status).toUpperCase().trim();
            return upperStatus === "DEFERRED";
          }).length;
          console.log(
            `🎯 Agent ${
              agent.name || agent.email
            } - EXPIRED: ${expiredCount}, DEFERRED: ${deferredCount}`
          );

          // Count leads with applications
          const leadsWithApplications = assignedLeads.filter((lead) => {
            const leadId = lead._id || lead.id;
            return leadApplicationMap.has(leadId);
          }).length;

          // More robust status counting that handles multiple status formats
          const statusCounts = assignedLeads.reduce((acc, lead) => {
            let status;

            // Handle various status formats
            if (typeof lead.status === "object") {
              status =
                lead.status?.code ||
                lead.status?.name ||
                lead.status?.value ||
                "INTERESTED"; // Default to INTERESTED (a real status) instead of NEW
            } else {
              status = lead.status || "INTERESTED"; // Default to INTERESTED (a real status)
            }

            // Normalize status names to UPPERCASE first for consistent comparison
            const upperStatus = String(status).toUpperCase().trim();

            // Then convert to lowercase for our object keys
            const normalizedStatus = upperStatus
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_");
            acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;

            // EXPIRED/DEFERRED TRACKING: Log when we find these statuses
            if (upperStatus === "EXPIRED" || upperStatus === "DEFERRED") {
              console.log(
                `🔍 Found ${upperStatus} lead for agent ${
                  agent.name || agent.email
                }: ${lead.name || lead.id}`
              );
            }

            return acc;
          }, {});

          // Debug: Log status counts to verify keys
          console.log(
            `📊 Status counts for ${agent.name || agent.email}:`,
            statusCounts
          );

          // Calculate interactions from timeline data, paying attention to who performed the interaction
          // Initialize counters
          let interactionsByType = {};

          // Function to extract agent-specific interactions
          const extractAgentInteractions = (lead) => {
            // Initialize result
            const result = {
              total: 0,
              byType: {},
              today: 0,
              thisWeek: 0,
              byDate: {},
            };

            // If we have interactionSummary data, check if it contains agent-specific data
            if (
              lead.interactionSummary &&
              lead.interactionSummary.byAgent &&
              lead.interactionSummary.byAgent[agent.email]
            ) {
              const agentData = lead.interactionSummary.byAgent[agent.email];
              result.total = agentData.count || 0;
              return result;
            }

            // Otherwise, parse the timeline for interactions by this agent
            if (lead.timeline && Array.isArray(lead.timeline)) {
              // Get today and 7 days ago for filtering
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Start of today
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);

              // Filter timeline for interactions by this agent
              lead.timeline.forEach((entry) => {
                // Check if this is an interaction by this agent
                if (entry.action === "INTERACTION" && entry.interaction) {
                  // Check if this agent performed the interaction
                  const interactionAgent =
                    entry.interaction.agent ||
                    entry.interaction.performedBy ||
                    entry.agent ||
                    entry.performedBy;

                  // If agent email matches or agent name includes this agent's name
                  const isThisAgent =
                    (interactionAgent?.email &&
                      interactionAgent.email === agent.email) ||
                    (interactionAgent?.name &&
                      agent.name &&
                      interactionAgent.name.includes(agent.name)) ||
                    (typeof interactionAgent === "string" &&
                      (interactionAgent === agent.email ||
                        (agent.name && interactionAgent.includes(agent.name))));

                  if (isThisAgent) {
                    // Count this interaction
                    result.total++;

                    // Count by type
                    const type = entry.interaction.type || "other";
                    result.byType[type] = (result.byType[type] || 0) + 1;

                    // Check if recent
                    let interactionDate;
                    if (entry.date) {
                      // Handle various date formats
                      if (entry.date._seconds) {
                        interactionDate = new Date(entry.date._seconds * 1000);
                      } else if (typeof entry.date === "string") {
                        interactionDate = new Date(entry.date);
                      } else if (entry.date instanceof Date) {
                        interactionDate = entry.date;
                      }
                    }

                    if (interactionDate) {
                      // Format date as YYYY-MM-DD for grouping
                      const dateStr = interactionDate
                        .toISOString()
                        .split("T")[0];
                      result.byDate[dateStr] =
                        (result.byDate[dateStr] || 0) + 1;

                      // Count recent interactions
                      if (interactionDate >= today) {
                        result.today++;
                      }

                      if (interactionDate >= weekAgo) {
                        result.thisWeek++;
                      }
                    }
                  }
                }
              });
            }

            return result;
          };

          // Process each lead for this agent and count interactions
          const agentInteractions = {
            totalByAgent: 0,
            dailyByAgent: 0,
            weeklyByAgent: 0,
          };

          assignedLeads.forEach((lead) => {
            // Get interactions for this specific agent
            const leadAgentInteractions = extractAgentInteractions(lead);

            // Add to agent totals
            agentInteractions.totalByAgent += leadAgentInteractions.total;
            agentInteractions.dailyByAgent += leadAgentInteractions.today;
            agentInteractions.weeklyByAgent += leadAgentInteractions.thisWeek;

            // Add to type counters
            Object.entries(leadAgentInteractions.byType).forEach(
              ([type, count]) => {
                interactionsByType[type] =
                  (interactionsByType[type] || 0) + count;
              }
            );
          });

          // Calculate last activity more comprehensively
          let lastActivityDate = null;
          if (assignedLeads.length > 0) {
            const activityDates = assignedLeads
              .map((lead) => {
                // Check multiple possible date fields
                const dates = [
                  lead.lastInteractionAt,
                  lead.updatedAt,
                  lead.lastContacted,
                  lead.assignedAt,
                  lead.createdAt,
                ].filter(Boolean);

                return dates.length > 0
                  ? Math.max(...dates.map((d) => new Date(d).getTime()))
                  : null;
              })
              .filter(Boolean);

            if (activityDates.length > 0) {
              lastActivityDate = new Date(Math.max(...activityDates));
            }
          }

          // Debug: Log the final values being returned
          console.log(`✅ Returning for ${agent.name || agent.email}:`, {
            expired: statusCounts.expired || 0,
            deferred: statusCounts.deferred || 0,
            expiredCount,
            deferredCount,
            statusCountsKeys: Object.keys(statusCounts),
          });

          return {
            memberId: agent._id || agent.email,
            memberName: agent.name || agent.email.split("@")[0],
            memberEmail: agent.email,
            role: "Marketing Agent",
            totalAssigned: assignedLeads.length,
            appliedAssignments: leadsWithApplications, // Count of leads with applications
            enrolledAssignments: statusCounts.enrolled || 0,
            interestedAssignments: statusCounts.interested || 0,
            contactedAssignments: statusCounts.contacted || 0,
            expiredAssignments: expiredCount, // Use directly calculated count
            deferredAssignments: deferredCount, // Use directly calculated count
            // New detailed interaction metrics
            interactions: agentInteractions.totalByAgent || 0,
            dailyInteractions: agentInteractions.dailyByAgent || 0,
            weeklyInteractions: agentInteractions.weeklyByAgent || 0,
            interactionsByType: interactionsByType,
            // Original metrics
            conversionRate:
              assignedLeads.length > 0
                ? (
                    ((statusCounts.enrolled || 0) / assignedLeads.length) *
                    100
                  ).toFixed(1)
                : "0.0",
            lastActivity: lastActivityDate
              ? lastActivityDate.toLocaleDateString()
              : assignedLeads.length > 0
              ? "Recent activity"
              : "No activity",
            // Additional insights
            activityLevel:
              agentInteractions.dailyByAgent >= 5
                ? "Very Active"
                : agentInteractions.dailyByAgent >= 3
                ? "Active"
                : agentInteractions.weeklyByAgent >= 10
                ? "Moderate"
                : "Low",
            // Store assigned leads for detail view
            assignedLeads: assignedLeads,
          };
        } catch (agentError) {
          console.error(
            `Error processing agent ${agent?.name || agent?.email}:`,
            agentError
          );
          return {
            memberId: agent._id || agent.email,
            memberName: agent.name || agent.email.split("@")[0],
            memberEmail: agent.email,
            role: "Marketing Agent",
            totalAssigned: 0,
            appliedAssignments: 0,
            enrolledAssignments: 0,
            interestedAssignments: 0,
            contactedAssignments: 0,
            expiredAssignments: 0,
            deferredAssignments: 0,
            interactions: 0,
            dailyInteractions: 0,
            weeklyInteractions: 0,
            conversionRate: "0.0",
            lastActivity: "Error loading",
            assignedLeads: [],
          };
        }
      });

      // Show all marketing agents, including those with no assignments
      setAssignmentData(performanceData);
    } catch (error) {
      console.error("Error fetching assignment performance:", error);
      setError("Failed to load assignment performance data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when time filter changes
  useEffect(() => {
    fetchAssignmentPerformance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch only when time filter changes - with debounce effect
  useEffect(() => {
    if (assignmentData.length > 0) {
      // Only re-fetch if we already have data (not initial load)
      const timeoutId = setTimeout(() => {
        fetchAssignmentPerformance();
      }, 300); // 300ms debounce for smooth transition

      return () => clearTimeout(timeoutId);
    }
  }, [timeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 70) return "success";
    if (numRate >= 40) return "warning";
    return "error";
  };

  const getInteractionColor = (interactions) => {
    if (interactions >= 10) return "success";
    if (interactions >= 5) return "warning";
    return "error";
  };

  // Only show full-page loading if we have no data yet (initial load)
  if (loading && assignmentData.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && assignmentData.length === 0) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <IconButton
          size="small"
          onClick={fetchAssignmentPerformance}
          sx={{ ml: 1 }}
        >
          <Refresh fontSize="small" />
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Time Filter */}
      <TimeFilter
        value={timeFilter}
        onChange={setTimeFilter}
        label="Filter Assignment Data by Period"
        variant="chips"
        size="small"
      />

      {/* Loading Progress Bar */}
      {loading && assignmentData.length > 0 && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
      )}

      {/* Interaction Metrics */}
      <Fade in={!loading || assignmentData.length > 0} timeout={500}>
        <Box>
          <InteractionMetrics
            interactions={assignmentData}
            title="Team Assignment Interactions"
            timeFilter={timeFilter}
          />
        </Box>
      </Fade>

      {/* Team Assignment Performance Table */}
      <Fade in={!loading || assignmentData.length > 0} timeout={500}>
        <Card sx={{ position: "relative" }}>
          {loading && assignmentData.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(255, 255, 255, 0.95)",
                zIndex: 10,
                borderRadius: 1,
                p: 3,
                overflow: "hidden",
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Skeleton variant="text" width="40%" height={32} />
              </Box>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={50}
                sx={{ mb: 1 }}
              />
              {[1, 2, 3, 4, 5].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                    <Skeleton variant="text" width="15%" height={24} />
                    <Skeleton variant="text" width="10%" height={24} />
                    <Skeleton variant="rounded" width="8%" height={28} />
                    <Skeleton variant="rounded" width="8%" height={28} />
                    <Skeleton variant="rounded" width="8%" height={28} />
                    <Skeleton variant="rounded" width="8%" height={28} />
                    <Skeleton variant="rounded" width="8%" height={28} />
                    <Skeleton variant="rounded" width="10%" height={28} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lead Assignment Performance by Agent
              </Typography>
              <Tooltip title="Refresh assignment data">
                <IconButton onClick={fetchAssignmentPerformance}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            {assignmentData.length === 0 ? (
              <Alert severity="info">
                No lead assignment data available for the selected time period.
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& .MuiTableCell-head": {
                          bgcolor: "background.paper",
                          zIndex: 3,
                          height: "64px", // Ensure consistent header height
                        },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <People fontSize="small" />
                          Agent
                        </Box>
                      </TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Total Assigned</TableCell>
                      <TableCell align="right">Contacted</TableCell>
                      <TableCell align="right">Interested</TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title="Leads with applications (In Review, Missing Document, Admitted, etc.)"
                          arrow
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "flex-end",
                              cursor: "help",
                            }}
                          >
                            <Assignment fontSize="small" />
                            Applied
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">Enrolled</TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title="Leads deferred to next intake - students still interested but will apply later"
                          arrow
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "flex-end",
                              cursor: "help",
                            }}
                          >
                            Deferred
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title="Leads marked as expired - gone cold or too old to pursue"
                          arrow
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "flex-end",
                              cursor: "help",
                            }}
                          >
                            Expired
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            justifyContent: "flex-end",
                          }}
                        >
                          <TrendingUp fontSize="small" />
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ fontWeight: 600 }}
                            >
                              Interactions
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {timeFilter === "daily"
                                ? "(Today)"
                                : timeFilter === "weekly"
                                ? "(This Week)"
                                : timeFilter === "monthly"
                                ? "(This Month)"
                                : "(All Time)"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">Conversion Rate</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell align="center">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignmentData.map((member) => (
                      <React.Fragment key={member.memberId}>
                        <TableRow
                          hover
                          sx={{
                            cursor: "pointer",
                            position:
                              expandedAgent === member.memberId
                                ? "sticky"
                                : "relative",
                            top:
                              expandedAgent === member.memberId ? 64 : "auto", // Match header height of 64px
                            zIndex: expandedAgent === member.memberId ? 2 : 1,
                            bgcolor: "background.paper",
                            "&:hover": {
                              bgcolor:
                                expandedAgent === member.memberId
                                  ? "action.hover"
                                  : "action.hover",
                            },
                          }}
                          onClick={() =>
                            setExpandedAgent(
                              expandedAgent === member.memberId
                                ? null
                                : member.memberId
                            )
                          }
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <IconButton size="small">
                                {expandedAgent === member.memberId ? (
                                  <ExpandLess />
                                ) : (
                                  <ExpandMore />
                                )}
                              </IconButton>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {member.memberName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {member.memberEmail}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {member.role}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.totalAssigned}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.contactedAssignments}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.interestedAssignments}
                              size="small"
                              color="warning"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.appliedAssignments}
                              size="small"
                              color="info"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.enrolledAssignments}
                              size="small"
                              color="success"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.deferredAssignments}
                              size="small"
                              sx={{
                                bgcolor: "#ff9800",
                                color: "white",
                                "& .MuiChip-label": { color: "white" },
                              }}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={member.expiredAssignments}
                              size="small"
                              sx={{
                                bgcolor: "#9e9e9e",
                                color: "white",
                                "& .MuiChip-label": { color: "white" },
                              }}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 0.5,
                              }}
                            >
                              <Tooltip
                                title={
                                  timeFilter === "daily"
                                    ? `${
                                        member.dailyInteractions || 0
                                      } interactions today out of ${
                                        member.interactions
                                      } total`
                                    : timeFilter === "weekly"
                                    ? `${
                                        member.weeklyInteractions || 0
                                      } interactions this week out of ${
                                        member.interactions
                                      } total`
                                    : `${member.interactions} total interactions (all time)`
                                }
                                arrow
                              >
                                <Chip
                                  label={
                                    timeFilter === "daily"
                                      ? `${member.dailyInteractions || 0}`
                                      : timeFilter === "weekly"
                                      ? `${member.weeklyInteractions || 0}`
                                      : member.interactions
                                  }
                                  size="small"
                                  color={getInteractionColor(
                                    timeFilter === "daily"
                                      ? member.dailyInteractions || 0
                                      : timeFilter === "weekly"
                                      ? member.weeklyInteractions || 0
                                      : member.interactions || 0
                                  )}
                                  variant="outlined"
                                />
                              </Tooltip>
                              {member.activityLevel && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color:
                                      member.activityLevel === "Very Active"
                                        ? "success.main"
                                        : member.activityLevel === "Active"
                                        ? "info.main"
                                        : member.activityLevel === "Moderate"
                                        ? "warning.main"
                                        : "text.secondary",
                                  }}
                                >
                                  {member.activityLevel}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${member.conversionRate}%`}
                              size="small"
                              color={getStatusColor(member.conversionRate)}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {member.lastActivity}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip
                              title={
                                expandedAgent === member.memberId
                                  ? "Collapse details"
                                  : "Expand details"
                              }
                            >
                              <IconButton size="small">
                                {expandedAgent === member.memberId ? (
                                  <ExpandLess />
                                ) : (
                                  <ExpandMore />
                                )}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail Row */}
                        <TableRow>
                          <TableCell
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                            colSpan={13}
                          >
                            <Collapse
                              in={expandedAgent === member.memberId}
                              timeout="auto"
                              unmountOnExit
                            >
                              <AgentLeadsDetail
                                agent={{
                                  name: member.memberName,
                                  email: member.memberEmail,
                                }}
                                leads={member.assignedLeads || []}
                                agentEmail={member.memberEmail}
                                leadApplicationMap={leadApplicationMap}
                              />
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default LeadAssignmentsTab;
