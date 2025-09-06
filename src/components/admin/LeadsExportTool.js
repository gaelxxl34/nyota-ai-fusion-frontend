import React, { useState } from "react";
import {
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
} from "@mui/material";
import {
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { axiosInstance } from "../../services/axiosConfig";

const LEAD_STATUSES = {
  INTERESTED: "INTERESTED",
  APPLIED: "APPLIED",
  MISSING_DOCUMENT: "MISSING_DOCUMENT",
  IN_REVIEW: "IN_REVIEW",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
  EXPIRED: "EXPIRED",
};

const LeadsExportTool = () => {
  const [selectedStatus, setSelectedStatus] = useState("INTERESTED");
  const [includeAll, setIncludeAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const params = {
        format: "csv",
      };

      if (includeAll) {
        params.includeAll = "true";
      } else {
        params.status = selectedStatus;
      }

      console.log("🔄 Requesting export with params:", params);

      const response = await axiosInstance.get("/api/leads/export", {
        params,
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const today = new Date().toISOString().split("T")[0];
      const filename = includeAll
        ? `all-leads-${today}.csv`
        : `${selectedStatus.toLowerCase()}-leads-${today}.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setSuccess(`Successfully exported leads to ${filename}`);
    } catch (err) {
      console.error("❌ Export error:", err);
      setError(err.response?.data?.message || "Failed to export leads");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "INTERESTED":
        return "warning";
      case "APPLIED":
        return "info";
      case "MISSING_DOCUMENT":
        return "error";
      case "IN_REVIEW":
        return "primary";
      case "QUALIFIED":
        return "success";
      case "ADMITTED":
        return "secondary";
      case "ENROLLED":
        return "success";
      case "DEFERRED":
        return "warning";
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case "INTERESTED":
        return "People who have shown interest in our programs";
      case "APPLIED":
        return "People who have submitted applications";
      case "MISSING_DOCUMENT":
        return "Applicants missing required documents for review";
      case "IN_REVIEW":
        return "Applications currently under review";
      case "QUALIFIED":
        return "Applicants who meet admission requirements";
      case "ADMITTED":
        return "Students who have been officially admitted";
      case "ENROLLED":
        return "Students who have enrolled and are active";
      case "DEFERRED":
        return "Applications that have been deferred";
      case "EXPIRED":
        return "Applications that have expired";
      default:
        return "";
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <CloudDownloadIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h5" component="h2">
          Export Leads Database
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Download a comprehensive list of leads in CSV format for analysis,
        follow-up campaigns, or reporting purposes.
      </Typography>

      <Grid container spacing={3}>
        {/* Export Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Options
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Export Type</InputLabel>
                <Select
                  value={includeAll ? "all" : "status"}
                  onChange={(e) => setIncludeAll(e.target.value === "all")}
                  label="Export Type"
                >
                  <MenuItem value="status">By Status</MenuItem>
                  <MenuItem value="all">All Leads</MenuItem>
                </Select>
              </FormControl>

              {!includeAll && (
                <FormControl fullWidth>
                  <InputLabel>Lead Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Lead Status"
                  >
                    {Object.values(LEAD_STATUSES).map((status) => (
                      <MenuItem key={status} value={status}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={status}
                            size="small"
                            color={getStatusColor(status)}
                            variant="outlined"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>

            <CardActions>
              <Button
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={20} /> : <DownloadIcon />
                }
                onClick={handleExport}
                disabled={loading}
                fullWidth
                size="large"
              >
                {loading ? "Exporting..." : "Download CSV"}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Preview Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Preview
              </Typography>

              {includeAll ? (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <PeopleIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="body1" fontWeight="medium">
                      All Leads
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Export all leads regardless of status. This includes
                    everyone in your database from initial inquiries to enrolled
                    students.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Chip
                      label={selectedStatus}
                      color={getStatusColor(selectedStatus)}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body1" fontWeight="medium">
                      {selectedStatus} Leads
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getStatusDescription(selectedStatus)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                CSV Includes:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="body2">
                  Contact Information (Name, Email, Phone)
                </Typography>
                <Typography component="li" variant="body2">
                  Status & Source
                </Typography>
                <Typography component="li" variant="body2">
                  Program of Interest
                </Typography>
                <Typography component="li" variant="body2">
                  Timestamps & Interactions
                </Typography>
                <Typography component="li" variant="body2">
                  Assignment & Follow-up Info
                </Typography>
                <Typography component="li" variant="body2">
                  Notes & Tags
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {success}
        </Alert>
      )}

      {/* Usage Tips */}
      <Card sx={{ mt: 3, bgcolor: "grey.50" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💡 Usage Tips
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                <strong>Interested Leads:</strong> Perfect for marketing
                campaigns and initial outreach
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                <strong>Applied Leads:</strong> Great for admission follow-ups
                and application status updates
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                <strong>Qualified Leads:</strong> Use for final admission
                decisions and enrollment campaigns
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                <strong>All Leads:</strong> Comprehensive database for reporting
                and analytics
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Paper>
  );
};

export default LeadsExportTool;
