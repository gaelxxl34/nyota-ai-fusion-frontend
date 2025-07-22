import React from "react";
import { Grid, Card, CardContent, Typography, Box, Chip } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as ConvertedIcon,
  School as QualifiedIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";

const LeadStatsCards = ({ stats, totalCount, conversionRate }) => {
  const quickStats = [
    {
      title: "Total Leads",
      value: totalCount || 0,
      icon: <TrendingUpIcon />,
      color: "#2196f3",
      change: "+12%",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: <ConvertedIcon />,
      color: "#4caf50",
      change: "+5%",
    },
    {
      title: "Active Prospects",
      value:
        (stats.byStatus?.PRE_QUALIFIED || 0) + (stats.byStatus?.QUALIFIED || 0),
      icon: <QualifiedIcon />,
      color: "#ff9800",
      change: "+8%",
    },
    {
      title: "This Month",
      value: Math.floor(totalCount * 0.3) || 0,
      icon: <TimelineIcon />,
      color: "#9c27b0",
      change: "+15%",
    },
  ];

  return (
    <Grid container spacing={3}>
      {quickStats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
              color: "white",
              position: "relative",
              overflow: "hidden",
              boxShadow: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.25)",
                    mr: 2,
                    color: "white",
                  }}
                >
                  {React.cloneElement(stat.icon, { sx: { color: "white" } })}
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mb: 0.5,
                      color: "white",
                      textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.95)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {stat.title}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip
                  label={stat.change}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "white",
                    fontWeight: "bold",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
              </Box>

              {/* Decorative background icon */}
              <Box
                sx={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  opacity: 0.08,
                  transform: "rotate(-15deg)",
                  color: "white",
                }}
              >
                {React.cloneElement(stat.icon, {
                  sx: { fontSize: 120, color: "inherit" },
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default LeadStatsCards;
