import React from "react";
import { Grid, Paper, Typography, Box, Divider } from "@mui/material";
import { Bar, Line, Doughnut } from "react-chartjs-2";

const LeadChartsSection = ({ stats }) => {
  // Chart data
  const statusChartData = {
    labels: Object.keys(stats.byStatus || {}),
    datasets: [
      {
        data: Object.values(stats.byStatus || {}),
        backgroundColor: [
          "#2196f3",
          "#00bcd4",
          "#ff9800",
          "#4caf50",
          "#9c27b0",
          "#f44336",
          "#607d8b",
          "#795548",
        ],
        borderWidth: 0,
      },
    ],
  };

  const sourceChartData = {
    labels: Object.keys(stats.bySource || {}),
    datasets: [
      {
        label: "Leads by Source",
        data: Object.values(stats.bySource || {}),
        backgroundColor: "rgba(33, 150, 243, 0.6)",
        borderColor: "rgba(33, 150, 243, 1)",
        borderWidth: 1,
      },
    ],
  };

  const trendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Lead Volume",
        data: [65, 59, 80, 81, 56, 85],
        borderColor: "rgb(33, 150, 243)",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        tension: 0.4,
      },
    ],
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Lead Trends
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Status Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                    },
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Top Sources
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <Bar
              data={sourceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default LeadChartsSection;
