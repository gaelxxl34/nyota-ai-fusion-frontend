import React, { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { organizationService } from "../services/organizationService";
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  SupervisedUserCircle as UserIcon,
  AdminPanelSettings as AdminIcon,
  VpnKey as AccessIcon,
} from "@mui/icons-material";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const orgsData = await organizationService.getAllOrganizations();
      setOrganizations(orgsData);

      const usersPromises = orgsData.map((org) =>
        userService.getOrganizationUsers(org.id)
      );
      const usersResults = await Promise.all(usersPromises);

      const combinedUsers = usersResults.flat().map((user) => ({
        ...user,
        organization: orgsData.find((org) => org.id === user.organizationId),
      }));

      setUsers(combinedUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const renderUserRow = (user) => (
    <TableRow
      key={user.id}
      hover
      sx={user.isOrgAdmin ? { bgcolor: "action.hover" } : {}}
    >
      <TableCell>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="body2">
            {user.name || user.email}
            {user.isOrgAdmin && (
              <Chip
                size="small"
                label="Organization Admin"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {user.email}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          icon={user.isOrgAdmin ? <AdminIcon /> : <UserIcon />}
          label={user.role}
          size="small"
          color={user.isOrgAdmin ? "primary" : "default"}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={user.status}
          size="small"
          color={user.status === "active" ? "success" : "default"}
        />
      </TableCell>
      <TableCell>
        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          disabled={user.isOrgAdmin}
          onClick={(e) => handleUserMenuOpen(e, user)}
        >
          <MoreVertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Organization Users
      </Typography>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search organizations or users..."
              variant="outlined"
              size="small"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Organization Status</InputLabel>
              <Select
                value={organizationFilter}
                label="Organization Status"
                onChange={(e) => setOrganizationFilter(e.target.value)}
              >
                <MenuItem value="all">All Organizations</MenuItem>
                <MenuItem value="active">Active Organizations</MenuItem>
                <MenuItem value="inactive">Inactive Organizations</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Organizations and Their Users */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {organizations.map((org) => (
            <Accordion
              key={org.id}
              expanded={expandedOrg === org.id}
              onChange={() =>
                setExpandedOrg(expandedOrg === org.id ? null : org.id)
              }
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Typography variant="h6">{org.name}</Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Badge
                      badgeContent={
                        users.filter(
                          (user) =>
                            user.organizationId === org.id &&
                            user.status === "active"
                        ).length
                      }
                      color="success"
                    >
                      <Chip
                        label={`Total Users: ${
                          users.filter((user) => user.organizationId === org.id)
                            .length
                        }`}
                        variant="outlined"
                      />
                    </Badge>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users
                        .filter((user) => user.organizationId === org.id)
                        .sort((a, b) => (b.isOrgAdmin ? 1 : -1))
                        .map(renderUserRow)}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={handleUserMenuClose}>View Profile</MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <AccessIcon fontSize="small" sx={{ mr: 1 }} />
          Manage Access
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose} sx={{ color: "error.main" }}>
          Suspend Access
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Users;
