import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { PersonalDetailsStep } from "./PersonalDetailsStep";
import { ProgramStep } from "./ProgramStep";
import { AdditionalDataStep } from "./AdditionalDataStep";
import { useApplicationForm } from "./useApplicationForm";

const steps = [
  "Personal Details",
  "Program Selection",
  "Additional Information",
];

const ApplicationFormDialog = ({
  open,
  onClose,
  onSuccess,
  applicationId,
  mode = "create",
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const {
    formData,
    updateFormData,
    resetForm,
    validateStep,
    submitApplication,
    loadApplication,
    isSubmitting,
    isLoading,
    errors,
  } = useApplicationForm();

  // Load application data when editing an existing application
  React.useEffect(() => {
    if (open && mode === "edit" && applicationId) {
      loadApplication(applicationId);
    }
  }, [open, mode, applicationId, loadApplication]);

  // State for duplicate detection
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const handleNext = async () => {
    console.log("Attempting to move to next step from step", activeStep);
    const isValid = await validateStep(activeStep, formData);
    console.log("Validation result:", isValid);
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      console.log("Advanced to next step");
    } else {
      console.log("Failed to advance due to validation errors");
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const [submissionMessage, setSubmissionMessage] = useState({
    type: "",
    message: "",
  });

  const handleSubmit = async () => {
    // Clear any previous messages
    setSubmissionMessage({ type: "", message: "" });

    try {
      console.log("Submitting application...");

      const result = await submitApplication(false); // First attempt without force submit

      if (result.success) {
        console.log(
          mode === "edit"
            ? "Application updated successfully:"
            : "Application submitted successfully:",
          result
        );
        setSubmissionMessage({
          type: "success",
          message:
            mode === "edit"
              ? "Application updated successfully!"
              : "Application submitted successfully! A confirmation email has been sent to the applicant.",
        });

        // Process immediately but keep success message visible
        onSuccess(result);
        // Close after a short delay so users can see confirmation
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else if (result.duplicatesFound) {
        console.log("Duplicate records found:", result.existingData);
        // Show duplicate confirmation dialog
        setDuplicateData(result.existingData);
        setShowDuplicateDialog(true);
      } else {
        console.error("Application submission failed:", result);
        setSubmissionMessage({
          type: "error",
          message:
            result.message || "Failed to submit application. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setSubmissionMessage({
        type: "error",
        message:
          error.message || "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleClose = () => {
    resetForm();
    setActiveStep(0);
    setSubmissionMessage({ type: "", message: "" });
    setShowDuplicateDialog(false);
    setDuplicateData(null);
    onClose();
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <PersonalDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <ProgramStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <AdditionalDataStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Snackbar
        open={!!submissionMessage.message}
        autoHideDuration={6000}
        onClose={() => setSubmissionMessage({ type: "", message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={submissionMessage.type === "success" ? "success" : "error"}
          onClose={() => setSubmissionMessage({ type: "", message: "" })}
          sx={{ width: "100%" }}
        >
          {submissionMessage.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "600px" },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {mode === "edit" ? "Edit Application" : "New Application"}
              {isLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {mode === "edit" && isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "400px",
              }}
            >
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading application data...
              </Typography>
            </Box>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ minHeight: "400px" }}>
                {getStepContent(activeStep)}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || localSubmitting || isLoading}
                startIcon={
                  isSubmitting || localSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isSubmitting || localSubmitting
                  ? "Submitting..."
                  : mode === "edit"
                  ? "Update Application"
                  : "Submit Application"}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      <Dialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Existing Records Found
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            We found existing records in our system with the same email address
            or phone number. This could be a duplicate application.
          </DialogContentText>

          {duplicateData && (
            <Box>
              {/* Display existing applications found by email */}
              {duplicateData.applications.byEmail.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Existing applications with the same email:
                  </Typography>
                  <List dense>
                    {duplicateData.applications.byEmail.map((app) => (
                      <ListItem key={app.id}>
                        <ListItemText
                          primary={`${app.name} - ${
                            typeof app.program === "object" &&
                            app.program !== null
                              ? app.program.name ||
                                app.program.code ||
                                "Unknown Program"
                              : app.program || "Unknown Program"
                          }`}
                          secondary={`Status: ${
                            app.status
                          } | Submitted: ${new Date(
                            app.submittedAt
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Display existing applications found by phone */}
              {duplicateData.applications.byPhone.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Existing applications with the same phone number:
                  </Typography>
                  <List dense>
                    {duplicateData.applications.byPhone.map((app) => (
                      <ListItem key={app.id}>
                        <ListItemText
                          primary={`${app.name} - ${
                            typeof app.program === "object" &&
                            app.program !== null
                              ? app.program.name ||
                                app.program.code ||
                                "Unknown Program"
                              : app.program || "Unknown Program"
                          }`}
                          secondary={`Status: ${
                            app.status
                          } | Submitted: ${new Date(
                            app.submittedAt
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Display existing leads found by email */}
              {duplicateData.leads.byEmail && (
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Existing lead with the same email:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={`${duplicateData.leads.byEmail.name} - ${
                          typeof duplicateData.leads.byEmail.program ===
                            "object" &&
                          duplicateData.leads.byEmail.program !== null
                            ? duplicateData.leads.byEmail.program.name ||
                              duplicateData.leads.byEmail.program.code ||
                              "No Program"
                            : duplicateData.leads.byEmail.program ||
                              "No Program"
                        }`}
                        secondary={`Status: ${
                          duplicateData.leads.byEmail.status
                        } | Created: ${new Date(
                          duplicateData.leads.byEmail.createdAt
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}

              {/* Display existing leads found by phone */}
              {duplicateData.leads.byPhone && (
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Existing lead with the same phone number:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={`${duplicateData.leads.byPhone.name} - ${
                          typeof duplicateData.leads.byPhone.program ===
                            "object" &&
                          duplicateData.leads.byPhone.program !== null
                            ? duplicateData.leads.byPhone.program.name ||
                              duplicateData.leads.byPhone.program.code ||
                              "No Program"
                            : duplicateData.leads.byPhone.program ||
                              "No Program"
                        }`}
                        secondary={`Status: ${
                          duplicateData.leads.byPhone.status
                        } | Created: ${new Date(
                          duplicateData.leads.byPhone.createdAt
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            Do you want to proceed with submitting this application anyway?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDuplicateDialog(false)}
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setShowDuplicateDialog(false);
              setLocalSubmitting(true); // Set local submitting state

              try {
                // Force submit the application
                const result = await submitApplication(true);

                if (result.success) {
                  console.log(
                    "Application force submitted successfully:",
                    result
                  );
                  setSubmissionMessage({
                    type: "success",
                    message:
                      "Application submitted successfully! A confirmation email has been sent to the applicant.",
                  });

                  // Process immediately but keep success message visible
                  onSuccess(result);
                  // Close after a short delay so users can see confirmation
                  setTimeout(() => {
                    handleClose();
                  }, 1000);
                } else {
                  console.error("Application force submission failed:", result);
                  setSubmissionMessage({
                    type: "error",
                    message:
                      result.message ||
                      "Failed to submit application. Please try again.",
                  });
                }
              } catch (error) {
                console.error("Error during force submission:", error);
                setSubmissionMessage({
                  type: "error",
                  message:
                    error.message ||
                    "An unexpected error occurred during submission.",
                });
              } finally {
                setLocalSubmitting(false);
              }
            }}
            color="warning"
            variant="contained"
            disabled={isSubmitting || localSubmitting}
            startIcon={
              isSubmitting || localSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            Submit Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApplicationFormDialog;
