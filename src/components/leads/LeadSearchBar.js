import React from "react";
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

const LeadSearchBar = ({
  filters,
  sortBy,
  sortOrder,
  onFilterChange,
  onSortChange,
}) => {
  return (
    <Paper sx={{ p: 2, bgcolor: "background.paper", boxShadow: 1 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search leads by name, email, phone, or program..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
              "& fieldset": {
                borderColor: "divider",
              },
              "&:hover fieldset": {
                borderColor: "primary.main",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
            ),
            endAdornment: filters.search && (
              <IconButton
                onClick={() => onFilterChange("search", "")}
                size="small"
              >
                <ClearIcon />
              </IconButton>
            ),
          }}
        />

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => onSortChange(e.target.value, sortOrder)}
            sx={{
              bgcolor: "background.default",
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
            <MenuItem value="createdAt">Created Date</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="source">Source</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={sortOrder}
          exclusive
          onChange={(e, newOrder) => newOrder && onSortChange(sortBy, newOrder)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              borderColor: "divider",
              color: "text.secondary",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              },
              "&:hover": {
                bgcolor: "action.hover",
              },
            },
          }}
        >
          <ToggleButton value="desc" title="Descending">
            ↓
          </ToggleButton>
          <ToggleButton value="asc" title="Ascending">
            ↑
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
};

export default LeadSearchBar;
