import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Refresh, School, TrendingUp, Assignment } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const AdmissionsTab = ({ analytics, onStatusClick, leadService }) => {
  const [admissionsData, setAdmissionsData] = useState([]);
  const [programData, setProgramData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmissionsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all leads
      const leadsResponse = await leadService.getLeads();
      const leads = leadsResponse.data || [];

      // Group by program
      const programStats = leads.reduce((acc, lead) => {
        const program =
          typeof lead.program === "object" && lead.program?.name
            ? lead.program.name
            : lead.program || "Not Specified";
        if (!acc[program]) {
          acc[program] = {
            program,
            total: 0,
            new: 0,
            contacted: 0,
            interested: 0,
            applied: 0,
            enrolled: 0,
            notInterested: 0,
            onHold: 0,
          };
        }

        acc[program].total++;
        const statusKey =
          typeof lead.status === "object" && lead.status?.code
            ? lead.status.code
            : lead.status || "new";
        acc[program][statusKey] = (acc[program][statusKey] || 0) + 1;

        return acc;
      }, {});

      const programArray = Object.values(programStats);
      setProgramData(programArray);

      // Create admissions funnel data
      const funnelData = [
        {
          name: "Total Leads",
          value: analytics.totalLeads || 0,
          color: "#8884d8",
        },
        {
          name: "Contacted",
          value: analytics.contactedLeads || 0,
          color: "#82ca9d",
        },
        {
          name: "Interested",
          value: analytics.interestedLeads || 0,
          color: "#ffc658",
        },
        {
          name: "Applied",
          value: analytics.appliedLeads || 0,
          color: "#ff7300",
        },
        {
          name: "Enrolled",
          value: analytics.enrolledLeads || 0,
          color: "#00C49F",
        },
      ];

      setAdmissionsData(funnelData);
    } catch (error) {
      console.error("Error fetching admissions data:", error);
      setError("Failed to load admissions data");
    } finally {
      setLoading(false);
    }
  }, [leadService, analytics]);

  useEffect(() => {
    fetchAdmissionsData();
  }, [fetchAdmissionsData]);

  const getConversionRate = (program) => {
    if (program.total === 0) return "0.0";
    return ((program.enrolled / program.total) * 100).toFixed(1);
  };

  const getApplicationRate = (program) => {
    if (program.total === 0) return "0.0";
    return ((program.applied / program.total) * 100).toFixed(1);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <IconButton size="small" onClick={fetchAdmissionsData} sx={{ ml: 1 }}>
          <Refresh fontSize="small" />
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Admissions Funnel Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Admissions Funnel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={admissionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Lead Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={admissionsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {admissionsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Program Performance Table */}
      <Card sx={{ mt: 3 }}>
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
              Program Performance
            </Typography>
            <Tooltip title="Refresh admissions data">
              <IconButton onClick={fetchAdmissionsData}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {programData.length === 0 ? (
            <Alert severity="info">No program data available.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <School fontSize="small" />
                        Program
                      </Box>
                    </TableCell>
                    <TableCell align="right">Total Leads</TableCell>
                    <TableCell align="right">New</TableCell>
                    <TableCell align="right">Contacted</TableCell>
                    <TableCell align="right">Interested</TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Assignment fontSize="small" />
                        Applied
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <TrendingUp fontSize="small" />
                        Enrolled
                      </Box>
                    </TableCell>
                    <TableCell align="right">Application Rate</TableCell>
                    <TableCell align="right">Conversion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programData.map((program, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {program.program}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={program.total}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{program.new || 0}</TableCell>
                      <TableCell align="right">
                        {program.contacted || 0}
                      </TableCell>
                      <TableCell align="right">
                        {program.interested || 0}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={program.applied || 0}
                          size="small"
                          color="info"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={program.enrolled || 0}
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${getApplicationRate(program)}%`}
                          size="small"
                          color={
                            parseFloat(getApplicationRate(program)) >= 20
                              ? "success"
                              : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${getConversionRate(program)}%`}
                          size="small"
                          color={
                            parseFloat(getConversionRate(program)) >= 10
                              ? "success"
                              : "error"
                          }
                          variant="filled"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdmissionsTab;
