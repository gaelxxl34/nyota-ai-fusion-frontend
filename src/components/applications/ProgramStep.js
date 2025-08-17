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

export const ProgramStep = ({ formData, updateFormData, errors = {} }) => {
  const handleInputChange = (field) => (event) => {
    updateFormData({ [field]: event.target.value });
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

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Program
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

        {/* Program selection below */}
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.program} required>
            <InputLabel>Program</InputLabel>
            <Select
              value={formData.program || ""}
              onChange={handleInputChange("program")}
              label="Program"
            >
              {/* Business and Management Programs */}
              <MenuItem value="Bachelor of Business Administration">
                Bachelor of Business Administration
              </MenuItem>
              <MenuItem value="Bachelor of Public Administration">
                Bachelor of Public Administration
              </MenuItem>
              <MenuItem value="Bachelor of Procurement and Logistics Management">
                Bachelor of Procurement and Logistics Management
              </MenuItem>
              <MenuItem value="Bachelor of Tourism and Hotel Management">
                Bachelor of Tourism and Hotel Management
              </MenuItem>
              <MenuItem value="Bachelor of Human Resource Management">
                Bachelor of Human Resource Management
              </MenuItem>
              <MenuItem value="Bachelor of Journalism and Communication Studies">
                Bachelor of Journalism and Communication Studies
              </MenuItem>
              <MenuItem value="Master of Business Administration">
                Master of Business Administration (MBA)
              </MenuItem>

              {/* Science and Technology Programs */}
              <MenuItem value="Bachelor of Science in Computer Science">
                Bachelor of Science in Computer Science
              </MenuItem>
              <MenuItem value="Bachelor of Information Technology">
                Bachelor of Information Technology
              </MenuItem>
              <MenuItem value="Bachelor of Science in Software Engineering">
                Bachelor of Science in Software Engineering
              </MenuItem>
              <MenuItem value="Bachelor of Science in Climate Smart Agriculture">
                Bachelor of Science in Climate Smart Agriculture
              </MenuItem>
              <MenuItem value="Bachelor of Science in Environmental Science and Management">
                Bachelor of Science in Environmental Science and Management
              </MenuItem>
              <MenuItem value="Master of Information Technology">
                Master of Information Technology
              </MenuItem>

              {/* Engineering Programs */}
              <MenuItem value="Bachelor of Science in Electrical Engineering">
                Bachelor of Science in Electrical Engineering
              </MenuItem>
              <MenuItem value="Bachelor of Science in Civil Engineering">
                Bachelor of Science in Civil Engineering
              </MenuItem>
              <MenuItem value="Bachelor of Architecture">
                Bachelor of Architecture
              </MenuItem>
              <MenuItem value="Bachelor of Science in Petroleum Engineering">
                Bachelor of Science in Petroleum Engineering
              </MenuItem>
              <MenuItem value="Bachelor of Science in Mechatronics and Robotics">
                Bachelor of Science in Mechatronics and Robotics
              </MenuItem>
              <MenuItem value="Bachelor of Science in Communications Engineering">
                Bachelor of Science in Communications Engineering
              </MenuItem>
              <MenuItem value="Bachelor of Science in Mining Engineering">
                Bachelor of Science in Mining Engineering
              </MenuItem>
              <MenuItem value="Diploma in Electrical Engineering">
                Diploma in Electrical Engineering
              </MenuItem>
              <MenuItem value="Diploma in Civil Engineering">
                Diploma in Civil Engineering
              </MenuItem>
              <MenuItem value="Diploma in Architecture">
                Diploma in Architecture
              </MenuItem>

              {/* Law and Humanities Programs */}
              <MenuItem value="Bachelor of Laws">
                Bachelor of Laws (LLB)
              </MenuItem>
              <MenuItem value="Bachelor of International Relations and Diplomatic Studies">
                Bachelor of International Relations and Diplomatic Studies
              </MenuItem>
              <MenuItem value="Master of International Relations and Diplomatic Studies">
                Master of International Relations and Diplomatic Studies
              </MenuItem>

              {/* Certificate Programs */}
              <MenuItem value="Higher Education Access Programme - Arts">
                Higher Education Access Programme - Arts
              </MenuItem>
              <MenuItem value="Higher Education Access Programme - Sciences">
                Higher Education Access Programme - Sciences
              </MenuItem>
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
