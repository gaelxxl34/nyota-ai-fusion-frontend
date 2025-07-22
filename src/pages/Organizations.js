import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import OrganizationDialog from "../components/organizations/OrganizationDialog";
import { organizationService } from "../services/organizationService";

const Organizations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    fetchOrganizations();
    // Set up polling for real-time updates
    const interval = setInterval(fetchOrganizations, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      setNotification({
        open: true,
        message: "Failed to load organizations",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrg = () => {
    setSelectedOrg(null); // Reset selected org for new entry
    setOpenDialog(true);
  };

  const handleEditOrg = (org) => {
    setSelectedOrg(org);
    setOpenDialog(true);
  };

  const handleDeleteOrg = async (orgId) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await organizationService.deleteOrganization(orgId);
        setNotification({
          open: true,
          message: "Organization deleted successfully",
          type: "success",
        });
        await fetchOrganizations(); // Refresh the list
      } catch (error) {
        setNotification({
          open: true,
          message: error.message,
          type: "error",
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrg(null);
  };

  const handleSaveOrg = async (formData) => {
    try {
      let result;
      if (selectedOrg) {
        // Update existing organization
        result = await organizationService.updateOrganization(
          selectedOrg.id,
          formData
        );
      } else {
        // Create new organization
        result = await organizationService.registerOrganization(formData);
      }

      if (result.success) {
        setNotification({
          open: true,
          message:
            result.message ||
            `Organization ${selectedOrg ? "updated" : "created"} successfully`,
          type: "success",
        });
        await fetchOrganizations(); // Refresh immediately after update
        handleCloseDialog();
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        type: "error",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    let date;

    // Handle Firestore timestamp objects
    if (dateString && typeof dateString === "object" && dateString._seconds) {
      // Firestore timestamp with _seconds and _nanoseconds
      date = new Date(
        dateString._seconds * 1000 + (dateString._nanoseconds || 0) / 1000000
      );
    } else if (
      dateString &&
      typeof dateString === "object" &&
      dateString.toDate
    ) {
      // Firestore timestamp with toDate() method
      date = dateString.toDate();
    } else {
      // Regular string or Date object
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format as time dd/mm/yy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  return (
    <Box>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddOrg}
        >
          Add Organization
        </Button>
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search organizations..."
            variant="outlined"
            size="small"
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Add more filters here */}
        </Box>
      </Paper>

      {/* Organizations Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : organizations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No organizations found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddOrg}
            sx={{ mt: 2 }}
          >
            Add Your First Organization
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BusinessIcon color="primary" />
                      {org.name}
                    </Box>
                  </TableCell>
                  <TableCell>{org.industry}</TableCell>
                  <TableCell>{org.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={org.status}
                      color={org.status === "active" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={org.subscription}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(org.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditOrg(org)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteOrg(org.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Organization Dialog */}
      <OrganizationDialog
        open={openDialog}
        handleClose={handleCloseDialog}
        organization={selectedOrg}
        onSave={handleSaveOrg}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.type}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Organizations;
