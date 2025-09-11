import React from "react";
import {
  Box,
  Typography,
  Popover,
  List,
  ListItemButton,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Divider,
} from "@mui/material";

// Add custom CSS styles
const customStyles = `
  .form-filter-popover * {
    color: #333333 !important;
  }
  .form-filter-popover .MuiTypography-root {
    color: #333333 !important;
  }
  .form-filter-popover .MuiListItemText-primary {
    color: #333333 !important;
  }
  .form-filter-popover .MuiListItemText-secondary {
    color: #666666 !important;
  }
  .form-filter-popover .select-all-button {
    color: #1976d2 !important;
  }
  .form-filter-popover .apply-button {
    background-color: #1976d2 !important;
    color: #ffffff !important;
  }
`;

const FormFilterPopover = ({
  open,
  anchorEl,
  onClose,
  availableFormNames,
  selectedFormNames,
  onFormNameToggle,
  onSelectAllForms,
}) => {
  const handleSelectAllForms = () => {
    const newSelectedForms =
      selectedFormNames.length === availableFormNames.length
        ? []
        : [...availableFormNames];
    onSelectAllForms(newSelectedForms);
  };

  return (
    <>
      <style>{customStyles}</style>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          className: "form-filter-popover",
          sx: {
            backgroundColor: "#ffffff !important",
            color: "#333333 !important",
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Box sx={{ p: 3, minWidth: 350, maxHeight: 400, overflow: "auto" }}>
          <Typography
            variant="h6"
            gutterBottom
            style={{ color: "#333333 !important", fontWeight: "bold" }}
          >
            Filter by Form Name
          </Typography>

          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" style={{ color: "#666666 !important" }}>
              {availableFormNames.length} forms available
            </Typography>
            <Button
              size="small"
              onClick={handleSelectAllForms}
              variant="text"
              className="select-all-button"
              sx={{ color: "#1976d2 !important" }}
            >
              {selectedFormNames.length === availableFormNames.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </Box>

          <List dense sx={{ maxHeight: 250, overflow: "auto" }}>
            {availableFormNames.map((formName) => (
              <ListItemButton
                key={formName}
                onClick={() => onFormNameToggle(formName)}
                sx={{
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                <Checkbox
                  checked={selectedFormNames.includes(formName)}
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    color: "#666666",
                    "&.Mui-checked": {
                      color: "#1976d2",
                    },
                  }}
                />
                <ListItemText
                  primary={formName}
                  primaryTypographyProps={{
                    variant: "body2",
                    style: {
                      color: "#333333 !important",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </ListItemButton>
            ))}
            {availableFormNames.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No forms available"
                  secondary="Load some leads first to see available forms"
                  primaryTypographyProps={{
                    style: { color: "#333333 !important" },
                  }}
                  secondaryTypographyProps={{
                    style: { color: "#666666 !important" },
                  }}
                />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" style={{ color: "#666666 !important" }}>
              {selectedFormNames.length} forms selected
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={onClose} style={{ color: "#666666 !important" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onClose}
                className="apply-button"
                style={{
                  backgroundColor: "#1976d2 !important",
                  color: "#ffffff !important",
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default FormFilterPopover;
