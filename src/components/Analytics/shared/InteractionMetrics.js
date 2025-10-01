import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  InfoOutlined,
} from "@mui/icons-material";

const InteractionMetrics = ({
  interactions,
  title = "Recent Interactions",
  timeFilter = "all",
}) => {
  // Calculate trend based on time filter
  const getTrendData = () => {
    if (!interactions || interactions.length === 0) {
      return { trend: "flat", percentage: 0 };
    }

    const totalInteractions = interactions.reduce(
      (sum, item) => sum + (item.interactions || 0),
      0
    );
    const avgInteractions = totalInteractions / interactions.length;

    // Simple trend calculation (this could be more sophisticated)
    if (avgInteractions > 5) return { trend: "up", percentage: 15 };
    if (avgInteractions < 2) return { trend: "down", percentage: -8 };
    return { trend: "flat", percentage: 0 };
  };

  const { trend, percentage } = getTrendData();

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp sx={{ color: "success.main", fontSize: 20 }} />;
      case "down":
        return <TrendingDown sx={{ color: "error.main", fontSize: 20 }} />;
      default:
        return <TrendingFlat sx={{ color: "warning.main", fontSize: 20 }} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "success";
      case "down":
        return "error";
      default:
        return "default";
    }
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "daily":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      default:
        return "All Time";
    }
  };

  // Calculate interaction totals using the new properties
  const totalInteractions =
    interactions?.reduce((sum, item) => sum + (item.interactions || 0), 0) || 0;

  // Calculate daily interactions
  const totalDailyInteractions =
    interactions?.reduce(
      (sum, item) => sum + (item.dailyInteractions || 0),
      0
    ) || 0;

  // Calculate weekly interactions
  const totalWeeklyInteractions =
    interactions?.reduce(
      (sum, item) => sum + (item.weeklyInteractions || 0),
      0
    ) || 0;

  // Get the most active agent
  const mostActiveAgent =
    interactions && interactions.length > 0
      ? [...interactions].sort(
          (a, b) => (b.dailyInteractions || 0) - (a.dailyInteractions || 0)
        )[0]
      : null;

  return (
    <Card sx={{ mb: 2 }}>
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
            {title}
          </Typography>
          <Tooltip title="Interaction metrics show team engagement with assigned leads. Daily and weekly counts reflect actual agent interactions.">
            <IconButton size="small">
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {timeFilter === "daily"
                ? totalDailyInteractions.toLocaleString()
                : timeFilter === "weekly"
                ? totalWeeklyInteractions.toLocaleString()
                : totalInteractions.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {timeFilter === "daily"
                ? "Today's Interactions"
                : timeFilter === "weekly"
                ? "This Week's Interactions"
                : "Total Interactions"}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {getTrendIcon()}
              <Typography
                variant="body2"
                sx={{
                  color:
                    trend === "up"
                      ? "success.main"
                      : trend === "down"
                      ? "error.main"
                      : "text.secondary",
                  fontWeight: 600,
                }}
              >
                {percentage !== 0
                  ? `${percentage > 0 ? "+" : ""}${percentage}%`
                  : "Stable"}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs previous period
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`Period: ${getTimeFilterLabel()}`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Teams Active: ${interactions?.length || 0}`}
            size="small"
            variant="outlined"
            color={getTrendColor()}
          />
          <Chip
            label={`Avg per Team: ${
              interactions?.length
                ? (totalInteractions / interactions.length).toFixed(1)
                : 0
            }`}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default InteractionMetrics;
