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
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

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
    statusFilter = "all",
    leadStatusFilter = "all",
    sortBy = "lastMessage",
    sortOrder = "desc",
  } = filters;

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const clearFilter = (filterType) => {
    handleFilterChange(filterType, "all");
  };

  const activeFilters = [
    { key: "status", value: statusFilter, label: `Status: ${statusFilter}` },
    {
      key: "leadStatus",
      value: leadStatusFilter,
      label: `Lead: ${leadStatusFilter}`,
    },
    { key: "time", value: timeFilter, label: `Time: ${timeFilter}` },
  ].filter((filter) => filter.value !== "all");

  return (
    <Box>
      {/* Main filter row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={2.4}>
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

        <Grid item xs={12} md={2.4}>
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

        <Grid item xs={12} md={2.4}>
          <FormControl fullWidth size="small">
            <Select
              value={statusFilter}
              onChange={(e) =>
                handleFilterChange("statusFilter", e.target.value)
              }
              displayEmpty
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2.4}>
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
              <MenuItem value="new">New Leads</MenuItem>
              <MenuItem value="qualified">Qualified</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="converted">Converted</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2.4}>
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
        <Grid item xs={12} md={2.4}>
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

        <Grid item xs={12} md={9.6}>
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
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                onDelete={() => clearFilter(filter.key)}
                size="small"
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConversationFilters;
