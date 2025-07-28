import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import {
  School as SchoolIcon,
  Send as SendIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { applicationService } from "../../services/applicationService";
import { useAuth } from "../../contexts/AuthContext";

const ApplicationFormDialog = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    countryOfBirth: "",
    gender: "",
    email: "",
    phoneNumber: "",
    modeOfStudy: "",
    preferredIntake: "",
    preferredProgram: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Application form options
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const modeOfStudyOptions = [
    { value: "on_campus", label: "On Campus" },
    { value: "online", label: "Online" },
  ];

  const intakeOptions = [
    { value: "january", label: "January" },
    { value: "may", label: "May" },
    { value: "august", label: "August" },
  ];

  const programOptions = [
    {
      value: "bachelor_information_technology",
      label: "Bachelor of Information Technology (BIT)",
    },
    {
      value: "bachelor_business_administration",
      label: "Bachelor of Business Administration (BBA)",
    },
    { value: "bachelor_commerce", label: "Bachelor of Commerce (BCOM)" },
    {
      value: "master_information_technology",
      label: "Master of Information Technology (MIT)",
    },
    {
      value: "master_business_administration",
      label: "Master of Business Administration (MBA)",
    },
    {
      value: "diploma_information_technology",
      label: "Diploma in Information Technology",
    },
    {
      value: "diploma_business_administration",
      label: "Diploma in Business Administration",
    },
    { value: "certificate_programs", label: "Certificate Programs" },
  ];

  // Countries list (partial - can be expanded)
  const countryOptions = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Argentina",
    "Australia",
    "Austria",
    "Bangladesh",
    "Belgium",
    "Brazil",
    "Canada",
    "China",
    "Colombia",
    "Denmark",
    "Egypt",
    "Finland",
    "France",
    "Germany",
    "Ghana",
    "Greece",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Italy",
    "Japan",
    "Jordan",
    "Kenya",
    "Kuwait",
    "Lebanon",
    "Malaysia",
    "Mexico",
    "Morocco",
    "Netherlands",
    "Nigeria",
    "Norway",
    "Pakistan",
    "Philippines",
    "Poland",
    "Portugal",
    "Russia",
    "Saudi Arabia",
    "Singapore",
    "South Africa",
    "South Korea",
    "Spain",
    "Sri Lanka",
    "Sweden",
    "Switzerland",
    "Tanzania",
    "Thailand",
    "Turkey",
    "Uganda",
    "United Kingdom",
    "United States",
    "Vietnam",
    "Yemen",
    "Zimbabwe",
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    // Required fields validation
    const requiredFields = [
      { field: "name", label: "Name" },
      { field: "countryOfBirth", label: "Country of Birth" },
      { field: "gender", label: "Gender" },
      { field: "email", label: "Email Address" },
      { field: "phoneNumber", label: "Telephone Number" },
      { field: "modeOfStudy", label: "Mode of Study" },
      { field: "preferredIntake", label: "Preferred Intake" },
      { field: "preferredProgram", label: "Preferred Program" },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field]?.trim()) {
        setError(`${label} is required`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Phone number validation
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Submit application
      const result = await applicationService.submitApplication(formData, user);

      if (result.success) {
        setSuccess(
          `🎉 Application submitted successfully! Thank you ${
            formData.name
          } for applying to our ${
            programOptions.find((p) => p.value === formData.preferredProgram)
              ?.label
          } program.`
        );

        // Call success callback with application data
        if (onSuccess) {
          onSuccess({
            application: result.application,
            lead: result.lead,
            whatsappMessage: result.whatsappMessage,
          });
        }

        // Close dialog after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        throw new Error(result.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setError(
        error.message || "Failed to submit application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        countryOfBirth: "",
        gender: "",
        email: "",
        phoneNumber: "",
        modeOfStudy: "",
        preferredIntake: "",
        preferredProgram: "",
      });
      setError("");
      setSuccess("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SchoolIcon color="primary" />
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Application Form
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Complete your application to join our academic programs
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Personal Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Personal Information
            </Typography>
          </Grid>

          {/* Full Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange("name")}
              required
              variant="outlined"
              placeholder="Enter your full legal name"
            />
          </Grid>

          {/* Country of Birth */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Country of Birth</InputLabel>
              <Select
                value={formData.countryOfBirth}
                onChange={handleInputChange("countryOfBirth")}
                label="Country of Birth"
              >
                {countryOptions.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Gender */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={handleInputChange("gender")}
                label="Gender"
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Email Address */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              variant="outlined"
              placeholder="your.email@example.com"
            />
          </Grid>

          {/* Telephone Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telephone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange("phoneNumber")}
              required
              variant="outlined"
              placeholder="+256 700 123 456"
            />
          </Grid>

          {/* Academic Information Section */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              <SchoolIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Academic Information
            </Typography>
          </Grid>

          {/* Mode of Study */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Mode of Study</InputLabel>
              <Select
                value={formData.modeOfStudy}
                onChange={handleInputChange("modeOfStudy")}
                label="Mode of Study"
              >
                {modeOfStudyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Preferred Intake */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Preferred Intake</InputLabel>
              <Select
                value={formData.preferredIntake}
                onChange={handleInputChange("preferredIntake")}
                label="Preferred Intake"
              >
                {intakeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Preferred Program */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Preferred Program</InputLabel>
              <Select
                value={formData.preferredProgram}
                onChange={handleInputChange("preferredProgram")}
                label="Preferred Program"
              >
                {programOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Error/Success Messages */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Alert severity="success">{success}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ minWidth: 140 }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationFormDialog;
