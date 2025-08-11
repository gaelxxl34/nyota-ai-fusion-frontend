import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

/**
 * KPI Card Component for dashboard metrics
 */
const KPICard = ({
  title,
  value,
  icon,
  color = "primary",
  trend = null,
  subtitle = null,
  progress = null,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    const trendValue = parseFloat(trend);
    if (trendValue > 0) {
      return <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />;
    } else if (trendValue < 0) {
      return <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (!trend) return "textSecondary";
    const trendValue = parseFloat(trend);
    return trendValue > 0
      ? "success.main"
      : trendValue < 0
      ? "error.main"
      : "textSecondary";
  };

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography color="textSecondary" variant="body2" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: "50%",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, {
              sx: { color: `${color}.main`, fontSize: 24 },
            })}
          </Box>
        </Box>

        <Typography
          variant="h4"
          component="div"
          color={color}
          fontWeight="bold"
          mb={1}
        >
          {typeof value === "number" && value >= 1000
            ? `${(value / 1000).toFixed(1)}k`
            : value}
        </Typography>

        {subtitle && (
          <Typography variant="body2" color="textSecondary" mb={1}>
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            {getTrendIcon()}
            <Typography
              variant="body2"
              color={getTrendColor()}
              fontWeight={500}
            >
              {Math.abs(parseFloat(trend))}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              vs last period
            </Typography>
          </Box>
        )}

        {progress !== null && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="textSecondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * KPI Overview Component - displays all key metrics
 */
const KPIOverview = ({ kpis, loading = false }) => {
  if (loading) {
    return null; // Skeleton will be handled by parent
  }

  const kpiCards = [
    {
      title: "Total Applications",
      value: kpis?.totalApplications || 0,
      icon: <SchoolIcon />,
      color: "primary",
      trend: kpis?.trends?.applications,
      subtitle: `${kpis?.periodCounts?.applied || 0} this period`,
    },
    {
      title: "Pending Review",
      value: kpis?.pendingReview || 0,
      icon: <AssessmentIcon />,
      color: "warning",
      subtitle: "Awaiting evaluation",
    },
    {
      title: "Qualified Students",
      value: kpis?.qualified || 0,
      icon: <CheckCircleIcon />,
      color: "success",
      trend: kpis?.trends?.qualified,
      subtitle: "Meeting requirements",
    },
    {
      title: "Conversion Rate",
      value: `${kpis?.conversionRate || 0}%`,
      icon: <PeopleIcon />,
      color: "info",
      progress: kpis?.conversionRate || 0,
      subtitle: "Application to enrollment",
    },
  ];

  return kpiCards.map((card, index) => (
    <Grid item xs={12} sm={6} md={3} key={index}>
      <KPICard {...card} />
    </Grid>
  ));
};

/**
 * Status Distribution Component
 */
export const StatusDistribution = ({ statusDistribution }) => {
  const statuses = [
    { key: "applied", label: "Applied", color: "primary" },
    { key: "inReview", label: "In Review", color: "info" },
    { key: "qualified", label: "Qualified", color: "success" },
    { key: "admitted", label: "Admitted", color: "secondary" },
    { key: "enrolled", label: "Enrolled", color: "success" },
    { key: "deferred", label: "Deferred", color: "warning" },
    { key: "expired", label: "Expired", color: "error" },
  ];

  const total = Object.values(statusDistribution || {}).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Status Distribution
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {statuses.map(({ key, label, color }) => {
          const count = statusDistribution?.[key] || 0;
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

          return (
            <Chip
              key={key}
              label={`${label}: ${count} (${percentage}%)`}
              color={color}
              variant="outlined"
              size="small"
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default KPIOverview;
