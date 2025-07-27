import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
} from "@mui/material";
import { Info as InfoIcon } from "@mui/icons-material";
import {
  getRoleOptions,
  PERMISSIONS,
  hasPermission,
} from "../../config/roles.config";

const TeamMemberDialog = ({ open, onClose, onSave, member, loading }) => {
  const roleOptions = getRoleOptions();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "", // Changed from jobRole to role
    status: "active",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (member) {
      setFormData({
        ...member,
        role: member.role || member.jobRole || "", // Handle both old and new field names
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "",
        status: "active",
      });
    }
  }, [member]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Validate required fields
    if (!formData.name || !formData.email || !formData.role) {
      setFormError("Name, email, and role are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {member ? "Edit Team Member" : "Add Team Member"}
      </DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {formData.role && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Role Description
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    {
                      roleOptions.find((r) => r.value === formData.role)
                        ?.description
                    }
                  </Typography>
                </Box>
              </Box>
            )}

            {formData.role && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Permissions for this Role
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    The following permissions are automatically granted based on
                    the selected role:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {formData.role === "admin" && (
                      <Chip label="Full Access" color="primary" size="small" />
                    )}
                    {formData.role === "marketingManager" && (
                      <>
                        <Chip
                          label="Chat Config (New Contact → Applied)"
                          size="small"
                        />
                        <Chip
                          label="Data Center (New Contact → Applied)"
                          size="small"
                        />
                        <Chip label="Analytics" size="small" />
                        <Chip label="Settings (View Only)" size="small" />
                      </>
                    )}
                    {formData.role === "admissionsOfficer" && (
                      <>
                        <Chip
                          label="Chat Config (Applied → Enrolled)"
                          size="small"
                        />
                        <Chip
                          label="Data Center (Applied → Enrolled)"
                          size="small"
                        />
                        <Chip label="Analytics" size="small" />
                        <Chip label="Settings (View Only)" size="small" />
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
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
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Saving..." : member ? "Update" : "Add"} Team Member
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamMemberDialog;
