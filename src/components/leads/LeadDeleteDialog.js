import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { leadService } from "../../services/leadService";

const LeadDeleteDialog = ({ open, onClose, lead, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");

      await leadService.deleteLead(lead.id);

      onDelete(lead.id);
      onClose();
    } catch (err) {
      console.error("Error deleting lead:", err);
      setError(err.message || "Failed to delete lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="error" />
          Delete Lead
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography gutterBottom>
          Are you sure you want to delete this lead?
        </Typography>

        {lead && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {lead.name || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {lead.email || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {lead.phone || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {lead.status || "N/A"}
            </Typography>
          </Box>
        )}

        <Alert severity="warning" sx={{ mt: 2 }}>
          This action cannot be undone. All data associated with this lead will
          be permanently deleted.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Deleting..." : "Delete Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadDeleteDialog;
