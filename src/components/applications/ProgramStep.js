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
              <MenuItem value="on_campus">On Campus</MenuItem>
              <MenuItem value="online">Online</MenuItem>
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
              <MenuItem value="january">January</MenuItem>
              <MenuItem value="may">May</MenuItem>
              <MenuItem value="august">August</MenuItem>
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
              <MenuItem value="bachelor_business_administration">
                Bachelor of Business Administration
              </MenuItem>
              <MenuItem value="bachelor_public_administration">
                Bachelor of Public Administration
              </MenuItem>
              <MenuItem value="bachelor_procurement_logistics">
                Bachelor of Procurement and Logistics Management
              </MenuItem>
              <MenuItem value="bachelor_tourism_hotel">
                Bachelor of Tourism and Hotel Management
              </MenuItem>
              <MenuItem value="bachelor_human_resource">
                Bachelor of Human Resource Management
              </MenuItem>
              <MenuItem value="bachelor_journalism_communication">
                Bachelor of Journalism and Communication Studies
              </MenuItem>
              <MenuItem value="master_business_administration">
                Master of Business Administration (MBA)
              </MenuItem>

              {/* Science and Technology Programs */}
              <MenuItem value="bachelor_computer_science">
                Bachelor of Science in Computer Science
              </MenuItem>
              <MenuItem value="bachelor_information_technology">
                Bachelor of Information Technology
              </MenuItem>
              <MenuItem value="bachelor_software_engineering">
                Bachelor of Science in Software Engineering
              </MenuItem>
              <MenuItem value="bachelor_climate_smart_agriculture">
                Bachelor of Science in Climate Smart Agriculture
              </MenuItem>
              <MenuItem value="bachelor_environmental_science">
                Bachelor of Science in Environmental Science and Management
              </MenuItem>
              <MenuItem value="master_information_technology">
                Master of Information Technology
              </MenuItem>

              {/* Engineering Programs */}
              <MenuItem value="bachelor_electrical_engineering">
                Bachelor of Science in Electrical Engineering
              </MenuItem>
              <MenuItem value="bachelor_civil_engineering">
                Bachelor of Science in Civil Engineering
              </MenuItem>
              <MenuItem value="bachelor_architecture">
                Bachelor of Architecture
              </MenuItem>
              <MenuItem value="bachelor_petroleum_engineering">
                Bachelor of Science in Petroleum Engineering
              </MenuItem>
              <MenuItem value="bachelor_mechatronics_robotics">
                Bachelor of Science in Mechatronics and Robotics
              </MenuItem>
              <MenuItem value="bachelor_communications_engineering">
                Bachelor of Science in Communications Engineering
              </MenuItem>
              <MenuItem value="bachelor_mining_engineering">
                Bachelor of Science in Mining Engineering
              </MenuItem>
              <MenuItem value="diploma_electrical_engineering">
                Diploma in Electrical Engineering
              </MenuItem>
              <MenuItem value="diploma_civil_engineering">
                Diploma in Civil Engineering
              </MenuItem>
              <MenuItem value="diploma_architecture">
                Diploma in Architecture
              </MenuItem>

              {/* Law and Humanities Programs */}
              <MenuItem value="bachelor_laws">Bachelor of Laws (LLB)</MenuItem>
              <MenuItem value="bachelor_international_relations">
                Bachelor of International Relations and Diplomatic Studies
              </MenuItem>
              <MenuItem value="master_international_relations">
                Master of International Relations and Diplomatic Studies
              </MenuItem>

              {/* Certificate Programs */}
              <MenuItem value="higher_education_access_arts">
                Higher Education Access Programme - Arts
              </MenuItem>
              <MenuItem value="higher_education_access_sciences">
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
