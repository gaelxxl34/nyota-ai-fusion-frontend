import React from "react";
import { Box, Card, CardContent, Skeleton, Grid } from "@mui/material";

/**
 * Skeleton loader for KPI cards
 */
export const KPICardSkeleton = () => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={40} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
    </CardContent>
  </Card>
);

/**
 * Skeleton loader for pipeline sections
 */
export const PipelineSkeleton = () => (
  <Card elevation={2} sx={{ p: 3, minHeight: 300 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
    {[...Array(5)].map((_, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Skeleton variant="circular" width={32} height={32} />
          <Box flex={1}>
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={20} />
        </Box>
      </Box>
    ))}
  </Card>
);

/**
 * Skeleton loader for program analytics
 */
export const ProgramAnalyticsSkeleton = () => (
  <Card elevation={2} sx={{ p: 3, minHeight: 400 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />

    {/* Program list skeletons */}
    {[...Array(6)].map((_, index) => (
      <Box
        key={index}
        sx={{ mb: 3, p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={16} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Skeleton variant="rectangular" width="100%" height={8} />
            <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
          </Grid>
        </Grid>
      </Box>
    ))}
  </Card>
);

/**
 * Skeleton loader for charts
 */
export const ChartSkeleton = ({ height = 300 }) => (
  <Card elevation={2} sx={{ p: 3, minHeight: height }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height - 100} />
  </Card>
);

/**
 * Complete dashboard skeleton loader
 */
export const DashboardSkeleton = () => (
  <Box>
    {/* Header skeleton */}
    <Box mb={4}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={24} />
    </Box>

    {/* KPI Cards skeleton */}
    <Grid container spacing={3} mb={4}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <KPICardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Main content skeleton */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <PipelineSkeleton />
      </Grid>
      <Grid item xs={12} md={4}>
        <ChartSkeleton height={300} />
      </Grid>
    </Grid>

    {/* Program analytics skeleton */}
    <Box mt={3}>
      <ProgramAnalyticsSkeleton />
    </Box>
  </Box>
);

export default DashboardSkeleton;
