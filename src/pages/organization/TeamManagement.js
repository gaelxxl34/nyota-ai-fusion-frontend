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
  CircularProgress,
  Alert,
  Snackbar,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import TeamMemberDialog from "../../components/team/TeamMemberDialog";
import DeleteConfirmationDialog from "../../components/common/DeleteConfirmationDialog";
import { teamService } from "../../services/teamService";

const jobRoles = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "manager", label: "Manager" },
];

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const response = await teamService.getTeamMembers();

      // Initialize teamMembers as an empty array if response or members is undefined
      setTeamMembers(response?.members || []);

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
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

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
      setLoading(true);
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
        showNotification(
          `Team member ${selectedMember ? "updated" : "added"} successfully`
        );
        fetchTeamMembers();
        setOpenDialog(false);
      } else {
        showNotification(response.message, "error");
      }
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const response = await teamService.deleteTeamMember(memberToDelete.id);
      if (response.success) {
        showNotification("Team member deleted successfully");
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
      setLoading(false);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const getRoleLabel = (roleValue) => {
    const role = jobRoles.find((r) => r.value === roleValue);
    return role?.label || roleValue;
  };

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
  const displayMembers = Array.isArray(teamMembers) ? teamMembers : [];

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
            <Typography variant="h4">Team Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMember}
            >
              Add Team Member
            </Button>
          </>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Job Role</TableCell>
              <TableCell>Responsibilities</TableCell>
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
                      No team members found
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddMember}
                      sx={{ mt: 1 }}
                    >
                      Add Your First Team Member
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              displayMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {getRoleLabel(member.jobRole)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {member.permissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.status}
                      color={member.status === "active" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
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
                    >
                      <DeleteIcon />
                    </IconButton>
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
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team Member"
        content="Are you sure you want to delete this team member? This action cannot be undone."
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
