import React from "react";
import { Menu, MenuItem, ListItemIcon } from "@mui/material";
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
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem onClick={handleEdit}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        Edit Lead
      </MenuItem>
      <MenuItem onClick={handleConvert}>
        <ListItemIcon>
          <AssignmentIcon fontSize="small" />
        </ListItemIcon>
        Convert to Application
      </MenuItem>
      <MenuItem onClick={handleDelete}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        Delete Lead
      </MenuItem>
    </Menu>
  );
};

export default LeadActionMenu;
