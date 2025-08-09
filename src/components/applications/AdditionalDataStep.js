import React from "react";
import {
  Grid,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";

export const AdditionalDataStep = ({
  formData,
  updateFormData,
  errors = {},
}) => {
  const handleInputChange = (field) => (event) => {
    updateFormData({ [field]: event.target.value });
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Additional Data
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 600, mt: 2 }}
          >
            Sponsorship Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sponsor Telephone"
            value={formData.sponsorTelephone || ""}
            onChange={handleInputChange("sponsorTelephone")}
            helperText="Phone number of sponsor or parent/guardian"
            error={!!errors.sponsorTelephone}
          />
          {errors.sponsorTelephone && (
            <Typography variant="caption" color="error">
              {errors.sponsorTelephone}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sponsor Email"
            type="email"
            value={formData.sponsorEmail || ""}
            onChange={handleInputChange("sponsorEmail")}
            helperText="Email address of sponsor or parent/guardian"
            error={!!errors.sponsorEmail}
          />
          {errors.sponsorEmail && (
            <Typography variant="caption" color="error">
              {errors.sponsorEmail}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.howDidYouHear} required>
            <InputLabel>How did you hear about the university?</InputLabel>
            <Select
              value={formData.howDidYouHear || ""}
              onChange={handleInputChange("howDidYouHear")}
              label="How did you hear about the university?"
            >
              <MenuItem value="social-media">
                Social Media (Facebook, Instagram, Twitter)
              </MenuItem>
              <MenuItem value="website">University Website</MenuItem>
              <MenuItem value="friend-family">
                Friend or Family Recommendation
              </MenuItem>
              <MenuItem value="education-fair">Education Fair</MenuItem>
              <MenuItem value="newspaper-magazine">Newspaper/Magazine</MenuItem>
              <MenuItem value="radio-tv">Radio/Television</MenuItem>
              <MenuItem value="school-counselor">School Counselor</MenuItem>
              <MenuItem value="alumni">Alumni</MenuItem>
              <MenuItem value="search-engine">
                Search Engine (Google, Bing)
              </MenuItem>
              <MenuItem value="university-representative">
                University Representative Visit
              </MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {errors.howDidYouHear && (
              <FormHelperText>{errors.howDidYouHear}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={4}
            value={formData.additionalNotes || ""}
            onChange={handleInputChange("additionalNotes")}
            helperText="Any additional information you'd like to share (optional)"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
