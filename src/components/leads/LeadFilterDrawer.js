import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

const LeadFilterDrawer = ({
  open,
  onClose,
  filters,
  stats,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 3, bgcolor: "background.paper" }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          Advanced Filters
        </Typography>

        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => onFilterChange("status", e.target.value)}
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(stats.byStatus || {}).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace(/_/g, " ")} ({stats.byStatus[status]})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Source</InputLabel>
            <Select
              value={filters.source}
              label="Source"
              onChange={(e) => onFilterChange("source", e.target.value)}
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              <MenuItem value="">All Sources</MenuItem>
              {Object.keys(stats.bySource || {}).map((source) => (
                <MenuItem key={source} value={source}>
                  {source.replace(/_/g, " ")} ({stats.bySource[source]})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              label="Date Range"
              onChange={(e) => onFilterChange("dateRange", e.target.value)}
              sx={{
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            fullWidth
            onClick={onClearFilters}
            sx={{
              borderColor: "divider",
              color: "text.primary",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            Clear All Filters
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default LeadFilterDrawer;
