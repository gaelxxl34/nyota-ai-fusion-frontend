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

// List of nationalities
const nationalities = [
  "Afghan",
  "Albanian",
  "Algerian",
  "Andorran",
  "Angolan",
  "Antiguan",
  "Argentine",
  "Armenian",
  "Aruban",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahamian",
  "Bahraini",
  "Bangladeshi",
  "Barbadian",
  "Belarusian",
  "Belgian",
  "Belizean",
  "Beninese",
  "Bhutanese",
  "Bolivian",
  "Bosnian",
  "Botswanan",
  "Brazilian",
  "British",
  "Bruneian",
  "Bulgarian",
  "Burkinabé",
  "Burundian",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Cape Verdean",
  "Central African",
  "Chadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Comorian",
  "Congolese",
  "Costa Rican",
  "Croatian",
  "Cuban",
  "Cypriot",
  "Czech",
  "Danish",
  "Djiboutian",
  "Dominican",
  "East Timorese",
  "Ecuadorean",
  "Egyptian",
  "El Salvadoran",
  "Equatorial Guinean",
  "Eritrean",
  "Estonian",
  "Ethiopian",
  "Fijian",
  "Finnish",
  "French",
  "Gabonese",
  "Gambian",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Grenadian",
  "Guatemalan",
  "Guinean",
  "Guinea-Bissauan",
  "Guyanese",
  "Haitian",
  "Honduran",
  "Hungarian",
  "Icelander",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Ivorian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakhstani",
  "Kenyan",
  "Kittitian",
  "Kosovar",
  "Kuwaiti",
  "Kyrgyzstani",
  "Laotian",
  "Latvian",
  "Lebanese",
  "Liberian",
  "Libyan",
  "Liechtensteiner",
  "Lithuanian",
  "Luxembourger",
  "Macedonian",
  "Malagasy",
  "Malawian",
  "Malaysian",
  "Maldivian",
  "Malian",
  "Maltese",
  "Marshallese",
  "Mauritanian",
  "Mauritian",
  "Mexican",
  "Micronesian",
  "Moldovan",
  "Monégasque",
  "Mongolian",
  "Montenegrin",
  "Moroccan",
  "Mozambican",
  "Namibian",
  "Nauruan",
  "Nepalese",
  "Dutch",
  "New Zealander",
  "Nicaraguan",
  "Nigerian",
  "North Korean",
  "Norwegian",
  "Omani",
  "Pakistani",
  "Palauan",
  "Panamanian",
  "Papua New Guinean",
  "Paraguayan",
  "Peruvian",
  "Filipino",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Rwandan",
  "Saint Lucian",
  "Salvadorean",
  "Samoan",
  "San Marinese",
  "Sao Tomean",
  "Saudi Arabian",
  "Scottish",
  "Senegalese",
  "Serbian",
  "Seychellois",
  "Sierra Leonean",
  "Singaporean",
  "Slovak",
  "Slovenian",
  "Solomon Islander",
  "Somali",
  "South African",
  "South Korean",
  "South Sudanese",
  "Spanish",
  "Sri Lankan",
  "Sudanese",
  "Surinamese",
  "Swazi",
  "Swedish",
  "Swiss",
  "Syrian",
  "Taiwanese",
  "Tajikistani",
  "Tanzanian",
  "Thai",
  "Togolese",
  "Tongan",
  "Trinidadian",
  "Tunisian",
  "Turkish",
  "Turkmen",
  "Tuvaluan",
  "Ugandan",
  "Ukrainian",
  "Emirati",
  "British Virgin Islander",
  "Uruguayan",
  "Uzbekistani",
  "Vanuatuan",
  "Venezuelan",
  "Vietnamese",
  "Yemeni",
  "Zambian",
  "Zimbabwean",
];

// List of countries
const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zimbabwe",
];

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
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone || ""}
            onChange={handleInputChange("phone")}
            error={!!errors.phone}
            helperText={
              errors.phone || "Format: +256XXXXXXXXX (include country code)"
            }
            placeholder="+256XXXXXXXXX"
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.countryOfBirth} required>
            <InputLabel>Country of Birth</InputLabel>
            <Select
              value={formData.countryOfBirth || ""}
              onChange={handleInputChange("countryOfBirth")}
              label="Country of Birth"
            >
              {countries.map((country) => (
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
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="prefer_not_to_say">Prefer Not to Say</MenuItem>
            </Select>
            {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Postal Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Postal Address"
            multiline
            rows={3}
            value={formData.postalAddress || ""}
            onChange={handleInputChange("postalAddress")}
            error={!!errors.postalAddress}
            helperText={
              errors.postalAddress ||
              "Enter your postal address (P.O. Box, street, city, postal code)"
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
