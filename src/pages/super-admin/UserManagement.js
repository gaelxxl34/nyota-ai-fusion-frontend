import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Skeleton,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import { superAdminService } from "../../services/superAdminService";
import { useAuth } from "../../contexts/AuthContext";

const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Available roles for IUEA system
  const ROLES = [
    { value: "superAdmin", label: "Super Admin", color: "error" },
    { value: "admin", label: "Admin", color: "primary" },
    { value: "admissionAdmin", label: "Admission Admin", color: "secondary" },
    { value: "marketingAgent", label: "Marketing Agent", color: "info" },
    {
      value: "admissionAgent",
      label: "Admission Agent",
      color: "warning",
    },
  ];

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin",
    password: "000000",
    confirmPassword: "000000",
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper function to convert Firestore timestamp to DD/MM/YYYY format
  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      let date;

      // Handle Firestore Timestamp object
      if (timestamp && typeof timestamp === "object" && timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Handle Firestore Timestamp with seconds and nanoseconds
      else if (
        timestamp &&
        typeof timestamp === "object" &&
        timestamp.seconds
      ) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle regular timestamp or string
      else {
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle dialog open/close
  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        password: "",
        confirmPassword: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "admin",
        password: "000000",
        confirmPassword: "000000",
      });
    }
    setOpenDialog(true);
    setError("");
    setSuccess("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "admin",
      password: "000000",
      confirmPassword: "000000",
    });
  };

  // Handle save (create or update)
  const handleSave = async () => {
    try {
      setError("");

      // Validation
      if (!formData.name || !formData.email || !formData.role) {
        setError("Name, email, and role are required");
        return;
      }

      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      };

      if (!editingUser) {
        dataToSend.password = "000000";
      }

      if (editingUser) {
        await superAdminService.updateUser(editingUser.id, dataToSend);
        setSuccess("User updated successfully");
      } else {
        await superAdminService.createUser(dataToSend);
        setSuccess("User created successfully");
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      setError(error.response?.data?.error || "Failed to save user");
    }
  };

  // Handle delete
  const handleDelete = async (userToDelete) => {
    // Prevent self-deletion
    if (userToDelete.id === user?.uid || userToDelete.email === user?.email) {
      setError("You cannot delete your own account!");
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})?

This will permanently:
• Remove their account from the system
• Delete all their authentication data
• Remove all their data from Firestore database

This action cannot be undone!`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        await superAdminService.deleteUser(userToDelete.id);
        setSuccess(`User "${userToDelete.name}" has been successfully deleted`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setError(
          error.response?.data?.message ||
            "Failed to delete user. The user may have associated data that needs to be removed first."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle reset password
  const handleResetPassword = async (userId) => {
    if (
      window.confirm("Are you sure you want to reset this user's password?")
    ) {
      try {
        const result = await superAdminService.resetUserPassword(userId);
        setSuccess(
          `Password reset successfully. New password: ${result.newPassword}`
        );
        handleMenuClose();
      } catch (error) {
        console.error("Error resetting password:", error);
        setError("Failed to reset password");
      }
    }
  };

  // Menu handlers
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Get role config
  const getRoleConfig = (role) => {
    return ROLES.find((r) => r.value === role) || ROLES[4]; // Default to team member
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
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
          <Typography variant="h4" fontWeight="bold">
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage IUEA system users and their roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ textTransform: "none" }}
        >
          Add New User
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Search and Actions Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            placeholder="Search by name, email, or role..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={fetchUsers} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Details</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" width={200} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={150} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={150} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={80} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={100} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width={100} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}
                    >
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tableUser) => (
                    <TableRow key={tableUser.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {tableUser.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {tableUser.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <ShieldIcon fontSize="small" color="action" />
                          <Chip
                            label={getRoleConfig(tableUser.role).label}
                            size="small"
                            color={getRoleConfig(tableUser.role).color}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {tableUser.email}
                            </Typography>
                          </Box>
                          {tableUser.phone && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {tableUser.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tableUser.status || "Active"}
                          size="small"
                          color={
                            tableUser.status === "Active"
                              ? "success"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatFirestoreDate(tableUser.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(tableUser)}
                              disabled={
                                tableUser.id === user?.uid &&
                                tableUser.role === "superAdmin"
                              }
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              tableUser.id === user?.uid ||
                              tableUser.email === user?.email
                                ? "Cannot delete your own account"
                                : "Delete user permanently"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(tableUser)}
                                disabled={
                                  tableUser.id === user?.uid ||
                                  tableUser.email === user?.email ||
                                  loading
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="More actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, tableUser)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? "Edit User" : "Create New User"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              fullWidth
              required
              disabled={editingUser !== null}
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                label="Role"
              >
                {ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ShieldIcon fontSize="small" />
                      {role.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!editingUser && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "info.main", borderRadius: 1 }}>
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ fontWeight: "medium" }}
                >
                  📝 Default Password: 000000
                </Typography>
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ opacity: 0.8 }}
                >
                  Users can change their password after first login
                </Typography>
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleResetPassword(selectedUser?.id)}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserManagement;
