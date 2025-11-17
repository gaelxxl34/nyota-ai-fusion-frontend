import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  NoteAdd as NoteAddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";
import * as suzySheetsApi from "../../services/suzySheetsApi";

const statusPalette = {
  ADMITTED: {
    label: "Admitted",
    bg: "#e3f2fd",
    chip: "#1e88e5",
    dot: "#1976d2",
  },
  ENROLLED: {
    label: "Enrolled",
    bg: "#e8f5e9",
    chip: "#2e7d32",
    dot: "#4caf50",
  },
  DEFERRED: {
    label: "Deferred",
    bg: "#fffde7",
    chip: "#f9a825",
    dot: "#ffeb3b",
  },
  EXPIRED: {
    label: "Expired",
    bg: "#ffebee",
    chip: "#c62828",
    dot: "#f44336",
  },
};

const paymentStatusPalette = {
  PENDING: { label: "Waiting for Payment", color: "warning" },
  PARTIAL: { label: "Partial Payment", color: "info" },
  PAID: { label: "Fully Paid", color: "success" },
  FOLLOW_UP: { label: "Needs Follow-up", color: "secondary" },
};

const statusFilters = ["ALL", "ADMITTED", "ENROLLED", "DEFERRED", "EXPIRED"];

const SuzySheets = () => {
  const { user } = useAuth();

  // Data & Loading state
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);

  // Filter & Search state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastTouchFilter, setLastTouchFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // UI state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch admitted leads on component mount
  useEffect(() => {
    fetchAdmittedLeads();
  }, []);

  const fetchAdmittedLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await suzySheetsApi.getAdmittedLeads();

      if (response.success) {
        setAdmissions(response.data);
        setCached(response.cached);
      } else {
        throw new Error(response.message || "Failed to fetch admitted leads");
      }
    } catch (err) {
      console.error("Error fetching admitted leads:", err);
      setError(err.message || "Failed to load data. Please try again.");
      setSnackbar({
        open: true,
        message: err.message || "Failed to load admitted leads",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAdmittedLeads();
    setSnackbar({
      open: true,
      message: "Data refreshed successfully",
      severity: "success",
    });
  };

  const handleOpenMenu = (event, admission) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmission(admission);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAdmission(null);
  };

  const handleOpenNoteDialog = (admission) => {
    setSelectedAdmission(admission);
    setCurrentNote(admission.notes || "");
    setNoteDialogOpen(true);
  };

  const handleCloseNoteDialog = () => {
    setNoteDialogOpen(false);
    setCurrentNote("");
    setSelectedAdmission(null);
  };

  const handleSaveNote = async () => {
    if (!selectedAdmission) return;

    try {
      const response = await suzySheetsApi.updateLeadNotes(
        selectedAdmission.id,
        currentNote
      );

      if (response.success) {
        // Refresh the data
        await fetchAdmittedLeads();

        setSnackbar({
          open: true,
          message: "Note saved successfully",
          severity: "success",
        });

        handleCloseNoteDialog();
      } else {
        throw new Error(response.message || "Failed to save note");
      }
    } catch (err) {
      console.error("Error saving note:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save note",
        severity: "error",
      });
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedAdmission) return;

    try {
      const response = await suzySheetsApi.updateLeadStatus(
        selectedAdmission.id,
        newStatus
      );

      if (response.success) {
        // Refresh the data
        await fetchAdmittedLeads();

        setSnackbar({
          open: true,
          message: `Status updated to ${newStatus}`,
          severity: "success",
        });

        handleCloseMenu();
      } else {
        throw new Error(response.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to update status",
        severity: "error",
      });
      handleCloseMenu();
    }
  };

  const filteredAdmissions = useMemo(() => {
    let filtered = admissions.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        [item.name, item.regNo, item.program]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Last touch filter
      let matchesLastTouch = true;
      if (lastTouchFilter === "TODAY") {
        matchesLastTouch = item.lastTouchDays < 1;
      } else if (lastTouchFilter === "WEEK") {
        matchesLastTouch = item.lastTouchDays <= 7;
      } else if (lastTouchFilter === "OLD") {
        matchesLastTouch = item.lastTouchDays > 7;
      }

      return matchesStatus && matchesSearch && matchesLastTouch;
    });

    // Sort by most recent first
    return filtered.sort((a, b) => a.lastTouchDays - b.lastTouchDays);
  }, [admissions, statusFilter, searchTerm, lastTouchFilter]);

  const statusSummaries = useMemo(() => {
    return admissions.reduce(
      (acc, admission) => {
        const key = admission.status;
        const statusKey = statusPalette[key] ? key : "ADMITTED";
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 }
    );
  }, [admissions]);

  const renderStatusChip = (status) => {
    const palette = statusPalette[status] || statusPalette.ADMITTED;
    return (
      <Chip
        label={palette.label}
        size="small"
        sx={{
          bgcolor: alpha(palette.dot, 0.1),
          color: palette.chip,
          fontWeight: 600,
          "& .MuiChip-icon": { color: palette.chip },
        }}
      />
    );
  };

  const renderPaymentChip = (paymentStatus) => {
    const palette = paymentStatusPalette[paymentStatus];
    if (!palette) {
      return <Chip label={paymentStatus} size="small" variant="outlined" />;
    }
    return (
      <Chip
        label={palette.label}
        size="small"
        color={palette.color}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  if (
    !user ||
    !["superAdmin", "admissionAdmin", "admin", "admissionAgent"].includes(
      user.role
    )
  ) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You do not have permission to access the Suzy Sheets feature.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 8, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error && admissions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        <Box mb={4}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Suzy Sheets
              </Typography>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                gutterBottom
              >
                Focused view of admitted students so Suzy can chase payments
                with the same color playbook used on the tag import tool.
              </Typography>
            </Box>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                color="primary"
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { boxShadow: 2 },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<FilterListIcon />}
              label={`${filteredAdmissions.length} currently visible`}
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            {cached && (
              <Chip
                label="Cached data"
                variant="outlined"
                color="info"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Stack>
        </Box>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          {statusFilters
            .filter((key) => key !== "ALL")
            .map((status) => {
              const palette = statusPalette[status];
              const count = statusSummaries[status] || 0;
              return (
                <Grid item xs={12} sm={6} md={3} key={status}>
                  <Card
                    sx={{
                      borderTop: `4px solid ${palette.dot}`,
                      bgcolor: palette.bg,
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            {palette.label}
                          </Typography>
                          <Typography variant="h4" fontWeight={700} mt={1}>
                            {count}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: palette.dot,
                            mt: 1,
                          }}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              size="small"
              placeholder="Search by name, reg no. or programme"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", md: 320 } }}
            />

            <Stack direction="column" spacing={1.5} flex={1}>
              {/* Status Filters */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ alignSelf: "center", mr: 1 }}
                >
                  Status:
                </Typography>
                {statusFilters.map((status) => {
                  if (status === "ALL") {
                    return (
                      <Chip
                        key={status}
                        label="All"
                        clickable
                        size="small"
                        variant={statusFilter === "ALL" ? "filled" : "outlined"}
                        color={statusFilter === "ALL" ? "primary" : "default"}
                        onClick={() => setStatusFilter("ALL")}
                        sx={{ fontWeight: 500 }}
                      />
                    );
                  }
                  const palette = statusPalette[status];
                  return (
                    <Chip
                      key={status}
                      label={palette.label}
                      onClick={() => setStatusFilter(status)}
                      clickable
                      size="small"
                      variant={statusFilter === status ? "filled" : "outlined"}
                      sx={{
                        fontWeight: 500,
                        bgcolor:
                          statusFilter === status
                            ? alpha(palette.dot, 0.15)
                            : "inherit",
                        color:
                          statusFilter === status
                            ? palette.chip
                            : "text.primary",
                        borderColor: palette.dot,
                        "&:hover": { bgcolor: alpha(palette.dot, 0.12) },
                      }}
                    />
                  );
                })}
              </Stack>

              {/* Last Touch Filters */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ alignSelf: "center", mr: 1 }}
                >
                  Last Contact:
                </Typography>
                <Chip
                  label="All Time"
                  clickable
                  size="small"
                  variant={lastTouchFilter === "ALL" ? "filled" : "outlined"}
                  color={lastTouchFilter === "ALL" ? "primary" : "default"}
                  onClick={() => setLastTouchFilter("ALL")}
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label="Today"
                  clickable
                  size="small"
                  variant={lastTouchFilter === "TODAY" ? "filled" : "outlined"}
                  color={lastTouchFilter === "TODAY" ? "success" : "default"}
                  onClick={() => setLastTouchFilter("TODAY")}
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label="This Week"
                  clickable
                  size="small"
                  variant={lastTouchFilter === "WEEK" ? "filled" : "outlined"}
                  color={lastTouchFilter === "WEEK" ? "info" : "default"}
                  onClick={() => setLastTouchFilter("WEEK")}
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label="Over 1 Week Ago"
                  clickable
                  size="small"
                  variant={lastTouchFilter === "OLD" ? "filled" : "outlined"}
                  color={lastTouchFilter === "OLD" ? "warning" : "default"}
                  onClick={() => setLastTouchFilter("OLD")}
                  sx={{ fontWeight: 500 }}
                />
              </Stack>
            </Stack>

            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              color="primary"
              sx={{
                alignSelf: { xs: "stretch", md: "center" },
                minWidth: 180,
                fontWeight: 600,
              }}
            >
              Export Excel
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined">
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: "18%" }}>
                    Student
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "12%" }}>
                    Reg No.
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "25%" }}>
                    Programme
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "12%" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "12%" }}>
                    Payment
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "10%" }}>
                    Last Touch
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "8%" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdmissions.map((admission) => (
                  <TableRow
                    key={admission.id}
                    hover
                    sx={{
                      "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={600} variant="body2">
                        {admission.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{admission.regNo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {admission.program}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderStatusChip(admission.status)}</TableCell>
                    <TableCell>
                      {renderPaymentChip(admission.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {admission.lastTouch}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip
                          title={admission.notes ? "Edit note" : "Add note"}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleOpenNoteDialog(admission)}
                            color={admission.notes ? "primary" : "default"}
                          >
                            {admission.notes ? (
                              <EditIcon fontSize="small" />
                            ) : (
                              <NoteAddIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, admission)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAdmissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6 }}>
                      <Typography align="center" color="textSecondary">
                        Nothing matches your current filters – try clearing the
                        search or switching the tag.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Box
            px={3}
            py={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="body2" color="textSecondary">
              Using Suzy's playbook from the import tool: green for Enrolled,
              yellow for Deferred, red for Expired.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {Object.entries(statusPalette).map(([key, palette]) => (
                <Stack
                  key={key}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: palette.dot,
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {palette.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Paper>

        {/* Status Update Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => handleStatusUpdate("ENROLLED")}
            sx={{
              color: statusPalette.ENROLLED.chip,
              "&:hover": { bgcolor: alpha(statusPalette.ENROLLED.dot, 0.1) },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: statusPalette.ENROLLED.dot,
                mr: 1.5,
              }}
            />
            Mark as Enrolled
          </MenuItem>
          <MenuItem
            onClick={() => handleStatusUpdate("DEFERRED")}
            sx={{
              color: statusPalette.DEFERRED.chip,
              "&:hover": { bgcolor: alpha(statusPalette.DEFERRED.dot, 0.1) },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: statusPalette.DEFERRED.dot,
                mr: 1.5,
              }}
            />
            Mark as Deferred
          </MenuItem>
          <MenuItem
            onClick={() => handleStatusUpdate("EXPIRED")}
            sx={{
              color: statusPalette.EXPIRED.chip,
              "&:hover": { bgcolor: alpha(statusPalette.EXPIRED.dot, 0.1) },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: statusPalette.EXPIRED.dot,
                mr: 1.5,
              }}
            />
            Mark as Expired
          </MenuItem>
        </Menu>

        {/* Note Dialog */}
        <Dialog
          open={noteDialogOpen}
          onClose={handleCloseNoteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedAdmission?.notes ? "Edit Note" : "Add Note"}
            {selectedAdmission && (
              <Typography variant="body2" color="textSecondary">
                {selectedAdmission.name} ({selectedAdmission.regNo})
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Contact Notes / Follow-up"
              placeholder="e.g., Called today - promised payment by Friday. Needs follow-up."
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              helperText="Track your conversations and follow-up actions here"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNoteDialog}>Cancel</Button>
            <Button
              onClick={handleSaveNote}
              variant="contained"
              color="primary"
            >
              Save Note
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default SuzySheets;
