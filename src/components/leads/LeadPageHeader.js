import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";

const LeadPageHeader = ({
  refreshing,
  viewMode,
  error,
  onRefresh,
  onViewModeChange,
  onOpenFilters,
  onClearError,
}) => {
  return (
    <>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Leads Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive view of all leads with real-time analytics and
            management tools
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={onRefresh}
              disabled={refreshing}
              color="primary"
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && onViewModeChange(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="cards">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            startIcon={<FilterIcon />}
            onClick={onOpenFilters}
            variant="outlined"
          >
            Filters
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={onClearError}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default LeadPageHeader;
