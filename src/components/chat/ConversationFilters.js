import React from "react";
import {
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Box,
  Chip,
  Button,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

/**
 * Reusable filter component for conversations
 * Handles all filtering options with clean separation of concerns
 */
const ConversationFilters = ({
  filters,
  onFilterChange,
  resultCount = 0,
  totalCount = 0,
}) => {
  const {
    searchQuery = "",
    timeFilter = "all",
    leadStatusFilter = "all",
    sortBy = "lastMessage",
    sortOrder = "desc",
  } = filters;

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const clearFilter = (filterType) => {
    const resetValue = filterType === "searchQuery" ? "" : "all";
    handleFilterChange(filterType, resetValue);
  };

  const clearAllFilters = () => {
    handleFilterChange("searchQuery", "");
    handleFilterChange("timeFilter", "all");
    handleFilterChange("leadStatusFilter", "all");
  };

  const activeFilters = [
    {
      key: "leadStatus",
      value: leadStatusFilter,
      label: `Lead: ${leadStatusFilter.replace("_", " ")}`,
      display: leadStatusFilter !== "all",
    },
    {
      key: "time",
      value: timeFilter,
      label: `Time: ${timeFilter}`,
      display: timeFilter !== "all",
    },
    {
      key: "search",
      value: searchQuery,
      label: `Search: "${searchQuery}"`,
      display: searchQuery.trim() !== "",
    },
  ].filter((filter) => filter.display);

  return (
    <Box>
      {/* Main filter row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats, leads, messages..."
            value={searchQuery}
            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <Select
              value={timeFilter}
              onChange={(e) => handleFilterChange("timeFilter", e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <Select
              value={leadStatusFilter}
              onChange={(e) =>
                handleFilterChange("leadStatusFilter", e.target.value)
              }
              displayEmpty
            >
              <MenuItem value="all">All Leads</MenuItem>
              <MenuItem value="no_lead">No Lead</MenuItem>
              <MenuItem value="INTERESTED">Interested</MenuItem>
              <MenuItem value="APPLIED">Applied</MenuItem>
              <MenuItem value="MISSING_DOCUMENT">Missing Document</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="QUALIFIED">Qualified</MenuItem>
              <MenuItem value="ADMITTED">Admitted</MenuItem>
              <MenuItem value="ENROLLED">Enrolled</MenuItem>
              <MenuItem value="DEFERRED">Deferred</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <Select
              value={sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              displayEmpty
            >
              <MenuItem value="lastMessage">Last Message</MenuItem>
              <MenuItem value="contactName">Contact Name</MenuItem>
              <MenuItem value="leadName">Lead Name</MenuItem>
              <MenuItem value="messageCount">Message Count</MenuItem>
              <MenuItem value="createdAt">Created Date</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Second row with sort order and active filters */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <Select
              value={sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              displayEmpty
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={9}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Chip
              label={`${resultCount} conversations`}
              color="primary"
              variant="outlined"
              size="small"
            />

            {/* Clear All Filters Button */}
            {activeFilters.length > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearAllFilters}
                sx={{ minWidth: "auto" }}
              >
                Clear All
              </Button>
            )}

            {/* Active Filter Chips */}
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                onDelete={() => clearFilter(filter.key)}
                size="small"
                color="secondary"
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConversationFilters;
