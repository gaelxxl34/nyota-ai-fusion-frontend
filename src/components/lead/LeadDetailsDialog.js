import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Note as NoteIcon,
  Send as SendIcon,
  CallMade as CallIcon,
  Message as MessageIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { leadService } from "../../services/leadService";
import whatsappServiceDefault from "../../services/whatsappService";
import { useAuth } from "../../contexts/AuthContext";
import ApplicationDetailsDialog from "../applications/ApplicationDetailsDialog";
import ApplicationFormDialog from "../applications/ApplicationFormDialog";
import applicationService from "../../services/applicationService";

const whatsappService = whatsappServiceDefault;

const LeadDetailsDialog = ({
  open,
  onClose,
  leadId,
  onLeadUpdate,
  onLeadDelete,
}) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editedLead, setEditedLead] = useState({});
  const [communications, setCommunications] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [showApplicationFormDialog, setShowApplicationFormDialog] =
    useState(false);

  const { user } = useAuth();

  // Fetch lead details
  useEffect(() => {
    if (open && leadId) {
      fetchLeadDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  const fetchLeadDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await leadService.getLeadById(leadId);
      if (response?.data) {
        setLead(response.data);
        setEditedLead(response.data);

        // Check if this is an APPLIED lead
        if (response.data.status === "APPLIED") {
          // If the lead already has an applicationId, use it
          if (response.data.applicationId) {
            setApplicationId(response.data.applicationId);
          } else {
            // Otherwise, try to find an application using the leadId
            try {
              const appResponse =
                await applicationService.getApplicationByLeadId(leadId);
              if (appResponse.success && appResponse.data) {
                setApplicationId(appResponse.data.id);
              } else {
                setApplicationId(null);
              }
            } catch (appErr) {
              console.error("Error fetching application for lead:", appErr);
              setApplicationId(null);
            }
          }
        } else {
          setApplicationId(null);
        }

        // Fetch communication history
        if (response.data.phone) {
          try {
            // Get conversations for this phone number
            const conversations = await whatsappService.getConversations();

            // Find conversation matching the phone number
            const phoneNumber = response.data.phone.replace(/\D/g, "");
            const conversation = conversations?.conversations?.find((conv) =>
              conv.customerPhone?.includes(phoneNumber)
            );

            if (conversation) {
              // Get messages for this conversation
              const messagesResponse = await whatsappService.getMessages(
                conversation.id
              );
              setCommunications(messagesResponse?.messages || []);
            } else {
              setCommunications([]);
            }
          } catch (err) {
            console.error("Error fetching conversation history:", err);
            setCommunications([]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching lead details:", err);
      setError(err.message || "Failed to fetch lead details");
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setEditedLead((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await leadService.updateLead(leadId, editedLead);
      if (response?.data) {
        setLead(response.data);
        setEditing(false);
        onLeadUpdate?.(response.data);

        // Log the update activity
        await leadService.addLeadActivity(leadId, {
          type: "UPDATE",
          description: "Lead information updated",
          performedBy: user.email,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error updating lead:", err);
      setError(err.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await leadService.addLeadActivity(leadId, {
        type: "NOTE",
        description: newNote,
        performedBy: user.email,
        timestamp: new Date().toISOString(),
      });

      setNewNote("");
      fetchLeadDetails(); // Refresh to get updated activities
    } catch (err) {
      console.error("Error adding note:", err);
      setError(err.message || "Failed to add note");
    }
  };

  // Send WhatsApp message
  const handleSendWhatsAppMessage = async (message) => {
    if (!lead?.phone || !message.trim()) return;

    setSendingMessage(true);
    try {
      await whatsappService.sendMessage({
        to: lead.phone,
        message: message.trim(),
        leadId: leadId,
      });

      // Log communication activity
      await leadService.addLeadActivity(leadId, {
        type: "WHATSAPP_SENT",
        description: `WhatsApp message sent: "${message.substring(0, 50)}${
          message.length > 50 ? "..." : ""
        }"`,
        performedBy: user.email,
        timestamp: new Date().toISOString(),
      });

      // Refresh communication history
      fetchLeadDetails();
    } catch (err) {
      console.error("Error sending WhatsApp message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Get status color and progress
  const getStatusInfo = (status) => {
    const statusMap = {
      PRE_QUALIFIED: { color: "warning", progress: 40, label: "Interested" },
      APPLIED: { color: "info", progress: 60, label: "Applied" },
      QUALIFIED: { color: "success", progress: 75, label: "Qualified" },
      ADMITTED: { color: "secondary", progress: 85, label: "Admitted" },
      ENROLLED: { color: "success", progress: 100, label: "Enrolled" },
      REJECTED: { color: "error", progress: 0, label: "Rejected" },
      NURTURE: { color: "warning", progress: 20, label: "Nurture" },
    };
    return (
      statusMap[status] || { color: "default", progress: 0, label: status }
    );
  };

  const statusInfo = lead ? getStatusInfo(lead.status) : null;

  // Handle opening the application details dialog
  const handleViewApplication = async () => {
    // If we already have an applicationId, show the dialog
    if (applicationId) {
      setShowApplicationDialog(true);
      return;
    }

    // If the lead is APPLIED but we don't have an applicationId, try to fetch it again
    if (lead?.status === "APPLIED") {
      try {
        setLoading(true);
        const appResponse = await applicationService.getApplicationByLeadId(
          leadId
        );

        if (appResponse.success && appResponse.data) {
          setApplicationId(appResponse.data.id);
          setShowApplicationDialog(true);
        } else {
          // No application found, show form to create one
          setShowApplicationFormDialog(true);
        }
      } catch (err) {
        console.error("Error fetching application:", err);
        setError("Failed to fetch application details.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle creating a new application
  const handleCreateApplication = () => {
    setShowApplicationFormDialog(true);
  };

  // Handle closing the application details dialog
  const handleApplicationDialogClose = () => {
    setShowApplicationDialog(false);
  };

  // Handle closing the application form dialog
  const handleApplicationFormDialogClose = () => {
    setShowApplicationFormDialog(false);
  };

  // Handle successful application creation or update
  const handleApplicationFormSuccess = (result) => {
    if (result?.id) {
      setApplicationId(result.id);
      setShowApplicationFormDialog(false);
      setShowApplicationDialog(true);

      // Refresh lead data to reflect the change
      fetchLeadDetails();
    }
  };

  // Tab panels
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lead-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Skeleton variant="text" width={200} />
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={6} key={item}>
                <Skeleton variant="rectangular" height={60} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !lead) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!lead) return null;

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "90vh" },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: statusInfo?.color + ".main",
                  width: 56,
                  height: 56,
                }}
              >
                {lead.name?.charAt(0)?.toUpperCase() || "?"}
              </Avatar>
              <Box>
                <Typography variant="h5" component="div">
                  {lead.name || "Unnamed Lead"}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    label={statusInfo?.label}
                    color={statusInfo?.color}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    ID: {lead.id?.slice(-8)}
                  </Typography>
                </Box>

                {/* Status Progress */}
                <Box sx={{ mt: 1, width: 200 }}>
                  <LinearProgress
                    variant="determinate"
                    value={statusInfo?.progress}
                    color={statusInfo?.color}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {statusInfo?.progress}% Complete
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              {!editing && (
                <React.Fragment>
                  {/* Regular Edit button for all leads */}
                  <Tooltip title="Edit Lead">
                    <IconButton
                      onClick={() => setEditing(true)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Special View Application button only for APPLIED leads */}
                  {lead.status === "APPLIED" && applicationId && (
                    <Tooltip title="View Application">
                      <IconButton onClick={handleViewApplication} color="info">
                        <AssignmentIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </React.Fragment>
              )}
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {error && (
          <Alert
            severity="error"
            sx={{ mx: 3, mb: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <DialogContent sx={{ px: 3, py: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Overview" icon={<PersonIcon />} />
            <Tab label="Communication" icon={<MessageIcon />} />
            <Tab label="Activities" icon={<HistoryIcon />} />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%" }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <PersonIcon color="primary" />
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={
                          editing ? editedLead.name || "" : lead.name || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={
                          editing ? editedLead.email || "" : lead.email || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                        InputProps={{
                          endAdornment: lead.email && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                window.open(`mailto:${lead.email}`)
                              }
                            >
                              <EmailIcon />
                            </IconButton>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={
                          editing ? editedLead.phone || "" : lead.phone || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("phone", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                        InputProps={{
                          endAdornment: lead.phone && (
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => window.open(`tel:${lead.phone}`)}
                              >
                                <PhoneIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${lead.phone.replace(
                                      /[^\d]/g,
                                      ""
                                    )}`
                                  )
                                }
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            </Box>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={
                          editing
                            ? editedLead.location || ""
                            : lead.location || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("location", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: (
                            <LocationIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={
                          editing ? editedLead.notes || "" : lead.notes || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("notes", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Lead Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: "100%" }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <SchoolIcon color="primary" />
                    Lead Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={
                            editing
                              ? editedLead.status || ""
                              : lead.status || ""
                          }
                          label="Status"
                          onChange={(e) =>
                            handleFieldChange("status", e.target.value)
                          }
                          disabled={!editing}
                        >
                          <MenuItem value="PRE_QUALIFIED">Interested</MenuItem>
                          <MenuItem value="APPLIED">Applied</MenuItem>
                          <MenuItem value="QUALIFIED">Qualified</MenuItem>
                          <MenuItem value="ADMITTED">Admitted</MenuItem>
                          <MenuItem value="ENROLLED">Enrolled</MenuItem>
                          <MenuItem value="REJECTED">Rejected</MenuItem>
                          <MenuItem value="NURTURE">Nurture</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Source</InputLabel>
                        <Select
                          value={
                            editing
                              ? editedLead.source || ""
                              : lead.source || ""
                          }
                          label="Source"
                          onChange={(e) =>
                            handleFieldChange("source", e.target.value)
                          }
                          disabled={!editing}
                        >
                          <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                          <MenuItem value="INSTAGRAM">Instagram</MenuItem>
                          <MenuItem value="WEBSITE">Website</MenuItem>
                          <MenuItem value="EVENT">Event</MenuItem>
                          <MenuItem value="EMAIL">Email Campaign</MenuItem>
                          <MenuItem value="REFERRAL">Referral</MenuItem>
                          <MenuItem value="META_ADS">Meta Ads</MenuItem>
                          <MenuItem value="GOOGLE_ADS">Google Ads</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Program of Interest"
                        value={
                          editing
                            ? editedLead.program || ""
                            : lead.program || ""
                        }
                        onChange={(e) =>
                          handleFieldChange("program", e.target.value)
                        }
                        disabled={!editing}
                        variant={editing ? "outlined" : "filled"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Created"
                        value={new Date(lead.createdAt).toLocaleString()}
                        disabled
                        variant="filled"
                        InputProps={{
                          startAdornment: (
                            <CalendarIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Updated"
                        value={new Date(lead.updatedAt).toLocaleString()}
                        disabled
                        variant="filled"
                        InputProps={{
                          startAdornment: (
                            <ScheduleIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      startIcon={<WhatsAppIcon />}
                      color="success"
                      variant="contained"
                      disabled={!lead.phone}
                      onClick={() => {
                        // Open WhatsApp message composer in Communication tab
                        setActiveTab(1);
                      }}
                    >
                      Send Message
                    </Button>

                    <Button
                      startIcon={<EmailIcon />}
                      color="primary"
                      variant="outlined"
                      disabled={!lead.email}
                      onClick={() => window.open(`mailto:${lead.email}`)}
                    >
                      Send Email
                    </Button>

                    <Button
                      startIcon={<CallIcon />}
                      variant="outlined"
                      disabled={!lead.phone}
                      onClick={() => window.open(`tel:${lead.phone}`)}
                    >
                      Call
                    </Button>

                    <Button
                      startIcon={<AssignmentIcon />}
                      variant="outlined"
                      color={applicationId ? "info" : "secondary"}
                      onClick={
                        applicationId
                          ? handleViewApplication
                          : handleCreateApplication
                      }
                    >
                      {applicationId
                        ? "View Application"
                        : "Convert to Application"}
                    </Button>

                    <Button
                      startIcon={<FlagIcon />}
                      variant="outlined"
                      color="warning"
                    >
                      Flag for Follow-up
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Communication Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 400, overflow: "auto" }}>
                  <Typography variant="h6" gutterBottom>
                    WhatsApp Messages
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {communications.length > 0 ? (
                    <List>
                      {communications.map((msg, index) => (
                        <ListItem key={index} alignItems="flex-start">
                          <ListItemIcon>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <WhatsAppIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={msg.message}
                            secondary={`${msg.direction} • ${new Date(
                              msg.timestamp
                            ).toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      No WhatsApp messages found
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Send Message
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Message"
                      placeholder="Type your message here..."
                      disabled={!lead.phone}
                    />

                    <Button
                      startIcon={<SendIcon />}
                      variant="contained"
                      color="success"
                      disabled={!lead.phone || sendingMessage}
                      onClick={() => {
                        const messageInput = document.querySelector(
                          'input[placeholder="Type your message here..."]'
                        );
                        if (messageInput?.value) {
                          handleSendWhatsAppMessage(messageInput.value);
                          messageInput.value = "";
                        }
                      }}
                    >
                      {sendingMessage ? "Sending..." : "Send WhatsApp Message"}
                    </Button>

                    {!lead.phone && (
                      <Alert severity="warning">
                        No phone number available for this lead
                      </Alert>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Activities Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: "flex", gap: 3, height: 400 }}>
              <Paper sx={{ flex: 1, p: 2, overflow: "auto" }}>
                <Typography variant="h6" gutterBottom>
                  Activity Timeline
                </Typography>

                <List>
                  {(lead.activities || []).map((activity, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {activity.type === "NOTE" ? (
                          <NoteIcon color="primary" />
                        ) : (
                          <HistoryIcon color="secondary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              by {activity.performedBy}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                {(!lead.activities || lead.activities.length === 0) && (
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 4 }}
                  >
                    No activities recorded yet
                  </Typography>
                )}
              </Paper>

              <Paper sx={{ width: 300, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Add Note
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add a note about this lead..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<NoteIcon />}
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Add Note
                </Button>
              </Paper>
            </Box>
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {editing ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={() => {
                  setEditing(false);
                  setEditedLead(lead);
                  setError("");
                }}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Application Details Dialog */}
      {applicationId && (
        <ApplicationDetailsDialog
          open={showApplicationDialog}
          onClose={handleApplicationDialogClose}
          applicationId={applicationId}
          email={lead?.email}
        />
      )}

      {/* Application Form Dialog - for creating or editing applications */}
      <ApplicationFormDialog
        open={showApplicationFormDialog}
        onClose={handleApplicationFormDialogClose}
        onSuccess={handleApplicationFormSuccess}
        leadId={leadId}
        mode="create"
      />
    </React.Fragment>
  );
};

export default LeadDetailsDialog;
