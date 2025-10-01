import { useState, useCallback } from "react";

const useAssignmentData = (teamService) => {
  const [assignmentData, setAssignmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignmentData = useCallback(
    async (timeFilter = "all") => {
      setLoading(true);
      setError(null);

      try {
        const teamsResponse = await teamService.getTeams();
        const teams = teamsResponse.data || [];

        const performanceData = await Promise.all(
          teams.map(async (team) => {
            try {
              // Get assigned leads for the team
              const assignedResponse = await teamService.getAssignedLeads(
                team._id
              );
              const assignedLeads = assignedResponse.data || [];

              // Filter leads based on time filter
              const now = new Date();
              const filteredLeads = assignedLeads.filter((lead) => {
                if (timeFilter === "all") return true;

                const assignedDate = new Date(
                  lead.assignedAt || lead.createdAt
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

              // Count leads by status
              const statusCounts = filteredLeads.reduce((acc, lead) => {
                const status = lead.status || "new";
                acc[status] = (acc[status] || 0) + 1;
                return acc;
              }, {});

              // Calculate interactions (calls + emails + meetings + notes)
              const interactions = filteredLeads.reduce((total, lead) => {
                const leadInteractions =
                  (lead.callHistory?.length || 0) +
                  (lead.emailHistory?.length || 0) +
                  (lead.meetingHistory?.length || 0) +
                  (lead.notes?.length || 0);
                return total + leadInteractions;
              }, 0);

              return {
                teamId: team._id,
                teamName: team.name,
                teamLead: team.teamLead?.name || "N/A",
                totalAssigned: filteredLeads.length,
                appliedAssignments: statusCounts.applied || 0,
                enrolledAssignments: statusCounts.enrolled || 0,
                interactions: interactions,
                conversionRate:
                  filteredLeads.length > 0
                    ? (
                        ((statusCounts.enrolled || 0) / filteredLeads.length) *
                        100
                      ).toFixed(1)
                    : "0.0",
                lastActivity:
                  filteredLeads.length > 0
                    ? new Date(
                        Math.max(
                          ...filteredLeads.map((lead) =>
                            new Date(lead.updatedAt || lead.createdAt).getTime()
                          )
                        )
                      ).toLocaleDateString()
                    : "No activity",
              };
            } catch (teamError) {
              console.error(
                `Error fetching data for team ${team.name}:`,
                teamError
              );
              return {
                teamId: team._id,
                teamName: team.name,
                teamLead: team.teamLead?.name || "N/A",
                totalAssigned: 0,
                appliedAssignments: 0,
                enrolledAssignments: 0,
                interactions: 0,
                conversionRate: "0.0",
                lastActivity: "Error loading",
              };
            }
          })
        );

        setAssignmentData(performanceData);
      } catch (error) {
        console.error("Error fetching assignment performance:", error);
        setError("Failed to load assignment performance data");
      } finally {
        setLoading(false);
      }
    },
    [teamService]
  );

  const refreshAssignmentData = useCallback(
    (timeFilter) => {
      fetchAssignmentData(timeFilter);
    },
    [fetchAssignmentData]
  );

  return {
    assignmentData,
    loading,
    error,
    fetchAssignmentData,
    refreshAssignmentData,
  };
};

export default useAssignmentData;
