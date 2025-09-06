import React from "react";
import { Container, Typography, Box, Breadcrumbs, Link } from "@mui/material";
import {
  Home as HomeIcon,
  CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";
import LeadsExportTool from "../../components/admin/LeadsExportTool";

const LeadsExportPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/admin/dashboard"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          color="text.primary"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <CloudDownloadIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Export Leads
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Export Leads Database
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and download comprehensive CSV reports of your leads
          database. Perfect for marketing campaigns, follow-up activities, and
          data analysis.
        </Typography>
      </Box>

      {/* Export Tool */}
      <LeadsExportTool />
    </Container>
  );
};

export default LeadsExportPage;
