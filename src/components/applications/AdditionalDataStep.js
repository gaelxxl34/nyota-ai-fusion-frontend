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
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
        Additional Information
      </Typography>

      <Grid container spacing={3}>
        {/* Sponsorship Information Section */}
        <Grid item xs={12}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 600, mt: 2 }}
          >
            Sponsorship Information{" "}
            <Typography component="span" variant="body2" color="text.secondary">
              (Optional)
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide sponsor contact details if applicable. This could be
            a parent, guardian, employer, or scholarship provider.
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                fontSize: "0.75rem",
                color: errors.sponsorTelephone
                  ? "#d32f2f"
                  : "rgba(0, 0, 0, 0.6)",
              }}
            >
              Sponsor Telephone
            </Typography>
            <PhoneInput
              international
              defaultCountry="UG"
              value={formData.sponsorTelephone || ""}
              onChange={(value) => updateFormData({ sponsorTelephone: value })}
              placeholder="Enter sponsor phone number"
              style={{
                "--PhoneInputCountrySelectArrow-color": "#666",
                "--PhoneInputCountrySelectArrow-opacity": "0.8",
              }}
              className={`phone-input-custom ${
                errors.sponsorTelephone ? "error" : ""
              }`}
            />
            {errors.sponsorTelephone && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, display: "block" }}
              >
                {errors.sponsorTelephone}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              Phone number of sponsor or parent/guardian
            </Typography>
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
          <Box>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                fontSize: "0.75rem",
                color: errors.sponsorEmail ? "#d32f2f" : "rgba(0, 0, 0, 0.6)",
              }}
            >
              Sponsor Email
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={formData.sponsorEmail || ""}
              onChange={handleInputChange("sponsorEmail")}
              error={!!errors.sponsorEmail}
              placeholder="sponsor@example.com"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: errors.sponsorEmail ? "#d32f2f" : "#c4c4c4",
                  },
                },
              }}
            />
            {errors.sponsorEmail && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, display: "block" }}
              >
                {errors.sponsorEmail}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              Valid email address of sponsor or parent/guardian
            </Typography>
          </Box>
        </Grid>

        {/* How did you hear about the university */}
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.howDidYouHear} required>
            <InputLabel>How did you hear about the university?</InputLabel>
            <Select
              value={formData.howDidYouHear || ""}
              onChange={handleInputChange("howDidYouHear")}
              label="How did you hear about the university?"
            >
              <MenuItem value="">Select Option</MenuItem>
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

        {/* Additional Notes */}
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
