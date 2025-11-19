import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
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

const normalizeProgram = (program) => {
  if (!program) return "N/A";

  if (typeof program === "string") {
    return program;
  }

  if (Array.isArray(program)) {
    return program
      .map((item) => normalizeProgram(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof program === "object") {
    const name = program.name || program.displayName;
    const code = program.code || program.id;

    if (name && code) {
      return `${name} (${code})`;
    }

    return name || code || "N/A";
  }

  return String(program);
};

const formatLabel = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const toCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const normalized = String(value)
    .replace(/\r?\n|\r/g, " ")
    .trim();
  const escaped = normalized.replace(/"/g, '""');
  return /[",]/.test(escaped) ? `"${escaped}"` : escaped;
};

const normalizeSource = (admission) => {
  const sourceCandidate =
    admission?.source ||
    admission?.leadSource ||
    admission?.sourceName ||
    admission?.source_type ||
    admission?.sourceType ||
    admission?.metadata?.source ||
    admission?.application?.source ||
    admission?.application?.raw?.source ||
    null;

  if (!sourceCandidate || !String(sourceCandidate).trim()) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  const key = String(sourceCandidate).trim().toUpperCase();
  const label = formatLabel(sourceCandidate) || "Unknown";

  return { key, label };
};

const normalizeModeOfStudy = (admission) => {
  const modeCandidate =
    admission?.modeOfStudy ||
    admission?.studyMode ||
    admission?.mode ||
    admission?.programMode ||
    admission?.application?.modeOfStudy ||
    admission?.application?.raw?.modeOfStudy ||
    admission?.application?.raw?.studyMode ||
    null;

  if (!modeCandidate || !String(modeCandidate).trim()) {
    return { key: "UNKNOWN", label: "Unknown" };
  }

  const value = String(modeCandidate).trim().toLowerCase();
  if (value.includes("campus")) {
    return { key: "ON_CAMPUS", label: "On Campus" };
  }
  if (value.includes("online")) {
    return { key: "ONLINE", label: "Online" };
  }

  const label = formatLabel(modeCandidate) || "Unknown";
  return { key: label.toUpperCase(), label };
};

const normalizeName = (admission) => {
  if (!admission) return "Unknown Student";

  const fromObjectName = () => {
    if (typeof admission.name === "object" && admission.name) {
      const potentialFirst =
        admission.name.first ||
        admission.name.givenName ||
        admission.name.given;
      const potentialLast =
        admission.name.last ||
        admission.name.familyName ||
        admission.name.family;
      if (potentialFirst || potentialLast) {
        return `${potentialFirst || ""} ${potentialLast || ""}`.trim();
      }
      if (admission.name.full || admission.name.display) {
        return admission.name.full || admission.name.display;
      }
    }
    return null;
  };

  const firstName =
    admission.firstName ||
    admission.givenName ||
    admission.first_name ||
    (typeof admission.name === "object" ? admission.name.firstName : null);
  const lastName =
    admission.lastName ||
    admission.familyName ||
    admission.last_name ||
    (typeof admission.name === "object" ? admission.name.lastName : null);

  if (firstName || lastName) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  if (typeof admission.name === "string" && admission.name.trim()) {
    return admission.name.trim();
  }

  const objectValue = fromObjectName();
  if (objectValue) return objectValue;

  if (admission.profile && typeof admission.profile === "object") {
    const profileFirst =
      admission.profile.firstName || admission.profile.givenName;
    const profileLast =
      admission.profile.lastName || admission.profile.familyName;
    if (profileFirst || profileLast) {
      return `${profileFirst || ""} ${profileLast || ""}`.trim();
    }
  }

  const application =
    admission.application ||
    admission.applicationData ||
    admission.applicationDetails ||
    admission.latestApplication ||
    (admission.applications && admission.applications[0]);

  if (application && typeof application === "object") {
    const appFirst =
      application.firstName ||
      application.first_name ||
      application.givenName ||
      (application.applicant && application.applicant.firstName) ||
      (application.raw && application.raw.firstName);
    const appLast =
      application.lastName ||
      application.last_name ||
      application.familyName ||
      (application.applicant && application.applicant.lastName) ||
      (application.raw && application.raw.lastName);

    if (appFirst || appLast) {
      return `${appFirst || ""} ${appLast || ""}`.trim();
    }

    if (typeof application.name === "string" && application.name.trim()) {
      return application.name.trim();
    }

    if (application.name && typeof application.name === "object") {
      const fromAppName = `${
        application.name.first ||
        application.name.firstName ||
        application.name.givenName ||
        ""
      } ${
        application.name.last ||
        application.name.lastName ||
        application.name.familyName ||
        ""
      }`.trim();
      if (fromAppName) {
        return fromAppName;
      }

      const displayName = application.name.full || application.name.display;
      if (typeof displayName === "string" && displayName.trim()) {
        return displayName.trim();
      }
    }
  }

  return "Unknown Student";
};

const normalizeRegNo = (admission) => {
  if (!admission) return "N/A";

  const candidateValues = [];

  const addCandidate = (value) => {
    if (typeof value === "string" && value.trim()) {
      candidateValues.push(value.trim());
    }
  };

  addCandidate(admission.registrationNumber);
  addCandidate(admission.regNumber);
  addCandidate(admission.regNo);

  const application =
    admission.application ||
    admission.applicationData ||
    admission.applicationDetails ||
    admission.latestApplication ||
    (admission.applications && admission.applications[0]);

  if (application && typeof application === "object") {
    addCandidate(
      application.registrationNumber || application.registration_number
    );
    addCandidate(application.regNo || application.reg_no);
    addCandidate(application.studentRegNo);
    if (application.student && typeof application.student === "object") {
      addCandidate(application.student.registrationNumber);
      addCandidate(application.student.regNo);
    }

    if (application.raw && typeof application.raw === "object") {
      addCandidate(
        application.raw.registrationNumber ||
          application.raw.registration_number
      );
      addCandidate(application.raw.regNo || application.raw.reg_no);
    }
  }

  if (candidateValues.length > 0) {
    return candidateValues[0];
  }

  return admission.regNo && typeof admission.regNo === "string"
    ? admission.regNo.trim()
    : "N/A";
};

const normalizeStatus = (status, fallback = "ADMITTED") => {
  if (!status) return fallback;

  let value = status;
  if (typeof status === "object") {
    value = status.code || status.name || status.value || fallback;
  }

  return String(value).toUpperCase();
};

const normalizePaymentStatus = (status) => {
  if (!status) return "PENDING";

  let value = status;
  if (typeof status === "object") {
    value = status.code || status.name || status.value || "PENDING";
  }

  return String(value).toUpperCase();
};

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
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

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
  const [exporting, setExporting] = useState(false);

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
        const sanitizedAdmissions = (response.data || []).map((admission) => {
          const sourceInfo = normalizeSource(admission);
          const modeInfo = normalizeModeOfStudy(admission);

          return {
            ...admission,
            name: normalizeName(admission),
            regNo: normalizeRegNo(admission),
            program: normalizeProgram(admission.program),
            status: normalizeStatus(admission.status),
            paymentStatus: normalizePaymentStatus(admission.paymentStatus),
            source: sourceInfo.label,
            sourceKey: sourceInfo.key,
            modeOfStudy: modeInfo.label,
            modeKey: modeInfo.key,
          };
        });

        setAdmissions(sanitizedAdmissions);
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

      const matchesSource =
        sourceFilter === "ALL" ||
        (item.sourceKey || "UNKNOWN") === sourceFilter;
      const matchesMode =
        modeFilter === "ALL" || (item.modeKey || "UNKNOWN") === modeFilter;

      return (
        matchesStatus &&
        matchesSearch &&
        matchesLastTouch &&
        matchesSource &&
        matchesMode
      );
    });

    // Sort by most recent first
    return filtered.sort((a, b) => a.lastTouchDays - b.lastTouchDays);
  }, [
    admissions,
    statusFilter,
    searchTerm,
    lastTouchFilter,
    sourceFilter,
    modeFilter,
  ]);

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

  const sourceOptions = useMemo(() => {
    const entries = new Map();
    admissions.forEach((item) => {
      const key = item.sourceKey || "UNKNOWN";
      const label = item.source || "Unknown";
      if (!entries.has(key)) {
        entries.set(key, label);
      }
    });
    return Array.from(entries, ([key, label]) => ({ key, label })).sort(
      (a, b) => a.label.localeCompare(b.label)
    );
  }, [admissions]);

  const modeOptions = useMemo(() => {
    const entries = new Map();
    admissions.forEach((item) => {
      const key = item.modeKey || "UNKNOWN";
      const label = item.modeOfStudy || "Unknown";
      if (!entries.has(key)) {
        entries.set(key, label);
      }
    });
    return Array.from(entries, ([key, label]) => ({ key, label })).sort(
      (a, b) => a.label.localeCompare(b.label)
    );
  }, [admissions]);

  const selectedSourceOption = useMemo(() => {
    if (sourceFilter === "ALL") return null;
    return sourceOptions.find((option) => option.key === sourceFilter) || null;
  }, [sourceFilter, sourceOptions]);

  const selectedModeOption = useMemo(() => {
    if (modeFilter === "ALL") return null;
    return modeOptions.find((option) => option.key === modeFilter) || null;
  }, [modeFilter, modeOptions]);

  const handleExport = useCallback(() => {
    if (!filteredAdmissions.length) {
      setSnackbar({
        open: true,
        message: "No records to export for the current filters",
        severity: "warning",
      });
      return;
    }

    setExporting(true);
    let objectUrl;

    try {
      const headers = [
        "Student Name",
        "Registration Number",
        "Email",
        "Phone",
        "Programme",
        "Lead Source",
        "Mode of Study",
        "Status",
        "Payment Status",
        "Last Touch",
      ];

      const rows = filteredAdmissions.map((item) => {
        const statusLabel =
          statusPalette[item.status]?.label ||
          (item.status ? formatLabel(item.status) : "Unknown");
        const paymentLabel =
          paymentStatusPalette[item.paymentStatus]?.label ||
          (item.paymentStatus ? formatLabel(item.paymentStatus) : "Unknown");

        return [
          item.name || "Unknown Student",
          item.regNo || "",
          item.email || "",
          item.phone || "",
          item.program || "",
          item.source || "Unknown",
          item.modeOfStudy || "Unknown",
          statusLabel,
          paymentLabel,
          item.lastTouch || "",
        ]
          .map(toCsvValue)
          .join(",");
      });

      const csvContent = [headers.map(toCsvValue).join(","), ...rows].join(
        "\r\n"
      );

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      objectUrl = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", `suzy-sheets-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: `Exported ${filteredAdmissions.length} record${
          filteredAdmissions.length === 1 ? "" : "s"
        }`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting Suzy Sheets:", error);
      setSnackbar({
        open: true,
        message: "Failed to export data. Please try again.",
        severity: "error",
      });
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setExporting(false);
    }
  }, [filteredAdmissions, setSnackbar]);

  useEffect(() => {
    if (
      sourceFilter !== "ALL" &&
      !sourceOptions.some((option) => option.key === sourceFilter)
    ) {
      setSourceFilter("ALL");
    }
  }, [sourceFilter, sourceOptions]);

  useEffect(() => {
    if (
      modeFilter !== "ALL" &&
      !modeOptions.some((option) => option.key === modeFilter)
    ) {
      setModeFilter("ALL");
    }
  }, [modeFilter, modeOptions]);

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
      <Fade in={loading}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
          {/* Header Skeleton */}
          <Box mb={4}>
            <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" width={200} height={32} />
          </Box>

          {/* Status Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 2 }}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Box>
                        <Skeleton variant="text" width={80} height={20} />
                        <Skeleton
                          variant="text"
                          width={60}
                          height={48}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Skeleton variant="circular" width={12} height={12} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search and Filter Skeleton */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={40} width="100%" />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} variant="rounded" width={80} height={32} />
                ))}
              </Box>
            </Stack>
          </Paper>

          {/* Table Skeleton */}
          <Paper variant="outlined">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Student",
                      "Reg No.",
                      "Email",
                      "Phone",
                      "Programme",
                      "Source",
                      "Mode",
                      "Status",
                      "Payment",
                      "Last Touch",
                      "Actions",
                    ].map((header) => (
                      <TableCell key={header}>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Skeleton variant="text" width="90%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="95%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="95%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={90} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={110} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width="70%" height={20} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Fade>
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
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} lg={5}>
              <TextField
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                size="small"
                placeholder="Search by name, reg no. or programme"
                fullWidth
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
              />
            </Grid>
            <Grid item xs={12} md={6} lg={7}>
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
              >
                <Button
                  startIcon={
                    exporting ? (
                      <CircularProgress
                        color="inherit"
                        size={18}
                        thickness={4}
                      />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  variant="contained"
                  color="primary"
                  sx={{ fontWeight: 600, minWidth: 160 }}
                  onClick={handleExport}
                  disabled={exporting || filteredAdmissions.length === 0}
                >
                  {exporting ? "Exporting..." : "Export Excel"}
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                <Typography variant="caption" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {statusFilters.map((status) => {
                    if (status === "ALL") {
                      return (
                        <Chip
                          key={status}
                          label="All"
                          clickable
                          size="small"
                          variant={
                            statusFilter === "ALL" ? "filled" : "outlined"
                          }
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
                        variant={
                          statusFilter === status ? "filled" : "outlined"
                        }
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
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={1}>
                <Typography variant="caption" color="textSecondary">
                  Last Contact
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                    variant={
                      lastTouchFilter === "TODAY" ? "filled" : "outlined"
                    }
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
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={sourceOptions}
                getOptionLabel={(option) => option.label}
                value={selectedSourceOption}
                onChange={(_, newValue) =>
                  setSourceFilter(newValue ? newValue.key : "ALL")
                }
                isOptionEqualToValue={(option, value) =>
                  option.key === value.key
                }
                clearOnEscape
                disablePortal
                fullWidth
                disabled={sourceOptions.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lead Source"
                    size="small"
                    placeholder={
                      sourceOptions.length ? "Filter by source" : "No sources"
                    }
                  />
                )}
                noOptionsText="No sources"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={modeOptions}
                getOptionLabel={(option) => option.label}
                value={selectedModeOption}
                onChange={(_, newValue) =>
                  setModeFilter(newValue ? newValue.key : "ALL")
                }
                isOptionEqualToValue={(option, value) =>
                  option.key === value.key
                }
                clearOnEscape
                disablePortal
                fullWidth
                disabled={modeOptions.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mode of Study"
                    size="small"
                    placeholder={
                      modeOptions.length ? "Filter by mode" : "No modes"
                    }
                  />
                )}
                noOptionsText="No modes"
              />
            </Grid>
          </Grid>
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
                  <TableCell sx={{ fontWeight: 700, width: "18%" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "14%" }}>
                    Phone
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "18%" }}>
                    Programme
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "12%" }}>
                    Source
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "12%" }}>
                    Mode
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "10%" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: "10%" }}>
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
                        {admission.email || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {admission.phone || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {admission.program}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {admission.source || "Unknown"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {admission.modeOfStudy || "Unknown"}
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
                    <TableCell colSpan={11} sx={{ py: 6 }}>
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
