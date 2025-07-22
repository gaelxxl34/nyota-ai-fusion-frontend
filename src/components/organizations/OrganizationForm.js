import React, { useState } from "react";
import { Box, TextField, Button, Grid, MenuItem, Alert } from "@mui/material";
import { organizationService } from "../../services/organizationService";

const OrganizationForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    subscription: "standard",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await organizationService.registerOrganization(formData);
      if (result.success) {
        onSuccess(result.organization);
        setFormData({
          name: "",
          industry: "",
          email: "",
          phone: "",
          address: "",
          website: "",
          subscription: "standard",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Organization Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            name="address"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Subscription"
            name="subscription"
            value={formData.subscription}
            onChange={handleChange}
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="enterprise">Enterprise</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" fullWidth disabled={loading}>
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </Box>
    </Box>
  );
};

export default OrganizationForm;
