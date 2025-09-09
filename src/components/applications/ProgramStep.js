import React from "react";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { Upload } from "@mui/icons-material";

// Program data structure - simplified without school hierarchy
const PROGRAM_DATA = {
  "On Campus": {
    January: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Journalism and Communication Studies",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Bachelor of Science in Climate Smart Agriculture",
      "Bachelor of Science in Environmental Science and Management",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Architecture",
      "Bachelor of Science in Petroleum Engineering",
      "Bachelor of Science in Mechatronics and Robotics",
      "Bachelor of Science in Communications Engineering",
      "Bachelor of Science in Mining Engineering",
      "Bachelor of Laws",
      "Bachelor of International Relations and Diplomatic Studies",
      "Diploma in Electrical Engineering",
      "Diploma in Civil Engineering",
      "Diploma in Architecture",
      "Master of Business Administration",
      "Master of Information Technology",
      "Master of International Relations and Diplomatic Studies",
    ],
    May: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Journalism and Communication Studies",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Bachelor of Science in Climate Smart Agriculture",
      "Bachelor of Science in Environmental Science and Management",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Architecture",
      "Bachelor of Science in Petroleum Engineering",
      "Bachelor of Science in Mechatronics and Robotics",
      "Bachelor of Science in Communications Engineering",
      "Bachelor of Science in Mining Engineering",
      "Bachelor of Laws",
      "Bachelor of International Relations and Diplomatic Studies",
      "Diploma in Electrical Engineering",
      "Diploma in Civil Engineering",
      "Diploma in Architecture",
      "Master of Business Administration",
      "Master of Information Technology",
      "Master of International Relations and Diplomatic Studies",
    ],
    August: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Journalism and Communication Studies",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Bachelor of Science in Climate Smart Agriculture",
      "Bachelor of Science in Environmental Science and Management",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Architecture",
      "Bachelor of Science in Petroleum Engineering",
      "Bachelor of Science in Mechatronics and Robotics",
      "Bachelor of Science in Communications Engineering",
      "Bachelor of Science in Mining Engineering",
      "Bachelor of Laws",
      "Bachelor of International Relations and Diplomatic Studies",
      "Diploma in Electrical Engineering",
      "Diploma in Civil Engineering",
      "Diploma in Architecture",
      "Master of Business Administration",
      "Master of Information Technology",
      "Master of International Relations and Diplomatic Studies",
    ],
  },
  Online: {
    January: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Master of Business Administration",
      "Master of Information Technology",
    ],
    May: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Master of Business Administration",
      "Master of Information Technology",
    ],
    August: [
      "Bachelor of Business Administration",
      "Bachelor of Public Administration",
      "Bachelor of Procurement and Logistics Management",
      "Bachelor of Tourism and Hotel Management",
      "Bachelor of Human Resource Management",
      "Bachelor of Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Software Engineering",
      "Master of Business Administration",
      "Master of Information Technology",
    ],
  },
};

export const ProgramStep = ({ formData, updateFormData, errors = {} }) => {
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;

    // Clear dependent fields when parent selections change
    if (field === "modeOfStudy") {
      updateFormData({
        [field]: value,
        intake: "",
        program: "",
      });
    } else if (field === "intake") {
      updateFormData({
        [field]: value,
        program: "",
      });
    } else {
      updateFormData({ [field]: value });
    }
  };

  const handleFileChange = (field) => async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Convert FileList to Array for multiple files
      const fileArray = Array.from(files);
      console.log(`Selected ${fileArray.length} files for ${field}`);
      updateFormData({ [field]: fileArray });
    }
  };

  // Get available programs based on mode of study and intake
  const getAvailablePrograms = () => {
    if (!formData.modeOfStudy || !formData.intake) return [];
    return PROGRAM_DATA[formData.modeOfStudy]?.[formData.intake] || [];
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Program Selection
      </Typography>

      <Grid container spacing={3}>
        {/* Mode of Study and Intake on same line */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.modeOfStudy} required>
            <InputLabel>Mode of Study</InputLabel>
            <Select
              value={formData.modeOfStudy || ""}
              onChange={handleInputChange("modeOfStudy")}
              label="Mode of Study"
            >
              <MenuItem value="On Campus">On Campus</MenuItem>
              <MenuItem value="Online">Online</MenuItem>
            </Select>
            {errors.modeOfStudy && (
              <FormHelperText>{errors.modeOfStudy}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.intake} required>
            <InputLabel>Intake</InputLabel>
            <Select
              value={formData.intake || ""}
              onChange={handleInputChange("intake")}
              label="Intake"
            >
              <MenuItem value="January">January</MenuItem>
              <MenuItem value="May">May</MenuItem>
              <MenuItem value="August">August</MenuItem>
            </Select>
            {errors.intake && <FormHelperText>{errors.intake}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Program selection */}
        <Grid item xs={12}>
          <FormControl
            fullWidth
            error={!!errors.program}
            required
            disabled={!formData.modeOfStudy || !formData.intake}
          >
            <InputLabel>Program</InputLabel>
            <Select
              value={formData.program || ""}
              onChange={handleInputChange("program")}
              label="Program"
            >
              {getAvailablePrograms().map((program) => (
                <MenuItem key={program} value={program}>
                  {program}
                </MenuItem>
              ))}
            </Select>
            {errors.program && (
              <FormHelperText>{errors.program}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Academic Documents Upload */}
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Academic Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload transcripts, certificates, diplomas, or academic records from
            previous institutions
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            fullWidth
            sx={{ mb: 1 }}
          >
            Upload Academic Documents
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange("academicDocuments")}
            />
          </Button>
          {formData.academicDocuments && (
            <Typography variant="body2" color="text.secondary">
              {Array.isArray(formData.academicDocuments)
                ? `${formData.academicDocuments.length} file(s) selected`
                : formData.academicDocuments.name}
            </Typography>
          )}
          {errors.academicDocuments && (
            <Typography variant="caption" color="error">
              {errors.academicDocuments}
            </Typography>
          )}
        </Grid>

        {/* Identification Documents Upload */}
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Identification Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload passport, national ID, birth certificate, or other
            government-issued identification
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            fullWidth
            sx={{ mb: 1 }}
          >
            Upload ID Documents
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange("identificationDocuments")}
            />
          </Button>
          {formData.identificationDocuments && (
            <Typography variant="body2" color="text.secondary">
              {Array.isArray(formData.identificationDocuments)
                ? `${formData.identificationDocuments.length} file(s) selected`
                : formData.identificationDocuments.name}
            </Typography>
          )}
          {errors.identificationDocuments && (
            <Typography variant="caption" color="error">
              {errors.identificationDocuments}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
