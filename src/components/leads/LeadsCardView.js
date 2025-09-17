import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  Button,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  WhatsApp as WhatsAppIcon,
  Videocam as VideocamIcon,
  Person as PersonIcon,
  Sms as SmsIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import SourceIcon from "../common/SourceIcon";

const LeadsCardView = ({ leads, getStatusColor, formatDate, onViewLead }) => {
  // Helper function to get interaction icon
  const getInteractionIcon = (type) => {
    switch (type) {
      case "PHONE_CALL":
        return PhoneIcon;
      case "WHATSAPP_MESSAGE":
        return WhatsAppIcon;
      case "WHATSAPP_CALL":
        return VideocamIcon;
      case "EMAIL":
        return EmailIcon;
      case "MEETING":
        return PersonIcon;
      case "SMS":
        return SmsIcon;
      default:
        return PhoneIcon;
    }
  };

  // Helper function to get outcome icon and color
  const getOutcomeInfo = (outcome) => {
    switch (outcome) {
      case "positive":
        return { icon: TrendingUpIcon, color: "success" };
      case "negative":
        return { icon: TrendingDownIcon, color: "error" };
      case "neutral":
      default:
        return { icon: TrendingFlatIcon, color: "warning" };
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
      default:
        return "default";
    }
  };

  // Helper function to format interaction tag for display
  const formatInteractionTag = (tag) => {
    if (!tag) return "";
    return tag
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    let date;
    if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };
  return (
    <Grid container spacing={3}>
      {leads.map((lead) => (
        <Grid item xs={12} sm={6} md={4} key={lead.id}>
          <Card sx={{ height: "100%", position: "relative" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: getStatusColor(lead.status) + ".light",
                    mr: 2,
                  }}
                >
                  {lead.name?.charAt(0)?.toUpperCase() || "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" noWrap>
                    {lead.name || "N/A"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeof lead.program === "object" && lead.program !== null
                      ? lead.program.name || lead.program.code || "No program"
                      : lead.program || "No program"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Chip
                    label={lead.status?.replace(/_/g, " ")}
                    color={getStatusColor(lead.status)}
                    size="small"
                  />
                  {/* Interaction count indicator */}
                  {lead.interactionSummary?.totalInteractions > 0 && (
                    <Chip
                      label={`${lead.interactionSummary.totalInteractions} interactions`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        borderColor: "primary.main",
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" noWrap>
                    {lead.email || "No email"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {lead.phone || "No phone"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SourceIcon source={lead.source} />
                  <Typography variant="body2">
                    {lead.source?.replace(/_/g, " ") || "Unknown"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(lead.createdAt)}
                  </Typography>
                </Box>

                {/* Interaction Summary Section */}
                {lead.interactionSummary && (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                        pt: 1,
                        borderTop: "1px solid",
                        borderTopColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Latest Interaction:
                      </Typography>
                    </Box>

                    {/* Last Interaction Details */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Interaction Type Icon and Count */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Badge
                          badgeContent={
                            lead.interactionSummary.totalInteractions
                          }
                          color="primary"
                          max={99}
                        >
                          {React.createElement(
                            getInteractionIcon(
                              lead.interactionSummary.lastInteractionType
                            ),
                            { fontSize: "small", color: "action" }
                          )}
                        </Badge>
                        <Typography variant="caption">
                          {formatTimestamp(
                            lead.interactionSummary.lastInteractionDate
                          )}
                        </Typography>
                      </Box>

                      {/* Outcome Indicator */}
                      <Tooltip
                        title={`Outcome: ${lead.interactionSummary.lastInteractionOutcome}`}
                      >
                        <Chip
                          icon={React.createElement(
                            getOutcomeInfo(
                              lead.interactionSummary.lastInteractionOutcome
                            ).icon,
                            { sx: { fontSize: 12 } }
                          )}
                          label={lead.interactionSummary.lastInteractionOutcome}
                          size="small"
                          color={
                            getOutcomeInfo(
                              lead.interactionSummary.lastInteractionOutcome
                            ).color
                          }
                          variant="filled"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            color: "white",
                            "& .MuiChip-icon": { color: "white" },
                          }}
                        />
                      </Tooltip>
                    </Box>

                    {/* Next Action if available */}
                    {lead.interactionSummary.nextFollowUpAction && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ flexGrow: 1 }}
                        >
                          Next: {lead.interactionSummary.nextFollowUpAction}
                        </Typography>
                        {lead.interactionSummary.nextFollowUpPriority && (
                          <Chip
                            icon={<FlagIcon sx={{ fontSize: 10 }} />}
                            label={lead.interactionSummary.nextFollowUpPriority}
                            size="small"
                            color={getPriorityColor(
                              lead.interactionSummary.nextFollowUpPriority
                            )}
                            variant="outlined"
                            sx={{ height: 18, fontSize: "0.6rem" }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Interaction Tags if available */}
                    {(lead.lastInteraction?.interaction?.interactionTag ||
                      lead.interactionSummary?.lastInteractionType) && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {/* Show interaction tag if available from lastInteraction */}
                        {lead.lastInteraction?.interaction?.interactionTag && (
                          <Chip
                            label={formatInteractionTag(
                              lead.lastInteraction.interaction.interactionTag
                            )}
                            size="small"
                            variant="filled"
                            color={
                              lead.lastInteraction.interaction.interactionTag.includes(
                                "application"
                              )
                                ? "success"
                                : lead.lastInteraction.interaction.interactionTag.includes(
                                    "campus_visit"
                                  )
                                ? "info"
                                : lead.lastInteraction.interaction.interactionTag.includes(
                                    "parent_meeting"
                                  )
                                ? "secondary"
                                : "default"
                            }
                            sx={{
                              height: 18,
                              fontSize: "0.6rem",
                              color: "white",
                              maxWidth: "100%",
                            }}
                          />
                        )}

                        {/* Fallback to showing engagement level if no specific tag */}
                        {!lead.lastInteraction?.interaction?.interactionTag &&
                          lead.interactionSummary?.engagementLevel && (
                            <Chip
                              label={`${lead.interactionSummary.engagementLevel} engagement`}
                              size="small"
                              variant="outlined"
                              color={
                                lead.interactionSummary.engagementLevel ===
                                "high"
                                  ? "success"
                                  : lead.interactionSummary.engagementLevel ===
                                    "medium"
                                  ? "warning"
                                  : "default"
                              }
                              sx={{
                                height: 18,
                                fontSize: "0.6rem",
                                maxWidth: "100%",
                              }}
                            />
                          )}
                      </Box>
                    )}
                  </>
                )}
              </Stack>

              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => onViewLead(lead.id)}
                >
                  View
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default LeadsCardView;
