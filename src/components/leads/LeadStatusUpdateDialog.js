import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Typography,
} from "@mui/material";
import { leadService } from "../../services/leadService";

const LeadStatusUpdateDialog = ({ open, onClose, lead, onUpdate }) => {
  const [status, setStatus] = useState(lead?.status || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Status configuration with colors
  const statusConfig = {
    INQUIRY: { label: "Inquiry", color: "info" },
    QUALIFIED: { label: "Qualified", color: "primary" },
    IN_PROGRESS: { label: "In Progress", color: "warning" },
    APPLIED: { label: "Applied", color: "secondary" },
    ENROLLED: { label: "Enrolled", color: "success" },
    REJECTED: { label: "Rejected", color: "error" },
    WITHDRAWN: { label: "Withdrawn", color: "default" },
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (status === lead.status) {
        setError("Please select a different status");
        return;
      }

      const updatedLead = await leadService.updateLeadStatus(
        lead.id,
        status,
        notes || `Status changed from ${lead.status} to ${status}`,
        "admin_user",
        true // Force update for admin users
      );

      onUpdate(updatedLead.data);
      onClose();
    } catch (err) {
      console.error("Error updating lead status:", err);
      setError(err.message || "Failed to update lead status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update Lead Status
        {lead && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            {lead.name} - Current: {lead.status}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="New Status"
            >
              {Object.entries(statusConfig).map(([value, config]) => (
                <MenuItem
                  key={value}
                  value={value}
                  disabled={value === lead?.status}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={config.label}
                      color={config.color}
                      size="small"
                    />
                    {value === lead?.status && (
                      <Typography variant="caption" color="text.secondary">
                        (Current)
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            placeholder="Add notes about this status change..."
            disabled={loading}
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || status === lead?.status}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadStatusUpdateDialog;
