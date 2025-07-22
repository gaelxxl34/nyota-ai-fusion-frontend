import React from "react";
import { Box, Typography, Grid } from "@mui/material";

const Analytics = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="body1">
            Analytics functionality coming soon...
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
