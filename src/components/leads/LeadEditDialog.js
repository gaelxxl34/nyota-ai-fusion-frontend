import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Typography,
  Chip,
} from "@mui/material";
import { leadService } from "../../services/leadService";
import { STATUS_CONFIG, SOURCE_CONFIG } from "../../config/lead.constants";

const LeadEditDialog = ({ open, onClose, lead, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    program: "",
    source: "",
    status: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (lead) {
      // Handle name field - split if it's a combined name
      let firstName = lead.firstName || "";
      let lastName = lead.lastName || "";

      if (!firstName && !lastName && lead.name) {
        const nameParts = lead.name.trim().split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }

      setFormData({
        firstName,
        lastName,
        email: lead.email || "",
        phone: lead.phone || lead.phoneNumber || "",
        program: lead.program || "",
        source: lead.source || "",
        status: lead.status || "",
        notes: "",
      });
    }
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // Prepare update data
      const updateData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        program: formData.program,
        source: formData.source,
      };

      // Handle status update separately if changed
      let updatedLead;
      if (formData.status !== lead.status) {
        // Update status with notes
        updatedLead = await leadService.updateLeadStatus(
          lead.id,
          formData.status,
          formData.notes ||
            `Status changed from ${lead.status} to ${formData.status}`,
          "admin_user"
        );
      } else {
        // Update lead information
        updatedLead = await leadService.updateLead(lead.id, updateData);
      }

      onUpdate(updatedLead.data);
      onClose();
    } catch (err) {
      console.error("Error updating lead:", err);
      setError(err.message || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Lead
        {lead && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            ID: {lead.id?.slice(-8)}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Program of Interest"
              name="program"
              value={formData.program}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Source</InputLabel>
              <Select
                name="source"
                value={formData.source}
                onChange={handleChange}
                label="Source"
              >
                {Object.entries(SOURCE_CONFIG).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    {config.icon} {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {formData.status !== lead?.status && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (for status change)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Add notes about this status change..."
                disabled={loading}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Updating..." : "Update Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadEditDialog;
