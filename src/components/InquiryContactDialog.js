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
import { leadService } from "../services/leadService";
import { useAuth } from "../contexts/AuthContext";

const InquiryContactDialog = ({ open, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "MANUAL",
    program: "",
    message: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactMethod, setContactMethod] = useState("whatsapp");

  const programOptions = [
    "Bachelor of Information Technology (BIT)",
    "Bachelor of Business Administration (BBA)",
    "Bachelor of Commerce (BCOM)",
    "Master of Information Technology (MIT)",
    "Master of Business Administration (MBA)",
    "Diploma in Information Technology",
    "Diploma in Business Administration",
    "Certificate Programs",
  ];

  const sourceOptions = [
    { value: "WEBSITE", label: "Website" },
    { value: "META_ADS", label: "Meta Ads" },
    { value: "GOOGLE_ADS", label: "Google Ads" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "LINKEDIN", label: "LinkedIn" },
    { value: "REFERRAL", label: "Referral" },
    { value: "WALK_IN", label: "Walk-in" },
    { value: "PHONE", label: "Phone Call" },
    { value: "EMAIL", label: "Email" },
    { value: "EDUCATION_FAIR", label: "Education Fair" },
    { value: "PARTNER", label: "Partner Institution" },
    { value: "MANUAL", label: "Manual Entry" },
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError("");
    setSuccess("");
  };

  const generateDefaultMessage = () => {
    const { name, program } = formData;
    let message = `Hello ${
      name || "there"
    }! Thank you for your interest in our programs.`;

    if (program) {
      message += ` I see you're interested in ${program}.`;
    }

    message += ` I'm excited to help you with information about admission requirements, fees, and application process. When would be a good time for a brief call to discuss your educational goals?`;

    return message;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
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
      const message = formData.message || generateDefaultMessage();

      // Prepare contact info
      const contactInfo = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        source: formData.source,
        program: formData.program || null,
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
          user
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
      message: "",
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
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              required
              placeholder="+256 700 123 456"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email (Optional)"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
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
                    {option.label}
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
                  <MenuItem key={program} value={program}>
                    {program}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* WhatsApp Message (if applicable) */}
          {contactMethod === "whatsapp" && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="WhatsApp Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={handleInputChange("message")}
                placeholder="Leave empty to use auto-generated message..."
                variant="outlined"
                helperText="A personalized message will be auto-generated if left empty"
              />
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
