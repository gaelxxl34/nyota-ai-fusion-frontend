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
} from "@mui/material";

const availablePages = [
  { id: "dashboard", name: "Dashboard", category: "General" },
  { id: "leads", name: "Leads Overview", category: "Leads" },
  { id: "chat-config", name: "Chat Configuration", category: "Chat" },
  { id: "analytics", name: "Analytics", category: "Reports" },
];

const jobRoles = [
  {
    value: "leadManager",
    label: "Lead Manager",
    defaultPermissions: ["leads"],
  },
  {
    value: "customerSupport",
    label: "Customer Support",
    defaultPermissions: ["chat-config"],
  },
  {
    value: "salesManager",
    label: "Sales Manager",
    defaultPermissions: ["leads", "analytics"],
  },
  {
    value: "marketingManager",
    label: "Marketing Manager",
    defaultPermissions: ["analytics", "leads"],
  },
];

const TeamMemberDialog = ({ open, onClose, onSave, member, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    jobRole: "",
    permissions: [],
    status: "active",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData({
        name: "",
        email: "",
        jobRole: "",
        permissions: [],
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

  const handleJobRoleChange = (e) => {
    const selectedRole = jobRoles.find((role) => role.value === e.target.value);
    setFormData({
      ...formData,
      jobRole: e.target.value,
      permissions: selectedRole ? selectedRole.defaultPermissions : [],
    });
  };

  const handlePermissionToggle = (pageId) => {
    const newPermissions = formData.permissions.includes(pageId)
      ? formData.permissions.filter((p) => p !== pageId)
      : [...formData.permissions, pageId];

    setFormData({
      ...formData,
      permissions: newPermissions,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Validate required fields
    if (!formData.name || !formData.email || !formData.jobRole) {
      setFormError("Name, email, and job role are required");
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
              <InputLabel>Job Role</InputLabel>
              <Select
                name="jobRole"
                value={formData.jobRole}
                onChange={handleJobRoleChange}
                label="Job Role"
              >
                {jobRoles.map((role) => (
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Role Description
              </Typography>
              <Typography variant="body2">
                {
                  jobRoles.find((role) => role.value === formData.jobRole)
                    ?.label
                }
                {" - "}
                {getRoleDescription(formData.jobRole)}
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom>
              Access Permissions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {Object.entries(
                availablePages.reduce((acc, page) => {
                  if (!acc[page.category]) acc[page.category] = [];
                  acc[page.category].push(page);
                  return acc;
                }, {})
              ).map(([category, pages]) => (
                <Box key={category}>
                  <Typography variant="subtitle1" color="primary">
                    {category}
                  </Typography>
                  <Grid container>
                    {pages.map((page) => (
                      <Grid item xs={12} sm={6} md={4} key={page.id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.permissions.includes(page.id)}
                              onChange={() => handlePermissionToggle(page.id)}
                            />
                          }
                          label={page.name}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
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

const getRoleDescription = (roleValue) => {
  switch (roleValue) {
    case "leadManager":
      return "Handles lead qualification, distribution, and follow-up processes";
    case "customerSupport":
      return "Manages customer inquiries and handles chat support";
    case "salesManager":
      return "Oversees lead conversion, sales processes, and team performance";
    case "marketingManager":
      return "Manages marketing campaigns, analytics, and strategy";
    default:
      return "Please select a job role";
  }
};

export default TeamMemberDialog;
