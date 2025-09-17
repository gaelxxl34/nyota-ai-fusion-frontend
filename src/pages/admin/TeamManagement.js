import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
  Snackbar,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import TeamMemberDialog from "../../components/team/TeamMemberDialog";
import DeleteConfirmationDialog from "../../components/common/DeleteConfirmationDialog";
import { teamService } from "../../services/teamService";
import { ROLES, PERMISSIONS } from "../../config/roles.config";
import { useRolePermissions } from "../../hooks/useRolePermissions";
import { useAuth } from "../../contexts/AuthContext";

const TeamManagement = () => {
  const { checkPermission, role } = useRolePermissions();
  const { user } = useAuth();
  const canManageTeam = checkPermission(PERMISSIONS.MANAGE_TEAM);
  const isAdmissionAdmin = role === "admissionAdmin";
  const isAdmin = role === "admin";

  const [teamMembers, setTeamMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching team members...");
      console.log("Current user role:", role);
      console.log("Current user:", user);
      console.log("isAdmin:", isAdmin);
      console.log("isAdmissionAdmin:", isAdmissionAdmin);
      console.log("canManageTeam:", canManageTeam);

      const response = await teamService.getTeamMembers();
      console.log("Team members response:", response);

      // Initialize teamMembers as an empty array if response or members is undefined
      let members = response?.members || [];
      console.log("All members before filtering:", members.length);
      console.log(
        "Member roles breakdown:",
        members.map((m) => ({ name: m.name, role: m.role, id: m.id || m.uid }))
      );

      // If admin and no members found, it might be due to response format mismatch
      if (isAdmin && members.length === 0 && response?.data?.data) {
        console.log("Using alternative data format from response");
        members = response.data.data;
      }

      console.log("Final filtered members:", members.length, members);
      setTeamMembers(members);

      if (!response.success) {
        showNotification(
          response.message || "Failed to fetch team members",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      showNotification(
        error.message || "Failed to fetch team members",
        "error"
      );
      setTeamMembers([]); // Ensure we set an empty array on error
    } finally {
      setLoading(false);
    }
  }, [isAdmissionAdmin, isAdmin, user, canManageTeam, role]);

  useEffect(() => {
    // Store user role in localStorage for teamService to use
    if (role) {
      localStorage.setItem("userRole", role);
    }

    fetchTeamMembers();

    // Update page title based on role
    if (isAdmissionAdmin) {
      document.title = "Admission Team Management";
    } else if (isAdmin) {
      document.title = "Marketing Team Management";
    } else {
      document.title = "Team Management";
    }
  }, [fetchTeamMembers, isAdmissionAdmin, isAdmin, role]);

  const handleAddMember = () => {
    setSelectedMember(null);
    setOpenDialog(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setOpenDialog(true);
  };

  const handleDeleteMember = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleSaveMember = async (memberData) => {
    try {
      setSavingMember(true);
      let response;

      if (selectedMember) {
        response = await teamService.updateTeamMember(
          selectedMember.id,
          memberData
        );
      } else {
        response = await teamService.addTeamMember(memberData);
      }

      if (response.success) {
        // For new members, show the password in the message
        if (
          !selectedMember &&
          response.message &&
          response.message.includes("password:")
        ) {
          showNotification(response.message, "success");
        } else {
          showNotification(
            `Team member ${selectedMember ? "updated" : "added"} successfully`
          );
        }
        await fetchTeamMembers(); // Wait for refresh
        setOpenDialog(false);
      } else {
        showNotification(
          response.message || "Failed to save team member",
          "error"
        );
      }
    } catch (error) {
      showNotification(error.message || "An error occurred", "error");
    } finally {
      setSavingMember(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeletingMember(true);
      const response = await teamService.deleteTeamMember(memberToDelete.id);
      if (response.success) {
        // Check if there's a warning about authentication
        if (response.warning) {
          showNotification(
            `Team member removed from organization. ${response.warning}`,
            "warning"
          );
        } else {
          showNotification(
            response.message || "Team member deleted successfully"
          );
        }
        fetchTeamMembers();
      } else {
        showNotification(
          response.message || "Failed to delete team member",
          "error"
        );
      }
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setDeletingMember(false);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const getRoleLabel = (roleValue) => {
    const role = ROLES[roleValue];
    return role?.name || roleValue;
  };

  const getRoleIcon = (roleValue) => {
    if (roleValue === "admin" || roleValue === "admissionAdmin") {
      return <ShieldIcon fontSize="small" color="primary" />;
    }
    return <PersonIcon fontSize="small" />;
  };

  // Filter team members based on search
  const filteredMembers = teamMembers.filter((member) => {
    // Filter by search term
    const matchesSearch = searchTerm
      ? member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesSearch;
  });

  // Skeleton loading component for table rows
  const SkeletonTableRows = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton
              variant="text"
              width={`${60 + index * 5}%`}
              height={24}
              animation="wave"
            />
          </TableCell>
          <TableCell>
            <Skeleton
              variant="text"
              width={`${70 + index * 3}%`}
              height={24}
              animation="wave"
            />
          </TableCell>
          <TableCell>
            <Skeleton
              variant="rectangular"
              width={80 + index * 10}
              height={24}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </TableCell>
          <TableCell>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Skeleton
                variant="rectangular"
                width={60}
                height={20}
                sx={{ borderRadius: 1 }}
                animation="wave"
              />
              <Skeleton
                variant="rectangular"
                width={80}
                height={20}
                sx={{ borderRadius: 1 }}
                animation="wave"
              />
              {index % 2 === 0 && (
                <Skeleton
                  variant="rectangular"
                  width={70}
                  height={20}
                  sx={{ borderRadius: 1 }}
                  animation="wave"
                />
              )}
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton
              variant="rectangular"
              width={60}
              height={24}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                animation="wave"
              />
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                animation="wave"
              />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  // Ensure teamMembers is always an array
  const displayMembers = Array.isArray(filteredMembers) ? filteredMembers : [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={200} height={40} animation="wave" />
            <Skeleton
              variant="rectangular"
              width={150}
              height={36}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </>
        ) : (
          <>
            <Typography variant="h4">
              {isAdmissionAdmin
                ? "Admission Team Management"
                : isAdmin
                ? "Marketing Team Management"
                : "Team Management"}
            </Typography>
            {canManageTeam && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddMember}
              >
                {isAdmissionAdmin
                  ? "Add Admission Agent"
                  : isAdmin
                  ? "Add Marketing Agent"
                  : "Add Team Member"}
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Access Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonTableRows />
            ) : displayMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                    >
                      {searchTerm
                        ? "No team members match your search"
                        : "No team members found"}
                    </Typography>
                    {!searchTerm && canManageTeam && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddMember}
                        sx={{ mt: 1 }}
                      >
                        {isAdmissionAdmin
                          ? "Add Your First Admission Agent"
                          : isAdmin
                          ? "Add Your First Marketing Agent"
                          : "Add Your First Team Member"}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              displayMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getRoleIcon(member.role || member.jobRole)}
                      <Typography variant="subtitle2">
                        {getRoleLabel(member.role || member.jobRole)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(member.role || member.jobRole) === "organizationAdmin" ? (
                      <Chip label="Full Access" color="primary" size="small" />
                    ) : (member.role || member.jobRole) === "marketingAgent" ? (
                      <Chip
                        label="Marketing Access"
                        color="info"
                        size="small"
                      />
                    ) : (member.role || member.jobRole) === "admissionAgent" ? (
                      <Chip
                        label="Admissions Access"
                        color="secondary"
                        size="small"
                      />
                    ) : (
                      <Chip label="Custom Access" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.status}
                      color={member.status === "active" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {canManageTeam ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEditMember(member)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMember(member)}
                          disabled={member.id === user?.uid} // Prevent self-deletion
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No actions
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TeamMemberDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveMember}
        member={selectedMember}
        loading={savingMember}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team Member"
        content={
          memberToDelete?.role === "organizationAdmin"
            ? "Warning: You are about to delete an Organization Admin. This will remove them from both the organization and their login access. Make sure there is at least one other admin. This action cannot be undone."
            : "Are you sure you want to delete this team member? They will be removed from the organization and will no longer be able to log in. This action cannot be undone."
        }
        loading={deletingMember}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamManagement;
