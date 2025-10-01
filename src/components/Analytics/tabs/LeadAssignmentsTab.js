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
      console.log("Starting lead assignments data fetch...");

      // Get marketing agents using the correct approach
      console.log("Fetching marketing agents...");
      const membersResponse = await teamService.getTeamMembers();

      // Detailed logging to debug response
      console.log("Team members response:", {
        success: membersResponse.success,
        membersCount: membersResponse.members?.length || 0,
        firstMember: membersResponse.members?.[0]
          ? {
              email: membersResponse.members[0].email,
              role: membersResponse.members[0].role,
            }
          : "none",
      });

      const members = membersResponse.members || [];

      // Filter to get only marketing agents
      const marketingAgents = members.filter(
        (member) => member && member.role === "marketingAgent"
      );

      console.log("Marketing agents found:", marketingAgents.length);

      if (marketingAgents.length === 0) {
        console.warn(
          "No marketing agents found - check user roles in database"
        );
      }

      // Get leads by status using the correct statuses from the backend
      // Status values should be uppercase to match backend constants
      const statusesToFetch = [
        "NEW", // If this status exists in backend
        "CONTACTED",
        "INTERESTED",
        "APPLIED",
        "ENROLLED",
        "NOT_INTERESTED", // If this status exists in backend
        "ON_HOLD", // If this status exists in backend
      ];

      const allLeads = [];

      // Get all leads if individual status fetch doesn't work
      try {
        console.log("Fetching all leads first");
        const allLeadsResponse = await leadService.getAllLeads({
          limit: 10000,
          offset: 0,
        });

        if (allLeadsResponse?.data) {
          console.log(
            `Successfully fetched ${allLeadsResponse.data.length} leads from getAllLeads`
          );
          allLeads.push(...allLeadsResponse.data);
        }
      } catch (allLeadsError) {
        console.warn("Failed to fetch all leads:", allLeadsError);

        // Fallback: Fetch leads by status
        for (const status of statusesToFetch) {
          try {
            console.log(`Fetching leads for status: ${status}`);
            const statusResponse = await leadService.getLeadsByStatus(status, {
              limit: 10000,
              offset: 0,
            });

            if (statusResponse?.data) {
              console.log(
                `Successfully fetched ${statusResponse.data.length} leads with status ${status}`
              );
              allLeads.push(...statusResponse.data);
            }
          } catch (statusError) {
            console.warn(
              `Failed to fetch leads for status ${status}:`,
              statusError
            );
          }
        }
      }

      console.log("Total leads fetched:", allLeads.length);

      // Fetch all applications to map leadId to application existence
      console.log(
        "Fetching all applications to count applications per lead..."
      );
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
          console.log(
            `Successfully fetched ${allApplications.length} applications`
          );
        } else if (applicationsResponse?.data?.data) {
          allApplications = applicationsResponse.data.data;
          console.log(
            `Successfully fetched ${allApplications.length} applications`
          );
        } else {
          console.warn("No applications found or unexpected response format");
        }
      } catch (appError) {
        console.error("Failed to fetch applications:", appError);
        // Continue without application data
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

      console.log(
        `Created application map with ${leadApplicationMap.size} unique lead IDs`
      );

      // Store the map in state so it can be passed to AgentLeadsDetail
      setLeadApplicationMap(leadApplicationMap);

      // Filter leads based on time filter
      const now = new Date();
      const filteredLeads = allLeads.filter((lead) => {
        if (timeFilter === "all") return true;

        const assignedDate = new Date(
          lead.assignedAt || lead.updatedAt || lead.createdAt
        );
        const diffTime = now - assignedDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (timeFilter) {
          case "daily":
            return diffDays <= 1;
          case "weekly":
            return diffDays <= 7;
          case "monthly":
            return diffDays <= 30;
          default:
            return true;
        }
      });

      console.log("Filtered leads for time period:", filteredLeads.length);

      // Calculate performance for each marketing agent using the working pattern
      const performanceData = marketingAgents.map((agent) => {
        try {
          // Get leads assigned to this agent
          const assignedLeads = filteredLeads.filter((lead) => {
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

          console.log(
            `Agent ${agent.name || agent.email} has ${
              assignedLeads.length
            } assigned leads`
          );

          // Count leads with applications (any lead that has an application in the applications collection)
          const leadsWithApplications = assignedLeads.filter((lead) => {
            const leadId = lead._id || lead.id;
            return leadApplicationMap.has(leadId);
          }).length;

          console.log(
            `Agent ${
              agent.name || agent.email
            } has ${leadsWithApplications} leads with applications`
          );

          // More robust status counting that handles multiple status formats
          const statusCounts = assignedLeads.reduce((acc, lead) => {
            let status;

            // Handle various status formats
            if (typeof lead.status === "object") {
              status =
                lead.status?.code ||
                lead.status?.name ||
                lead.status?.value ||
                "NEW";
            } else {
              status = lead.status || "NEW";
            }

            // Normalize status names
            // First convert to lowercase for consistency in our component
            const normalizedStatus = status
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_");
            acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;

            // Debug log to see what statuses we're finding
            if (assignedLeads.length > 0 && !acc._logged) {
              console.log(
                `Sample lead status format: ${JSON.stringify(lead.status)}`
              );
              console.log(`Normalized to: ${normalizedStatus}`);
              acc._logged = true;
            }

            return acc;
          }, {});

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

          // Debug log for the first agent
          if (agent === marketingAgents[0]) {
            console.log(`Interaction data for ${agent.name || agent.email}:`, {
              totalByAgent: agentInteractions.totalByAgent,
              dailyByAgent: agentInteractions.dailyByAgent,
              weeklyByAgent: agentInteractions.weeklyByAgent,
              interactionsByType,
              assignedLeadsCount: assignedLeads.length,
            });
          }

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
            newAssignments: statusCounts.new || 0,
            onHoldAssignments: statusCounts.on_hold || 0,
            notInterestedAssignments: statusCounts.not_interested || 0,
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
            newAssignments: 0,
            onHoldAssignments: 0,
            notInterestedAssignments: 0,
            interactions: 0,
            dailyInteractions: 0,
            weeklyInteractions: 0,
            conversionRate: "0.0",
            lastActivity: "Error loading",
            assignedLeads: [],
          };
        }
      });

      console.log("Performance data calculated:", performanceData);

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

  if (loading) {
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

  if (error) {
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

      {/* Interaction Metrics */}
      <InteractionMetrics
        interactions={assignmentData}
        title="Team Assignment Interactions"
        timeFilter={timeFilter}
      />

      {/* Team Assignment Performance Table */}
      <Card>
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
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
                    <TableCell align="right">New</TableCell>
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <TrendingUp fontSize="small" />
                        Interactions
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
                        sx={{ cursor: "pointer" }}
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
                          <Typography variant="body2">{member.role}</Typography>
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
                            label={member.newAssignments}
                            size="small"
                            color="default"
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
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Chip
                              label={
                                timeFilter === "daily"
                                  ? `${member.dailyInteractions || 0} today`
                                  : timeFilter === "weekly"
                                  ? `${
                                      member.weeklyInteractions || 0
                                    } this week`
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
                          colSpan={12}
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
    </Box>
  );
};

export default LeadAssignmentsTab;
