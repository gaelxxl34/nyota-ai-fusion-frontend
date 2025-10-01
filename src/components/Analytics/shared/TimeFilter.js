import React from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Chip,
} from "@mui/material";
import {
  Today,
  DateRange,
  CalendarMonth,
  AllInclusive,
} from "@mui/icons-material";

const TimeFilter = ({
  value,
  onChange,
  label = "Time Period",
  showLabel = true,
  size = "medium",
  variant = "standard",
}) => {
  const timeOptions = [
    {
      value: "all",
      label: "All Time",
      icon: <AllInclusive fontSize="small" />,
      description: "All available data",
    },
    {
      value: "daily",
      label: "Daily",
      icon: <Today fontSize="small" />,
      description: "Last 24 hours",
    },
    {
      value: "weekly",
      label: "Weekly",
      icon: <DateRange fontSize="small" />,
      description: "Last 7 days",
    },
    {
      value: "monthly",
      label: "Monthly",
      icon: <CalendarMonth fontSize="small" />,
      description: "Last 30 days",
    },
  ];

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const getActiveFilterInfo = () => {
    const active = timeOptions.find((option) => option.value === value);
    return active || timeOptions[0];
  };

  if (variant === "chips") {
    return (
      <Box sx={{ mb: 2 }}>
        {showLabel && (
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: "text.secondary" }}
          >
            {label}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {timeOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              onClick={() => onChange(option.value)}
              color={value === option.value ? "primary" : "default"}
              variant={value === option.value ? "filled" : "outlined"}
              size={size}
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor:
                    value === option.value ? "primary.dark" : "action.hover",
                },
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {showLabel && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <Chip
            label={getActiveFilterInfo().description}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>
      )}
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size={size}
        sx={{
          "& .MuiToggleButton-root": {
            border: "1px solid",
            borderColor: "divider",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
            "&:hover": {
              backgroundColor: "action.hover",
            },
          },
        }}
      >
        {timeOptions.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {option.icon}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {option.label}
              </Typography>
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimeFilter;
