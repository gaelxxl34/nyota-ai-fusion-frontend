import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Stack,
  Menu,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Videocam as VideocamIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  AccessTime as TimeIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { format, formatDistanceToNow } from "date-fns";
import { leadService } from "../../services/leadService";

const interactionTypes = {
  phone: { icon: PhoneIcon, label: "Phone Call", color: "primary" },
  whatsapp_call: {
    icon: VideocamIcon,
    label: "WhatsApp Call",
    color: "success",
  },
  whatsapp_message: {
    icon: WhatsAppIcon,
    label: "WhatsApp Message",
    color: "success",
  },
  meeting: { icon: PersonIcon, label: "Meeting", color: "warning" },
};

const outcomeTypes = {
  positive: {
    icon: TrendingUpIcon,
    label: "Positive",
    color: "success",
    description: "Good response, moving forward",
  },
  neutral: {
    icon: TrendingFlatIcon,
    label: "Neutral",
    color: "warning",
    description: "Ongoing conversation",
  },
  negative: {
    icon: TrendingDownIcon,
    label: "Negative",
    color: "error",
    description: "Not interested or obstacles",
  },
};

// Interaction tags for better interaction categorization
// Organized by conversion priority: HIGH = positive conversion signals, MEDIUM = neutral, LOW = negative conversion signals
const interactionTags = {
  // 🟢 HIGH PRIORITY - Strong Positive Conversion Signals
  application_started: {
    label: "Application Started",
    description: "Lead began application process - STRONG conversion signal",
    priority: "high",
    color: "success",
  },
  application_submitted: {
    label: "Application Submitted",
    description: "Application completed and submitted - EXCELLENT conversion",
    priority: "high",
    color: "success",
  },
  application_assistance: {
    label: "Application Assistance",
    description: "Helped with application process - shows serious intent",
    priority: "high",
    color: "success",
  },
  campus_visit: {
    label: "Will Visit",
    description: "Lead will visit campus - strong engagement signal",
    priority: "high",
    color: "success",
  },
  parent_meeting: {
    label: "Parent Meeting",
    description: "Meeting with parents/guardians - family buy-in",
    priority: "high",
    color: "success",
  },

  // 🟡 MEDIUM PRIORITY - Neutral Activities
  document_shared: {
    label: "Document Shared",
    description: "Shared brochures, forms, or information",
    priority: "medium",
    color: "info",
  },
  follow_up_scheduled: {
    label: "Follow-up Scheduled",
    description: "Scheduled future contact",
    priority: "medium",
    color: "warning",
  },
  reminder_sent: {
    label: "Reminder Sent",
    description: "Sent reminder about deadlines or actions",
    priority: "medium",
    color: "info",
  },
  deferred: {
    label: "Deferred",
    description: "Lead postponed to future intake",
    priority: "medium",
    color: "warning",
  },

  // 🔴 LOW PRIORITY - Negative Conversion Signals
  scholarship_info: {
    label: "Scholarship Information",
    description:
      "Asked about scholarships - cost-conscious, less likely to pay full fees",
    priority: "low",
    color: "error",
  },
  financial_assistance: {
    label: "Financial Assistance Request",
    description: "Inquired about financial aid - budget constraints signal",
    priority: "low",
    color: "error",
  },
  payment_plan_inquiry: {
    label: "Payment Plan Inquiry",
    description: "Asked about payment plans - potential cash flow issues",
    priority: "low",
    color: "error",
  },
  lead_closed: {
    label: "Lead Closed",
    description: "Lead decided not to proceed",
    priority: "low",
    color: "error",
  },
};

