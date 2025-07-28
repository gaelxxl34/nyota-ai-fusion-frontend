import React, { useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

// Import custom components
import { useLeadManagement } from "../../hooks/useLeadManagement";
import { useAuth } from "../../contexts/AuthContext";
import InquiryContactDialog from "../../components/InquiryContactDialog";
import LeadDetailsDialog from "../../components/lead/LeadDetailsDialog";

// Import lead-specific components
import LeadPageHeader from "../../components/leads/LeadPageHeader";
import LeadPageSkeleton from "../../components/leads/LeadPageSkeleton";
import LeadStatsCards from "../../components/leads/LeadStatsCards";
import LeadChartsSection from "../../components/leads/LeadChartsSection";
import LeadSearchBar from "../../components/leads/LeadSearchBar";
import LeadsTable from "../../components/leads/LeadsTable";
import LeadsCardView from "../../components/leads/LeadsCardView";
import LeadFilterDrawer from "../../components/leads/LeadFilterDrawer";
import LeadSpeedDial from "../../components/leads/LeadSpeedDial";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const LeadsOverview = () => {
  // Use our custom lead management hook
  const {
    leads,
    stats,
    loading,
    error,
    hasMore,
    refreshing,
    filters,
    sortBy,
    sortOrder,
    updateFilter,
    clearFilters,
    updateSort,
    refresh,
    loadMore,
    getStatusColor,
    formatDate,
    exportLeads,
    totalCount,
    conversionRate,
    setError,
  } = useLeadManagement({
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes
    pageSize: 25,
  });

  // UI states
  const [viewMode, setViewMode] = useState("table");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Get user (used for permission checks in dialogs)
  const { user } = useAuth();

  // Event handlers
  const handleViewLead = (leadId) => {
    setSelectedLeadId(leadId);
    setLeadDetailsOpen(true);
  };

  const handleLeadUpdate = (updatedLead) => {
    console.log("Lead updated:", updatedLead.id);
    refresh(); // Refresh to get latest data
  };

  const handleLeadDelete = (leadId) => {
    console.log("Lead deleted:", leadId);
    refresh();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleExportLeads = (format) => {
    exportLeads(format).catch((err) => console.error("Export failed:", err));
  };

  // Show loading skeleton while initial data is loading
  if (loading && leads.length === 0) {
    return <LeadPageSkeleton />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <LeadPageHeader
        refreshing={refreshing}
        viewMode={viewMode}
        error={error}
        onRefresh={refresh}
        onViewModeChange={setViewMode}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        onClearError={() => setError("")}
      />

      {/* Quick Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <LeadStatsCards
          stats={stats}
          totalCount={totalCount}
          conversionRate={conversionRate}
        />
      </Box>

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        <LeadChartsSection stats={stats} />
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <LeadSearchBar
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={updateFilter}
          onSortChange={updateSort}
        />
      </Box>

      {/* Leads Display */}
      {viewMode === "table" ? (
        <LeadsTable
          leads={leads}
          loading={loading}
          hasMore={hasMore}
          sortBy={sortBy}
          sortOrder={sortOrder}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
          onSort={updateSort}
          onViewLead={handleViewLead}
          onLoadMore={loadMore}
        />
      ) : (
        <LeadsCardView
          leads={leads}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
          onViewLead={handleViewLead}
        />
      )}

      {/* Speed Dial for Quick Actions */}
      <LeadSpeedDial
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
        onAddLead={() => setDialogOpen(true)}
        onExportLeads={handleExportLeads}
      />

      {/* Filter Drawer */}
      <LeadFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        stats={stats}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {/* Dialogs */}
      <InquiryContactDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          refresh();
        }}
      />

      <LeadDetailsDialog
        open={leadDetailsOpen}
        onClose={() => {
          setLeadDetailsOpen(false);
          setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
        onLeadUpdate={handleLeadUpdate}
        onLeadDelete={handleLeadDelete}
        user={user}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadsOverview;
