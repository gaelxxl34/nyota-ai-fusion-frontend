import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Facebook as FacebookIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Archive as ArchiveIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

// Add custom CSS styles for aggressive text color override
const customStyles = `
  .form-details-dialog * {
    color: #333333 !important;
  }
  .form-details-dialog .MuiTypography-root {
    color: #333333 !important;
  }
  .form-details-dialog .MuiListItemText-primary {
    color: #333333 !important;
  }
  .form-details-dialog .MuiListItemText-secondary {
    color: #666666 !important;
  }
  .form-details-dialog .MuiTableCell-root {
    color: #333333 !important;
  }
  .form-details-dialog .field-type {
    color: #1976d2 !important;
  }
`;

const FormDetailsDialog = ({ open, onClose, selectedForm, formatDate }) => {
  const getStatusChip = (status) => {
    const statusProps = {
      ACTIVE: { color: "success", icon: <CheckCircleIcon /> },
      ARCHIVED: { color: "default", icon: <ArchiveIcon /> },
      PAUSED: { color: "warning", icon: <ErrorIcon /> },
    };

    const props = statusProps[status] || { color: "default", icon: null };

    return (
      <Chip label={status} color={props.color} size="small" icon={props.icon} />
    );
  };

  const formatFieldData = (fieldData) => {
    if (!fieldData || !Array.isArray(fieldData)) return "N/A";

    return fieldData.map((field) => ({
      name: field.name,
      value: field.values?.[0] || "N/A",
    }));
  };

  return (
    <>
      <style>{customStyles}</style>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "form-details-dialog",
          sx: {
            backgroundColor: "#ffffff !important",
            color: "#333333 !important",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              style={{ color: "#333333 !important", fontWeight: "bold" }}
            >
              {selectedForm?.name}
            </Typography>
            {selectedForm && getStatusChip(selectedForm.status)}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#ffffff", pt: 3 }}>
          {selectedForm && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ color: "#333333", mb: 2 }}
                  >
                    Form Information
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <FacebookIcon sx={{ color: "#1877F2" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Form ID"
                        secondary={selectedForm.id}
                        primaryTypographyProps={{
                          sx: { color: "#333333", fontWeight: "medium" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "#666666" },
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <BusinessIcon sx={{ color: "#666666" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Page"
                        secondary={selectedForm.pageName}
                        primaryTypographyProps={{
                          sx: { color: "#333333", fontWeight: "medium" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "#666666" },
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <DateRangeIcon sx={{ color: "#666666" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Created"
                        secondary={formatDate(selectedForm.created_time)}
                        primaryTypographyProps={{
                          sx: { color: "#333333", fontWeight: "medium" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "#666666" },
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <PeopleIcon sx={{ color: "#666666" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Leads"
                        secondary={selectedForm.leads_count || 0}
                        primaryTypographyProps={{
                          sx: { color: "#333333", fontWeight: "medium" },
                        }}
                        secondaryTypographyProps={{
                          sx: { color: "#666666" },
                        }}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ color: "#333333", mb: 2 }}
                  >
                    Form Fields
                  </Typography>
                  {selectedForm.questions &&
                  selectedForm.questions.length > 0 ? (
                    <List dense>
                      {selectedForm.questions.map((question, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={question.key}
                            secondary={question.type || "text"}
                            primaryTypographyProps={{
                              sx: {
                                color: "#333333",
                                fontWeight: "500",
                                fontSize: "0.875rem",
                              },
                            }}
                            secondaryTypographyProps={{
                              sx: {
                                color: "#1976d2",
                                fontWeight: "600",
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#666666" }}>
                      No form fields available
                    </Typography>
                  )}
                </Grid>

                {selectedForm.recentLeads &&
                  selectedForm.recentLeads.length > 0 && (
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ color: "#333333", mb: 2 }}
                      >
                        Recent Leads ({selectedForm.recentLeads.length})
                      </Typography>
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ backgroundColor: "#ffffff" }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{ color: "#333333", fontWeight: "bold" }}
                              >
                                Created
                              </TableCell>
                              <TableCell
                                sx={{ color: "#333333", fontWeight: "bold" }}
                              >
                                Contact Info
                              </TableCell>
                              <TableCell
                                sx={{ color: "#333333", fontWeight: "bold" }}
                              >
                                Campaign
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedForm.recentLeads.map((lead) => {
                              const fieldData = formatFieldData(
                                lead.field_data
                              );
                              const emailField = fieldData.find((field) =>
                                field.name.toLowerCase().includes("email")
                              );
                              const nameField = fieldData.find(
                                (field) =>
                                  field.name.toLowerCase().includes("name") ||
                                  field.name.toLowerCase().includes("first")
                              );

                              return (
                                <TableRow key={lead.id}>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#333333" }}
                                    >
                                      {formatDate(lead.created_time)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      {nameField && (
                                        <Typography
                                          variant="body2"
                                          sx={{ color: "#333333" }}
                                        >
                                          {nameField.value}
                                        </Typography>
                                      )}
                                      {emailField && (
                                        <Typography
                                          variant="body2"
                                          sx={{ color: "#666666" }}
                                        >
                                          {emailField.value}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#333333" }}
                                    >
                                      {lead.campaign_id || "N/A"}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#ffffff", p: 3 }}>
          <Button
            onClick={onClose}
            sx={{
              color: "#1976d2",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FormDetailsDialog;
