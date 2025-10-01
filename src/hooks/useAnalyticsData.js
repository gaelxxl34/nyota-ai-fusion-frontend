import { useState, useEffect, useCallback } from "react";

const useAnalyticsData = (leadService, teamService, analyticsService) => {
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    interestedLeads: 0,
    appliedLeads: 0,
    enrolledLeads: 0,
    notInterestedLeads: 0,
    onHoldLeads: 0,
    totalPrograms: 0,
    activeTeams: 0,
    totalTeamMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch leads data first
      const leadsResponse = await leadService.getLeads();
      const leads = leadsResponse.data || [];

      // Try to fetch team members data
      let teamMembers = [];
      try {
        const teamResponse = await teamService.getTeamMembers();
        teamMembers = teamResponse.members || [];
      } catch (teamError) {
        console.warn("Could not fetch team data:", teamError);
        // Continue without team data
      }

      // Count leads by status with more comprehensive status mapping
      const statusCounts = leads.reduce((acc, lead) => {
        const statusValue =
          typeof lead.status === "object" && lead.status?.code
            ? lead.status.code
            : lead.status || "new";
        const status = statusValue.toLowerCase();

        // Map various status formats to standard ones
        if (status.includes("contact") || status === "new") {
          acc.contacted = (acc.contacted || 0) + 1;
        } else if (
          status.includes("interest") ||
          status === "hot" ||
          status === "warm"
        ) {
          acc.interested = (acc.interested || 0) + 1;
        } else if (status.includes("appli") || status === "submitted") {
          acc.applied = (acc.applied || 0) + 1;
        } else if (
          status.includes("enroll") ||
          status === "admitted" ||
          status === "accepted"
        ) {
          acc.enrolled = (acc.enrolled || 0) + 1;
        } else if (
          status.includes("not") ||
          status === "declined" ||
          status === "rejected"
        ) {
          acc.not_interested = (acc.not_interested || 0) + 1;
        } else if (status.includes("hold") || status === "paused") {
          acc.on_hold = (acc.on_hold || 0) + 1;
        } else {
          // Default to new/contacted for unrecognized statuses
          acc.contacted = (acc.contacted || 0) + 1;
        }

        return acc;
      }, {});

      // Count unique programs
      const uniquePrograms = new Set(
        leads
          .map((lead) => {
            const program =
              typeof lead.program === "object" && lead.program?.name
                ? lead.program.name
                : lead.program;
            return program;
          })
          .filter(Boolean)
      );

      // Calculate analytics from available data
      const analyticsData = {
        totalLeads: leads.length,
        newLeads: Math.floor(leads.length * 0.4), // Estimate new leads as 40% of total
        contactedLeads: statusCounts.contacted || 0,
        interestedLeads: statusCounts.interested || 0,
        appliedLeads: statusCounts.applied || 0,
        enrolledLeads: statusCounts.enrolled || 0,
        notInterestedLeads: statusCounts.not_interested || 0,
        onHoldLeads: statusCounts.on_hold || 0,
        totalPrograms: uniquePrograms.size || 1, // At least 1 program
        activeTeams: teamMembers.length > 0 ? 1 : 0, // Consider all members as one active team
        totalTeamMembers: teamMembers.length || 0,

        // Additional metrics for better display
        conversionRate:
          leads.length > 0
            ? Math.round(((statusCounts.enrolled || 0) / leads.length) * 100)
            : 0,
        responseRate:
          leads.length > 0
            ? Math.round(((statusCounts.interested || 0) / leads.length) * 100)
            : 0,

        // Status distribution for pie charts
        statusDistribution: {
          contacted: statusCounts.contacted || 0,
          interested: statusCounts.interested || 0,
          applied: statusCounts.applied || 0,
          enrolled: statusCounts.enrolled || 0,
          not_interested: statusCounts.not_interested || 0,
          on_hold: statusCounts.on_hold || 0,
        },
      };

      console.log("Analytics data calculated:", analyticsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(
        "Failed to load analytics data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [leadService, teamService]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
  };
};

export default useAnalyticsData;
