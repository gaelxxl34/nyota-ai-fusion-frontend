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
  Chip,
  Box,
} from "@mui/material";
import {
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import { leadService } from "../services/leadService";
import { useAuth } from "../contexts/AuthContext";
import { SOURCE_CONFIG } from "../config/lead.constants";
import { PROGRAM_OPTIONS } from "../config/program.constants";

const InquiryContactDialog = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  // Fixed template message to be sent for WhatsApp validation/contact
  const TEMPLATE_MESSAGE = `Hello 👋\nThank you for your interest in IUEA 🎓\nWe’ve received your message and we’re here to help 😊\n👉 Are you interested in a specific program, or would you like support with the admission process?`;
  const [formData, setFormData] = useState({
    name: "",
    phone: "", // Will store the formatted international phone number
    email: "",
    source: "MANUAL",
    program: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactMethod, setContactMethod] = useState("whatsapp");

  // Use the standardized program options from constants
  const programOptions = PROGRAM_OPTIONS;

  // Use the same source configuration from constants
  const sourceOptions = Object.entries(SOURCE_CONFIG).map(
    ([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
    })
  );

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError("");
    setSuccess("");
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone: value || "" });
    setError("");
    setSuccess("");
  };

  const generateDefaultMessage = () => {
    // Return fixed template message regardless of name/program (per new requirement)
    return TEMPLATE_MESSAGE;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }

    // Use the package's built-in validation
    if (!isValidPhoneNumber(formData.phone)) {
      setError("Please enter a valid phone number");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email address is required");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
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
      // Always use auto-generated personalized message (manual edit removed)
      const message = generateDefaultMessage();

      // Prepare contact info
      const contactInfo = {
        name: formData.name,
        phone: formData.phone, // Already in international format from PhoneInput
        email: formData.email,
        source: formData.source,
        program: formData.program || null,
        status: "INTERESTED", // Set status to INTERESTED for new leads to follow proper funnel
        notes:
          formData.notes ||
          `Manual inquiry created. Interested in: ${
            formData.program || "general programs"
          }`,
      };

      if (contactMethod === "whatsapp") {
        // Contact via WhatsApp (creates lead and sends message)
        const result = await leadService.contactLeadViaWhatsApp(
          contactInfo,
          message,
          user,
          { templateName: "whatsapp_validation" }
        );

        if (result.success) {
          setSuccess(
            `✅ Lead created and WhatsApp message sent to ${formData.name}!`
          );

          // Call success callback with lead data
          if (onSuccess) {
            onSuccess({
              lead: result.lead,
              messageResult: result.messageResult,
              contactMethod: "whatsapp",
            });
          }
        } else {
          throw new Error("Failed to send WhatsApp message");
        }
      } else {
        // Create lead without sending message
        const result = await leadService.createLead(contactInfo, user);

        if (result.success) {
          setSuccess(
            `✅ Lead created for ${formData.name}! Ready for manual contact.`
          );

          if (onSuccess) {
            onSuccess({
              lead: result.data,
              contactMethod: "manual",
            });
          }
        }
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating lead:", error);
      setError(error.message || "Failed to create lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      source: "MANUAL",
      program: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setContactMethod("whatsapp");
    onClose();
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
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Create New Inquiry & Contact
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add a new lead and optionally send immediate contact via WhatsApp
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Contact Method Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Contact Method
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                icon={<WhatsAppIcon />}
                label="Send WhatsApp Message"
                onClick={() => setContactMethod("whatsapp")}
                color={contactMethod === "whatsapp" ? "primary" : "default"}
                variant={contactMethod === "whatsapp" ? "filled" : "outlined"}
                clickable
              />
              <Chip
                icon={<PhoneIcon />}
                label="Manual Contact Later"
                onClick={() => setContactMethod("manual")}
                color={contactMethod === "manual" ? "primary" : "default"}
                variant={contactMethod === "manual" ? "filled" : "outlined"}
                clickable
              />
            </Box>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleInputChange("name")}
              required
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="UG"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="phone-input-material-ui"
                placeholder="Enter phone number"
                style={{
                  "--PhoneInputCountryFlag-height": "1.2em",
                  "--PhoneInputCountryFlag-width": "1.5em",
                  "--PhoneInputCountrySelectArrow-color": "#666666",
                  "--PhoneInputCountrySelectArrow-opacity": "0.8",
                }}
              />
              <style>{`
                .phone-input-material-ui {
                  width: 100%;
                  padding: 14px;
                  border: 1px solid #c4c4c4;
                  border-radius: 4px;
                  font-size: 16px;
                  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
                  transition: border-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;
                }
                
                .phone-input-material-ui:focus-within {
                  border-color: #1976d2;
                  border-width: 2px;
                  outline: none;
                }
                
                .phone-input-material-ui .PhoneInputInput {
                  border: none;
                  outline: none;
                  background: transparent;
                  font-size: inherit;
                  font-family: inherit;
                  width: 100%;
                  margin-left: 8px;
                }
                
                .phone-input-material-ui .PhoneInputCountrySelect {
                  border: none;
                  outline: none;
                  background: transparent;
                }
              `}</style>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Lead Source</InputLabel>
              <Select
                value={formData.source}
                onChange={handleInputChange("source")}
                label="Lead Source"
              >
                {sourceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Program Interest */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Program of Interest (Optional)</InputLabel>
              <Select
                value={formData.program}
                onChange={handleInputChange("program")}
                label="Program of Interest (Optional)"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {programOptions.map((program) => (
                  <MenuItem key={program.value} value={program.value}>
                    {program.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Message Preview (WhatsApp) */}
          {contactMethod === "whatsapp" && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Message Preview
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: "grey.300",
                  bgcolor: "grey.50",
                  p: 2,
                  borderRadius: 1,
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                  fontFamily: "Roboto, Helvetica, Arial, sans-serif",
                }}
              >
                {TEMPLATE_MESSAGE}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                This predefined template (whatsapp_validation) will be sent.
              </Typography>
            </Grid>
          )}

          {/* Internal Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Internal Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleInputChange("notes")}
              placeholder="Add any internal notes about this lead..."
              variant="outlined"
            />
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
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : contactMethod === "whatsapp" ? (
              <WhatsAppIcon />
            ) : (
              <SendIcon />
            )
          }
        >
          {loading
            ? "Processing..."
            : contactMethod === "whatsapp"
            ? "Create & Send WhatsApp"
            : "Create Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InquiryContactDialog;
