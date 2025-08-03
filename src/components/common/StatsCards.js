import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
} from "@mui/material";

/**
 * Reusable statistics cards component
 * Displays key metrics with loading states
 */
const StatsCards = ({ stats = [], loading = false }) => {
  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              {loading ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Skeleton
                      variant="circular"
                      width={40}
                      height={40}
                      sx={{ mr: 2 }}
                    />
                    <Skeleton variant="text" width="60%" height={24} />
                  </Box>
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="50%" height={16} />
                </>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        color: stat.color,
                        mr: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography variant="h6" color="textSecondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4" gutterBottom>
                    {stat.value}
                  </Typography>
                  {stat.subtitle && (
                    <Typography variant="body2" color="textSecondary">
                      {stat.subtitle}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