const InteractionTimeline = ({ leadId, leadName }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "phone",
    direction: "outgoing",
    outcome: "neutral",
    notes: "",
    nextAction: "",
    duration: "",
    subject: "",
    interactionTag: "",
  });

  // Load interactions when component mounts or leadId changes
  useEffect(() => {
    if (leadId) {
      loadInteractions();
    }
  }, [leadId, filter, loadInteractions]);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterOptions = {};
      if (filter !== "all") {
        filterOptions.type = filter;
      }

      const response = await leadService.getInteractions(leadId, filterOptions);

      if (response.success) {
        setInteractions(response.data || []);
      } else {
        setError(response.error || "Failed to load interactions");
      }
    } catch (err) {
      console.error("Error loading interactions:", err);
      setError(err.message || "Failed to load interactions");
    } finally {
      setLoading(false);
    }
  };

  // Pre-defined templates for quick logging - Organized by conversion priority
  const quickTemplates = [
    // 🟢 HIGH PRIORITY TEMPLATES - Strong Conversion Signals
    {
      type: "phone",
      outcome: "positive",
      notes: "Helped with application process - very engaged",
      nextAction: "Monitor application submission",
      interactionTag: "application_assistance",
    },
    {
      type: "whatsapp_message",
      outcome: "positive",
      notes: "Lead started application in portal",
      nextAction: "Follow up on application progress",
      interactionTag: "application_started",
    },
    {
      type: "phone",
      outcome: "positive",
      notes: "Application successfully submitted!",
      nextAction: "Process application review",
      interactionTag: "application_submitted",
    },
    {
      type: "meeting",
      outcome: "positive",
      notes: "Scheduled campus visit for next week",
      nextAction: "Prepare campus tour materials",
      interactionTag: "campus_visit",
    },
    {
      type: "meeting",
      outcome: "positive",
      notes: "Met with parents - very supportive of enrollment",
      nextAction: "Fast-track application process",
      interactionTag: "parent_meeting",
    },

    // 🟡 MEDIUM PRIORITY TEMPLATES - Neutral Activities
    {
      type: "whatsapp_message",
      outcome: "neutral",
      notes: "Shared program brochures and fee structure",
      nextAction: "Follow up in 2 days",
      interactionTag: "document_shared",
    },
    {
      type: "phone",
      outcome: "neutral",
      notes: "Scheduled follow-up call for next week",
      nextAction: "Call on scheduled date",
      interactionTag: "follow_up_scheduled",
    },
    {
      type: "whatsapp_message",
      outcome: "neutral",
      notes: "Sent application deadline reminder",
      nextAction: "Monitor for application submission",
      interactionTag: "reminder_sent",
    },
    {
      type: "phone",
      outcome: "neutral",
      notes: "Lead wants to defer to next semester",
      nextAction: "Add to next intake list",
      interactionTag: "deferred",
    },

    // 🔴 LOW PRIORITY TEMPLATES - Negative Conversion Signals
    {
      type: "phone",
      outcome: "negative",
      notes: "Only interested if scholarship available",
      nextAction: "Evaluate scholarship eligibility carefully",
      interactionTag: "scholarship_info",
    },
    {
      type: "whatsapp_message",
      outcome: "negative",
      notes: "Asking about payment plans - financial constraints",
      nextAction: "Discuss payment options but prioritize other leads",
      interactionTag: "payment_plan_inquiry",
    },
    {
      type: "phone",
      outcome: "negative",
      notes: "Not interested - decided not to proceed",
      nextAction: "Close lead",
      interactionTag: "lead_closed",
    },

    // Standard communication templates
    {
      type: "phone",
      outcome: "neutral",
      notes: "Called - No Answer",
      nextAction: "Try again later",
    },
    {
      type: "whatsapp_message",
      outcome: "positive",
      notes: "Responded to inquiry - showing interest",
      nextAction: "Schedule phone call",
    },
  ];

  const filteredInteractions = interactions.filter((interaction) => {
    if (filter === "all") return true;
    return interaction.type === filter;
  });

  const handleAddInteraction = async () => {
    if (!newInteraction.notes.trim()) {
      setError("Interaction notes are required");
      return;
    }

    try {
      setAddingInteraction(true);
      setError(null);

      const interactionData = {
        ...newInteraction,
        timestamp: new Date().toISOString(),
      };

      const response = await leadService.addInteraction(
        leadId,
        interactionData
      );

      if (response.success) {
        // Reload interactions to get the updated list
        await loadInteractions();
        setOpenDialog(false);
        setNewInteraction({
          type: "phone",
          direction: "outgoing",
          outcome: "neutral",
          notes: "",
          nextAction: "",
          duration: "",
          subject: "",
          interactionTag: "",
        });
      } else {
        setError(response.error || "Failed to add interaction");
      }
    } catch (err) {
      console.error("Error adding interaction:", err);
      setError(err.message || "Failed to add interaction");
    } finally {
      setAddingInteraction(false);
    }
  };

  const applyTemplate = (template) => {
    setNewInteraction({
      ...newInteraction,
      ...template,
    });
  };

  const getInteractionIcon = (type) => {
    const InteractionIcon = interactionTypes[type]?.icon || PhoneIcon;
    return <InteractionIcon />;
  };

  const getOutcomeIcon = (outcome) => {
    const OutcomeIcon = outcomeTypes[outcome]?.icon || TrendingFlatIcon;
    return <OutcomeIcon />;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Interaction Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {leadName} -{" "}
            {loading ? "Loading..." : `${interactions.length} interactions`}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            size="small"
            disabled={loading}
          >
            Filter
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size="small"
            disabled={loading}
          >
            Log Interaction
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Quick Stats */}
      {!loading && interactions.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Chip
            icon={<TrendingUpIcon />}
            label={`${
              interactions.filter((i) => i.outcome === "positive").length
            } Positive`}
            color="success"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<PhoneIcon />}
            label={`${
              interactions.filter((i) => i.type === "phone").length
            } Calls`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<EmailIcon />}
            label={`${
              interactions.filter((i) => i.type === "email").length
            } Emails`}
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Stack>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setFilter("all");
            setFilterAnchorEl(null);
          }}
        >
          All Interactions
        </MenuItem>
        <Divider />
        {Object.entries(interactionTypes).map(([key, type]) => (
          <MenuItem
            key={key}
            onClick={() => {
              setFilter(key);
              setFilterAnchorEl(null);
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {React.createElement(type.icon)}
              {type.label}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Timeline */}
      <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
        {filteredInteractions.map((interaction, index) => (
          <React.Fragment key={interaction.id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                py: 2,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Avatar
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: `${
                          outcomeTypes[interaction.outcome]?.color
                        }.main`,
                      }}
                    >
                      {React.createElement(
                        outcomeTypes[interaction.outcome]?.icon,
                        {
                          sx: { fontSize: 10 },
                        }
                      )}
                    </Avatar>
                  }
                >
                  <Avatar
                    sx={{
                      bgcolor: `${
                        interactionTypes[interaction.type]?.color
                      }.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getInteractionIcon(interaction.type)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      {interactionTypes[interaction.type]?.label}
                    </Typography>
                    <Chip
                      label={interaction.direction}
                      size="small"
                      variant="filled"
                      color="default"
                      sx={{
                        fontSize: "0.7rem",
                        height: 20,
                        color: "text.primary",
                        backgroundColor: "grey.200",
                      }}
                    />
                    {interaction.duration && (
                      <Chip
                        icon={<TimeIcon />}
                        label={formatDuration(interaction.duration)}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{
                          fontSize: "0.7rem",
                          height: 20,
                          color: "white",
                          "& .MuiChip-icon": {
                            color: "white",
                          },
                        }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(interaction.timestamp)} ago
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    {interaction.subject && (
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 0.5 }}
                      >
                        📧 {interaction.subject}
                      </Typography>
                    )}

                    <Typography
                      variant="body2"
                      sx={{ mb: 1, color: "text.primary" }}
                    >
                      💬 {interaction.notes}
                    </Typography>

                    {interaction.interactionTag && (
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={
                            interactionTags[interaction.interactionTag]?.label
                          }
                          color={
                            interactionTags[interaction.interactionTag]?.color
                          }
                          size="small"
                          variant="filled"
                          sx={{
                            fontSize: "0.7rem",
                            color: "white",
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                    )}

                    {interaction.attachments && (
                      <Box sx={{ mb: 1 }}>
                        {interaction.attachments.map((file, idx) => (
                          <Chip
                            key={idx}
                            label={`📎 ${file}`}
                            size="small"
                            variant="filled"
                            color="default"
                            sx={{
                              mr: 0.5,
                              fontSize: "0.7rem",
                              backgroundColor: "grey.200",
                              color: "text.primary",
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {interaction.nextAction && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <ScheduleIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          <strong>Next:</strong> {interaction.nextAction}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <Chip
                        icon={getOutcomeIcon(interaction.outcome)}
                        label={outcomeTypes[interaction.outcome]?.label}
                        size="small"
                        color={outcomeTypes[interaction.outcome]?.color}
                        variant="filled"
                        sx={{
                          color: "white",
                          fontWeight: 500,
                          "& .MuiChip-icon": {
                            color: "white",
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        by {interaction.agent} •{" "}
                        {format(
                          interaction.timestamp,
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </Typography>
                    </Box>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            {index < filteredInteractions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {/* No interactions message */}
      {!loading && filteredInteractions.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No interactions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filter === "all"
              ? "Start logging interactions to track your communication with this lead"
              : `No ${interactionTypes[
                  filter
                ]?.label.toLowerCase()} interactions found`}
          </Typography>
        </Box>
      )}

      {/* Add Interaction Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log New Interaction</DialogTitle>
        <DialogContent>
          {/* Quick Templates */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Quick Templates:
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {quickTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => applyTemplate(template)}
                  startIcon={getInteractionIcon(template.type)}
                >
                  {template.notes}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <FormControl fullWidth>
              <InputLabel>Interaction Type</InputLabel>
              <Select
                value={newInteraction.type}
                label="Interaction Type"
                onChange={(e) =>
                  setNewInteraction({ ...newInteraction, type: e.target.value })
                }
              >
                {Object.entries(interactionTypes).map(([key, type]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {React.createElement(type.icon)}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Direction</InputLabel>
              <Select
                value={newInteraction.direction}
                label="Direction"
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    direction: e.target.value,
                  })
                }
              >
                <MenuItem value="outgoing">Outgoing</MenuItem>
                <MenuItem value="incoming">Incoming</MenuItem>
              </Select>
            </FormControl>

            {newInteraction.type === "phone" && (
              <TextField
                label="Duration (minutes)"
                type="number"
                value={newInteraction.duration}
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    duration: e.target.value,
                  })
                }
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Outcome</InputLabel>
              <Select
                value={newInteraction.outcome}
                label="Outcome"
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    outcome: e.target.value,
                  })
                }
              >
                {Object.entries(outcomeTypes).map(([key, outcome]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {React.createElement(outcome.icon)}
                      {outcome.label} - {outcome.description}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Interaction Tag (Optional)</InputLabel>
              <Select
                value={newInteraction.interactionTag}
                label="Interaction Tag (Optional)"
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    interactionTag: e.target.value,
                  })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {Object.entries(interactionTags).map(([key, tag]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={
                          tag.priority === "high"
                            ? "🟢 HIGH"
                            : tag.priority === "medium"
                            ? "🟡 MED"
                            : "🔴 LOW"
                        }
                        color={tag.color}
                        size="small"
                        variant="outlined"
                      />
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {tag.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tag.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Interaction Notes"
            multiline
            rows={3}
            fullWidth
            value={newInteraction.notes}
            onChange={(e) =>
              setNewInteraction({ ...newInteraction, notes: e.target.value })
            }
            sx={{ mt: 2 }}
            placeholder="Describe what happened during this interaction..."
          />

          <TextField
            label="Next Action Required"
            fullWidth
            value={newInteraction.nextAction}
            onChange={(e) =>
              setNewInteraction({
                ...newInteraction,
                nextAction: e.target.value,
              })
            }
            sx={{ mt: 2 }}
            placeholder="What should be done next?"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={addingInteraction}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddInteraction}
            variant="contained"
            disabled={!newInteraction.notes.trim() || addingInteraction}
            startIcon={
              addingInteraction ? <CircularProgress size={16} /> : null
            }
          >
            {addingInteraction ? "Adding..." : "Log Interaction"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractionTimeline;
