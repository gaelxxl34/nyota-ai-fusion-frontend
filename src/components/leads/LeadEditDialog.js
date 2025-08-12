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
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { leadService } from "../../services/leadService";
import { SOURCE_CONFIG } from "../../config/lead.constants";

const LeadEditDialog = ({ open, onClose, lead, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    program: "",
    source: "",
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

      // Update lead information
      const updatedLead = await leadService.updateLead(lead.id, updateData);

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
            <Box>
              <PhoneInput
                international
                defaultCountry="UG"
                value={formData.phone || ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, phone: value }))
                }
                placeholder="Enter phone number"
                disabled={loading}
                style={{
                  "--PhoneInputCountrySelectArrow-color": "#666",
                  "--PhoneInputCountrySelectArrow-opacity": "0.8",
                }}
                className="phone-input-custom"
              />
              <style jsx>{`
                .phone-input-custom {
                  width: 100%;
                  border: 1px solid #c4c4c4;
                  border-radius: 4px;
                  padding: 16.5px 14px;
                  font-size: 16px;
                  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
                  background-color: #fff;
                  transition: border-color 0.15s ease-in-out;
                }
                .phone-input-custom:hover {
                  border-color: #000;
                }
                .phone-input-custom:focus-within {
                  border-color: #1976d2;
                  border-width: 2px;
                  outline: none;
                }
                .phone-input-custom .PhoneInputInput {
                  border: none;
                  outline: none;
                  font-size: 16px;
                  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
                  background: transparent;
                  flex: 1;
                  margin-left: 8px;
                }
                .phone-input-custom .PhoneInputCountrySelect {
                  border: none;
                  background: transparent;
                  margin-right: 8px;
                }
                .phone-input-custom .PhoneInputCountrySelectArrow {
                  border-top-color: var(--PhoneInputCountrySelectArrow-color);
                  opacity: var(--PhoneInputCountrySelectArrow-opacity);
                }
                .phone-input-custom .PhoneInputCountryIcon {
                  width: 24px;
                  height: 18px;
                }
              `}</style>
            </Box>
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
