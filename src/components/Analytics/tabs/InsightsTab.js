import React from "react";
import { Box, Paper, Typography, Grid, Stack, Alert } from "@mui/material";
import { TrendingUp, Analytics as AnalyticsIcon } from "@mui/icons-material";

const InsightsTab = ({ analytics, assignmentData }) => {
  // Calculate conversion rates
  const getConversionRates = () => {
    const total = analytics.totalLeads || 1; // Avoid division by zero
    const interested = analytics.interestedLeads || 0;
    const applied = analytics.appliedLeads || 0;
    const enrolled = analytics.enrolledLeads || 0;
    const contacted = analytics.contactedLeads || 0;

    return {
      overallConversion:
        total > 0 ? ((enrolled / total) * 100).toFixed(1) : "0.0",
      contactedToInterested:
        contacted > 0 ? ((interested / contacted) * 100).toFixed(1) : "0.0",
      interestedToApplied:
        interested > 0 ? ((applied / interested) * 100).toFixed(1) : "0.0",
      appliedToEnrolled:
        applied > 0 ? ((enrolled / applied) * 100).toFixed(1) : "0.0",
      contactedToApplied:
        contacted > 0 ? ((applied / contacted) * 100).toFixed(1) : "0.0",
    };
  };

  // Calculate assignment metrics
  const getAssignmentMetrics = () => {
    if (!assignmentData || assignmentData.length === 0) {
      return {
        averageResponseTime: 0,
        highPerformers: 0,
        totalInteractions: 0,
        averageConversionRate: 0,
      };
    }

    const totalInteractions = assignmentData.reduce(
      (sum, team) => sum + (team.interactions || 0),
      0
    );
    const highPerformers = assignmentData.filter(
      (team) => parseFloat(team.conversionRate) > 20
    ).length;
    const avgConversion =
      assignmentData.length > 0
        ? (
            assignmentData.reduce(
              (sum, team) => sum + parseFloat(team.conversionRate),
              0
            ) / assignmentData.length
          ).toFixed(1)
        : "0.0";

    return {
      averageResponseTime: 45, // Placeholder - could be calculated from actual data
      highPerformers,
      totalInteractions,
      averageConversionRate: avgConversion,
    };
  };

  const conversionRates = getConversionRates();
  const assignmentMetrics = getAssignmentMetrics();

  const getRecommendations = () => {
    const recommendations = [];

    if (parseFloat(conversionRates.contactedToApplied) < 50) {
      recommendations.push({
        type: "warning",
        title: "💡 Improve Application Conversion",
        message: `Only ${conversionRates.contactedToApplied}% of contacted leads apply. Consider streamlining the application process or improving follow-up strategies.`,
      });
    }

    if (assignmentMetrics.averageResponseTime > 120) {
      recommendations.push({
        type: "warning",
        title: "⚡ Reduce Response Time",
        message: `Current average response time is ${assignmentMetrics.averageResponseTime} minutes. Aim for under 60 minutes to improve lead engagement.`,
      });
    }

    if (parseFloat(conversionRates.appliedToEnrolled) < 70) {
      recommendations.push({
        type: "info",
        title: "🎓 Enhance Admission Process",
        message: `${conversionRates.appliedToEnrolled}% of applications result in enrollment. Review admission criteria and support processes.`,
      });
    }

    if (assignmentMetrics.highPerformers > 0) {
      recommendations.push({
        type: "success",
        title: "✅ Focus on High Performers",
        message: `${assignmentMetrics.highPerformers} teams have conversion rates above 20%. Share their best practices with other teams.`,
      });
    }

    // Always include this recommendation
    recommendations.push({
      type: "info",
      title: "📈 Track Assignment Effectiveness",
      message:
        "Monitor lead assignment distribution and team workload to optimize performance and ensure balanced allocation.",
    });

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            📊 Key Insights
          </Typography>
          <Stack spacing={2}>
            <Alert severity="success" icon={<TrendingUp />}>
              <Typography variant="body2">
                <strong>Overall Performance:</strong>{" "}
                {conversionRates.overallConversion}% conversion rate from total
                leads to enrollment
              </Typography>
            </Alert>

            <Alert severity="info" icon={<AnalyticsIcon />}>
              <Typography variant="body2">
                <strong>Lead Volume:</strong> {analytics.totalLeads} total leads
                with {analytics.interestedLeads} showing initial interest
              </Typography>
            </Alert>

            <Alert
              severity={
                parseFloat(conversionRates.appliedToEnrolled) > 70
                  ? "success"
                  : "warning"
              }
            >
              <Typography variant="body2">
                <strong>Enrollment Rate:</strong>{" "}
                {conversionRates.appliedToEnrolled}% of applications result in
                enrollment
              </Typography>
            </Alert>

            <Alert
              severity={
                assignmentMetrics.averageResponseTime < 60
                  ? "success"
                  : "warning"
              }
            >
              <Typography variant="body2">
                <strong>Response Time:</strong> Average{" "}
                {assignmentMetrics.averageResponseTime} minutes response time
                across all teams
              </Typography>
            </Alert>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Team Performance:</strong> Average{" "}
                {assignmentMetrics.averageConversionRate}% conversion rate with{" "}
                {assignmentMetrics.totalInteractions} total interactions
              </Typography>
            </Alert>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            🎯 Action Recommendations
          </Typography>
          <Stack spacing={2}>
            {recommendations.map((rec, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: `1px solid`,
                  borderColor:
                    rec.type === "success"
                      ? "success.main"
                      : rec.type === "warning"
                      ? "warning.main"
                      : "info.main",
                  borderRadius: 2,
                  bgcolor:
                    rec.type === "success"
                      ? "success.light"
                      : rec.type === "warning"
                      ? "warning.light"
                      : "info.light",
                  opacity: 0.1,
                  "&:hover": {
                    opacity: 1,
                    transition: "opacity 0.3s ease",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color:
                      rec.type === "success"
                        ? "success.main"
                        : rec.type === "warning"
                        ? "warning.main"
                        : "info.main",
                  }}
                >
                  {rec.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {rec.message}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>

      {/* Quick Stats Grid */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            📈 Performance at a Glance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "primary.light",
                  borderRadius: 2,
                  color: "primary.contrastText",
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {conversionRates.overallConversion}%
                </Typography>
                <Typography variant="body2">Lead to Enrollment Rate</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "success.light",
                  borderRadius: 2,
                  color: "success.contrastText",
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {conversionRates.interestedToApplied}%
                </Typography>
                <Typography variant="body2">
                  Interest to Application Rate
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "info.light",
                  borderRadius: 2,
                  color: "info.contrastText",
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {assignmentMetrics.totalInteractions}
                </Typography>
                <Typography variant="body2">Total Team Interactions</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  bgcolor: "warning.light",
                  borderRadius: 2,
                  color: "warning.contrastText",
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {assignmentMetrics.averageResponseTime}m
                </Typography>
                <Typography variant="body2">Average Response Time</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Conversion Funnel Visualization */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
            🔄 Conversion Funnel Analysis
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {analytics.totalLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Leads
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  100%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="info.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {analytics.contactedLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contacted
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analytics.totalLeads > 0
                    ? (
                        (analytics.contactedLeads / analytics.totalLeads) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="warning.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {analytics.interestedLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interested
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {conversionRates.contactedToInterested}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="secondary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {analytics.appliedLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applied
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {conversionRates.interestedToApplied}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h4"
                  color="success.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {analytics.enrolledLeads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enrolled
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {conversionRates.appliedToEnrolled}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default InsightsTab;
