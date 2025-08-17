import React from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { COUNTRIES } from "../common/CountrySelect";

export const PersonalDetailsStep = ({
  formData,
  updateFormData,
  errors = {},
}) => {
  const handleInputChange = (field) => (event) => {
    updateFormData({ [field]: event.target.value });
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files[0];
    if (file) {
      updateFormData({ [field]: file });
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Personal Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName || ""}
            onChange={handleInputChange("firstName")}
            error={!!errors.firstName}
            helperText={errors.firstName}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName || ""}
            onChange={handleInputChange("lastName")}
            error={!!errors.lastName}
            helperText={errors.lastName}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email || ""}
            onChange={handleInputChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box>
            <PhoneInput
              international
              defaultCountry="UG"
              value={formData.phone || ""}
              onChange={(value) => updateFormData({ phone: value })}
              placeholder="Enter phone number"
              style={{
                "--PhoneInputCountrySelectArrow-color": "#666",
                "--PhoneInputCountrySelectArrow-opacity": "0.8",
              }}
              className={`phone-input-custom ${errors.phone ? "error" : ""}`}
            />
            {errors.phone && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, display: "block" }}
              >
                {errors.phone}
              </Typography>
            )}
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
              .phone-input-custom.error {
                border-color: #d32f2f;
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

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.countryOfBirth} required>
            <InputLabel>Country of Birth</InputLabel>
            <Select
              value={formData.countryOfBirth || ""}
              onChange={handleInputChange("countryOfBirth")}
              label="Country of Birth"
            >
              {COUNTRIES.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
            {errors.countryOfBirth && (
              <FormHelperText>{errors.countryOfBirth}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.gender} required>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender || ""}
              onChange={handleInputChange("gender")}
              label="Gender"
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
            {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Physical Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Physical Address"
            multiline
            rows={3}
            value={formData.postalAddress || ""}
            onChange={handleInputChange("postalAddress")}
            error={!!errors.postalAddress}
            helperText={
              errors.postalAddress ||
              "Enter your physical address (P.O. Box, street, city, postal code)"
            }
            required
          />
        </Grid>

        {/* Passport Photo Upload Section */}
        <Grid item xs={12}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 600, mt: 2 }}
          >
            Passport Photo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a recent passport-style photograph. The photo should be
            clear, with good lighting, showing your full face against a plain
            background. Accepted formats: JPG, JPEG, PNG.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            fullWidth
            sx={{ mb: 1 }}
          >
            Upload Passport Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange("passportPhoto")}
            />
          </Button>
          {formData.passportPhoto && (
            <Typography variant="body2" color="text.secondary">
              {formData.passportPhoto.name}
            </Typography>
          )}
          {errors.passportPhoto && (
            <Typography variant="caption" color="error">
              {errors.passportPhoto}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
