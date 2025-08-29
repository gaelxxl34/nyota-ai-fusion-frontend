import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  CardActions,
  Tab,
  Tabs,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  Science as TestTubeIcon,
  Campaign as CampaignIcon,
  Facebook as FacebookIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";

const LeadFormsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formStats, setFormStats] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fields: [
      { name: "first_name", label: "First Name", type: "text", required: true },
      { name: "last_name", label: "Last Name", type: "text", required: false },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "phone_number",
        label: "Phone Number",
        type: "tel",
        required: true,
      },
    ],
    metaConfig: {
      pixelId: "",
      accessToken: "",
      formId: "",
      pageId: "",
    },
    webhookUrl: "",
    isActive: true,
    campaignId: "",
    adsetId: "",
  });

  // Available field types for form builder
  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Phone" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio Buttons" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
  ];

  // Predefined field templates
  const fieldTemplates = [
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
      icon: <PersonIcon />,
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: false,
      icon: <PersonIcon />,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      icon: <EmailIcon />,
    },
    {
      name: "phone_number",
      label: "Phone Number",
      type: "tel",
      required: true,
      icon: <PhoneIcon />,
    },
    {
      name: "whatsapp",
      label: "WhatsApp Number",
      type: "tel",
      required: false,
      icon: <WhatsAppIcon />,
    },
    {
      name: "program_interested_in",
      label: "Program of Interest",
      type: "select",
      required: false,
      icon: <SchoolIcon />,
    },
    {
      name: "country",
      label: "Country",
      type: "text",
      required: false,
      icon: <LocationOnIcon />,
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: false,
      icon: <LocationOnIcon />,
    },
    {
      name: "age",
      label: "Age",
      type: "number",
      required: false,
      icon: <PersonIcon />,
    },
    {
      name: "education_level",
      label: "Education Level",
      type: "select",
      required: false,
      icon: <SchoolIcon />,
    },
    {
      name: "company",
      label: "Company",
      type: "text",
      required: false,
      icon: <BusinessIcon />,
    },
    {
      name: "budget",
      label: "Budget",
      type: "select",
      required: false,
      icon: <BusinessIcon />,
    },
    {
      name: "start_date",
      label: "Preferred Start Date",
      type: "date",
      required: false,
      icon: <DateRangeIcon />,
    },
  ];

  // Fetch all lead forms
  const fetchForms = useCallback(async () => {
    try {
      setError("");
      const response = await superAdminService.getLeadForms();
      setForms(response.forms || []);

      // Fetch stats for each form
      const statsPromises = response.forms.map(async (form) => {
        try {
          const stats = await superAdminService.getLeadFormStats(form.id);
          return { formId: form.id, stats: stats.stats };
        } catch (err) {
          console.error(`Failed to fetch stats for form ${form.id}:`, err);
          return { formId: form.id, stats: null };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ formId, stats }) => {
        statsMap[formId] = stats;
      });
      setFormStats(statsMap);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch lead forms");
      console.error("Error fetching forms:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchForms();
  };

  const handleCreateForm = async () => {
    try {
      setError("");
      await superAdminService.createLeadForm(formData);
      setOpenDialog(false);
      resetFormData();
      fetchForms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lead form");
    }
  };

  const handleUpdateForm = async () => {
    try {
      setError("");
      await superAdminService.updateLeadForm(selectedForm.id, formData);
      setOpenDialog(false);
      setSelectedForm(null);
      resetFormData();
      fetchForms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lead form");
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this lead form?")) {
      return;
    }

    try {
      setError("");
      await superAdminService.deleteLeadForm(formId);
      fetchForms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lead form");
    }
  };

  const handleTestWebhook = async (formId) => {
    try {
      setError("");
      const response = await superAdminService.testLeadFormWebhook(formId);
      alert(
        `Webhook test completed successfully!\n\nTest Data:\n${JSON.stringify(
          response.testData,
          null,
          2
        )}`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to test webhook");
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      fields: [
        {
          name: "first_name",
          label: "First Name",
          type: "text",
          required: true,
        },
        {
          name: "last_name",
          label: "Last Name",
          type: "text",
          required: false,
        },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "phone_number",
          label: "Phone Number",
          type: "tel",
          required: true,
        },
      ],
      metaConfig: {
        pixelId: "",
        accessToken: "",
        formId: "",
        pageId: "",
      },
      webhookUrl: "",
      isActive: true,
      campaignId: "",
      adsetId: "",
    });
  };

  const openCreateDialog = () => {
    resetFormData();
    setSelectedForm(null);
    setOpenDialog(true);
  };

  const openEditDialog = (form) => {
    setFormData({
      name: form.name || "",
      description: form.description || "",
      fields: form.fields || [],
      metaConfig: form.metaConfig || {
        pixelId: "",
        accessToken: "",
        formId: "",
        pageId: "",
      },
      webhookUrl: form.webhookUrl || "",
      isActive: form.isActive !== false,
      campaignId: form.campaignId || "",
      adsetId: form.adsetId || "",
    });
    setSelectedForm(form);
    setOpenDialog(true);
  };

  const addField = (template) => {
    const newField = { ...template, id: Date.now() };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const removeField = (index) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (index, field) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? field : f)),
    }));
  };

  const getStatusColor = (isActive) => {
    return isActive ? "success" : "error";
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <PlayArrowIcon /> : <PauseIcon />;
  };

  const getFormTypeIcon = (form) => {
    if (form.metaConfig?.formId) {
      return <FacebookIcon sx={{ color: "#1877f2" }} />;
    }
    return <CodeIcon />;
  };

  const formatWebhookUrl = (url) => {
    if (!url) return "Not configured";
    return url.length > 50 ? `${url.substring(0, 50)}...` : url;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Lead Forms Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage different lead forms connected to Meta Ads API and webhook
            configurations
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            }}
          >
            Create Lead Form
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Forms Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {forms.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Forms
                  </Typography>
                </Box>
                <CampaignIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #388e3c 30%, #66bb6a 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {forms.filter((f) => f.isActive).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Forms
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #f57c00 30%, #ffb74d 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Object.values(formStats).reduce(
                      (total, stats) => total + (stats?.totalLeads || 0),
                      0
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Leads
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #7b1fa2 30%, #ba68c8 90%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Object.values(formStats).length > 0
                      ? (
                          Object.values(formStats).reduce(
                            (total, stats) =>
                              total + (stats?.conversionRate || 0),
                            0
                          ) / Object.values(formStats).length
                        ).toFixed(1)
                      : 0}
                    %
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Avg Conversion
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Forms List */}
      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Typography>Loading lead forms...</Typography>
          </Box>
        </Paper>
      ) : forms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CampaignIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Lead Forms Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first lead form to start collecting leads from Meta Ads
            campaigns
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Create Your First Lead Form
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {forms.map((form) => {
            const stats = formStats[form.id];
            return (
              <Grid item xs={12} md={6} lg={4} key={form.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Form Header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getFormTypeIcon(form)}
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {form.name}
                          </Typography>
                          <Chip
                            size="small"
                            label={form.isActive ? "Active" : "Inactive"}
                            color={getStatusColor(form.isActive)}
                            icon={getStatusIcon(form.isActive)}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* Form Description */}
                    {form.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {form.description}
                      </Typography>
                    )}

                    {/* Form Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Fields: {form.fields?.length || 0} • Webhook:{" "}
                        {formatWebhookUrl(form.webhookUrl)}
                      </Typography>
                    </Box>

                    {/* Meta Configuration */}
                    {form.metaConfig?.formId && (
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          size="small"
                          label={`Meta Form: ${form.metaConfig.formId}`}
                          variant="outlined"
                        />
                        {form.campaignId && (
                          <Chip
                            size="small"
                            label={`Campaign: ${form.campaignId}`}
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Statistics */}
                    {stats && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: "center" }}>
                              <Typography variant="h6" color="primary">
                                {stats.totalLeads || 0}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Total Leads
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: "center" }}>
                              <Typography variant="h6" color="success.main">
                                {stats.conversionRate || 0}%
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Conversion
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions
                    sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                  >
                    <Box>
                      <Tooltip title="View Statistics">
                        <IconButton size="small" color="primary">
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Test Webhook">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleTestWebhook(form.id)}
                        >
                          <TestTubeIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box>
                      <Tooltip title="Edit Form">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(form)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Form">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {selectedForm ? "Edit Lead Form" : "Create New Lead Form"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
            >
              <Tab label="Basic Info" />
              <Tab label="Form Fields" />
              <Tab label="Meta Configuration" />
              <Tab label="Webhook Settings" />
            </Tabs>

            {/* Basic Info Tab */}
            {activeTab === 0 && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Form Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Campaign ID"
                  value={formData.campaignId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      campaignId: e.target.value,
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Ad Set ID"
                  value={formData.adsetId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adsetId: e.target.value,
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Active"
                />
              </Box>
            )}

            {/* Form Fields Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3 }}>
                {/* Field Templates */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      Add Field from Template
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {fieldTemplates.map((template, index) => (
                        <Grid item xs={6} md={4} key={index}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => addField(template)}
                            startIcon={template.icon}
                            fullWidth
                          >
                            {template.label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Current Fields */}
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                  Current Fields ({formData.fields.length})
                </Typography>

                {formData.fields.map((field, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Field Name"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              name: e.target.value,
                            })
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Label"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              label: e.target.value,
                            })
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={field.type}
                            onChange={(e) =>
                              updateField(index, {
                                ...field,
                                type: e.target.value,
                              })
                            }
                            label="Type"
                          >
                            {fieldTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.required}
                              onChange={(e) =>
                                updateField(index, {
                                  ...field,
                                  required: e.target.checked,
                                })
                              }
                            />
                          }
                          label="Required"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton
                          color="error"
                          onClick={() => removeField(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {formData.fields.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No fields added yet. Use the templates above to add
                      fields.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Meta Configuration Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Configure Meta Ads API settings to connect this form with your
                  Facebook/Instagram campaigns.
                </Alert>

                <TextField
                  fullWidth
                  label="Meta Pixel ID"
                  value={formData.metaConfig.pixelId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaConfig: {
                        ...prev.metaConfig,
                        pixelId: e.target.value,
                      },
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Meta Access Token"
                  value={formData.metaConfig.accessToken}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaConfig: {
                        ...prev.metaConfig,
                        accessToken: e.target.value,
                      },
                    }))
                  }
                  type="password"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Meta Form ID"
                  value={formData.metaConfig.formId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaConfig: {
                        ...prev.metaConfig,
                        formId: e.target.value,
                      },
                    }))
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Meta Page ID"
                  value={formData.metaConfig.pageId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      metaConfig: {
                        ...prev.metaConfig,
                        pageId: e.target.value,
                      },
                    }))
                  }
                />
              </Box>
            )}

            {/* Webhook Settings Tab */}
            {activeTab === 3 && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  The webhook URL will receive POST requests when new leads are
                  submitted through this form.
                </Alert>

                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={formData.webhookUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      webhookUrl: e.target.value,
                    }))
                  }
                  placeholder="https://your-domain.com/api/webhook/meta-lead-ads"
                  sx={{ mb: 2 }}
                />

                <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Default Webhook URLs:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Meta Lead Ads"
                        secondary="https://your-domain.com/api/webhook/meta-lead-ads"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Meta Ads (Form submissions)"
                        secondary="https://your-domain.com/api/webhook/meta-ads"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={selectedForm ? handleUpdateForm : handleCreateForm}
            disabled={!formData.name || formData.fields.length === 0}
          >
            {selectedForm ? "Update Form" : "Create Form"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadFormsManagement;
