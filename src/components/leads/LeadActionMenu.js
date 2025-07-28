import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const LeadActionMenu = ({
  anchorEl,
  open,
  selectedLead,
  onClose,
  onEdit,
  onConvert,
  onDelete,
}) => {
  const handleEdit = () => {
    onEdit(selectedLead);
    onClose();
  };

  const handleConvert = () => {
    onConvert(selectedLead);
    onClose();
  };

  const handleDelete = () => {
    onDelete(selectedLead);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: 200,
          "& .MuiMenuItem-root": {
            px: 2,
            py: 1,
          },
        },
      }}
    >
      <MenuItem onClick={handleEdit}>
        <ListItemIcon>
          <EditIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <Typography variant="body2">Edit Lead</Typography>
      </MenuItem>

      <MenuItem onClick={handleConvert}>
        <ListItemIcon>
          <AssignmentIcon fontSize="small" color="success" />
        </ListItemIcon>
        <Typography variant="body2">Convert to Application</Typography>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem
        onClick={handleDelete}
        sx={{
          "&:hover": {
            bgcolor: "error.light",
            "& .MuiTypography-root": {
              color: "error.contrastText",
            },
          },
        }}
      >
        <ListItemIcon>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <Typography variant="body2" color="error">
          Delete Lead
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default LeadActionMenu;
