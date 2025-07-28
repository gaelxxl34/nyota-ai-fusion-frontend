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
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import SourceIcon from "../common/SourceIcon";

const LeadsCardView = ({ leads, getStatusColor, formatDate, onViewLead }) => {
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
                    {lead.program || "No program"}
                  </Typography>
                </Box>
                <Chip
                  label={lead.status?.replace(/_/g, " ")}
                  color={getStatusColor(lead.status)}
                  size="small"
                />
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
