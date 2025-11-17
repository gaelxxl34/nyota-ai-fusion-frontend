import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Archive as ArchiveIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { archiveService } from "../../services/archiveService";

const formatDateLabel = (value) => {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  return date.toLocaleString();
};

const normalizeJob = (job) => {
  if (!job) {
    return null;
  }

  const normalized = {
    id: job.id,
    collectionId: job.collectionId || null,
    collection:
      job.collectionLabel ||
      job.collection ||
      job.collectionId ||
      "Unknown collection",
    action: job.action || "archive",
    status: job.status || "pending",
    filters: job.filters || {},
    stats: job.stats || { scanned: 0, matched: 0, archived: 0, deleted: 0 },
    dryRun: Boolean(job.dryRun),
    requestedBy: job.requestedBy || null,
    error: job.error || null,
    archiveId: job.archiveId || null,
    archivePath: job.archivePath || null,
    createdAtRaw: job.createdAt || job.createdAtRaw || null,
    startedAtRaw: job.startedAt || job.startedAtRaw || null,
    completedAtRaw: job.completedAt || job.completedAtRaw || null,
    previewCompletedAtRaw:
      job.previewCompletedAt || job.previewCompletedAtRaw || null,
    updatedAtRaw: job.updatedAt || job.updatedAtRaw || null,
  };

  return {
    ...normalized,
    createdAtLabel: formatDateLabel(normalized.createdAtRaw),
    startedAtLabel: formatDateLabel(normalized.startedAtRaw),
    completedAtLabel: formatDateLabel(normalized.completedAtRaw),
    previewCompletedAtLabel: formatDateLabel(normalized.previewCompletedAtRaw),
    updatedAtLabel: formatDateLabel(normalized.updatedAtRaw),
  };
};

const Archive = () => {
  const currentYear = new Date().getFullYear();
  const fallbackYearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => String(currentYear + index)),
    [currentYear]
  );
  const fallbackIntakeOptions = useMemo(() => ["january", "may", "august"], []);

  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [jobs, setJobs] = useState([]);

  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedIntake, setSelectedIntake] = useState("");
  const [selectedAction, setSelectedAction] = useState("archive");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [postArchiveDialogOpen, setPostArchiveDialogOpen] = useState(false);
  const [postArchiveContext, setPostArchiveContext] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", severity: "info" });
  const [showFeedback, setShowFeedback] = useState(false);

  const showToast = useCallback((message, severity = "success") => {
    setFeedback({ message, severity });
    setShowFeedback(true);
  }, []);

  const [yearOptions, setYearOptions] = useState([]);
  const [intakeOptions, setIntakeOptions] = useState([]);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [jobDetailsLoading, setJobDetailsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteArchiveDialogOpen, setDeleteArchiveDialogOpen] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState(null);
  const [deleteArchiveLoading, setDeleteArchiveLoading] = useState(false);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [selectedDownloadJob, setSelectedDownloadJob] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const selectedCollection = useMemo(
    () =>
      collections.find(
        (collection) => collection.id === selectedCollectionId
      ) || null,
    [collections, selectedCollectionId]
  );

  const postArchiveCollectionLabel = useMemo(() => {
    if (!postArchiveContext?.collectionId) {
      return "";
    }

    const match = collections.find(
      (collection) => collection.id === postArchiveContext.collectionId
    );

    return match?.label || postArchiveContext.collectionId;
  }, [collections, postArchiveContext]);

  const buildPayload = useCallback(
    (action) => {
      if (!selectedCollectionId) {
        return null;
      }

      const payload = {
        collectionId: selectedCollectionId,
        action,
      };

      if (selectedYear) {
        payload.year = selectedYear;
      }

      if (selectedIntake) {
        payload.intake = selectedIntake;
      }

      return payload;
    },
    [selectedCollectionId, selectedYear, selectedIntake]
  );

  const loadJobs = useCallback(async () => {
    try {
      const response = await archiveService.getJobs();
      setJobs(response.jobs || []);
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error.message || "Failed to load archive history",
      });
      setShowFeedback(true);
    }
  }, []);

  const executeJob = useCallback(
    async (action, payloadOverride) => {
      const resolvedAction = action || selectedAction;
      const payload = payloadOverride || buildPayload(resolvedAction);

      if (!payload?.collectionId) {
        showToast("Select a collection first", "warning");
        return { success: false };
      }

      console.log("Executing archive job with payload:", payload);
      setActionLoading(true);

      try {
        const response = await archiveService.createJob(payload);
        console.log("Archive job response:", response);
        const successMessage =
          resolvedAction === "delete"
            ? "Delete completed successfully. The selected data has been cleared."
            : "Archive completed successfully. Snapshot saved for later retrieval.";

        showToast(successMessage, "success");
        await loadJobs();

        return {
          success: true,
          payload,
          response,
          action: resolvedAction,
        };
      } catch (error) {
        console.error("Error creating archive job:", error);
        console.error("Error response:", error.response?.data);
        const errorMessage =
          error.message || `Failed to ${resolvedAction} documents`;
        showToast(errorMessage, "error");

        return {
          success: false,
          error,
          action: resolvedAction,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [buildPayload, showToast, loadJobs, selectedAction]
  );

  const intakeLabel = useCallback((rawValue) => {
    if (rawValue === null || rawValue === undefined) {
      return "";
    }

    const value = String(rawValue);
    if (!value) {
      return "";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }, []);

  const setDefaultFilters = useCallback(
    (filters) => {
      const { years = [], intakes = [] } = filters || {};

      const resolvedYears =
        years.length > 0 ? years.map(String) : fallbackYearOptions;
      const resolvedIntakes =
        intakes.length > 0
          ? intakes.map((value) => String(value).toLowerCase())
          : fallbackIntakeOptions;

      setYearOptions(resolvedYears);
      setIntakeOptions(resolvedIntakes);

      setSelectedYear(resolvedYears[0] || "");
      setSelectedIntake(resolvedIntakes[0] || "");
    },
    [fallbackIntakeOptions, fallbackYearOptions]
  );

  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const response = await archiveService.getCollections();
      const fetchedCollections = (response.collections || []).map((col) => ({
        ...col,
        // Ensure count is properly formatted
        count: col.count !== null && col.count !== undefined ? col.count : null,
      }));
      setCollections(fetchedCollections);

      if (fetchedCollections.length > 0) {
        setSelectedCollectionId((prev) => prev || fetchedCollections[0].id);
      }
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error.message || "Failed to load archive collections",
      });
      setShowFeedback(true);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  const loadFilters = useCallback(
    async (collectionId) => {
      if (!collectionId) {
        setYearOptions([]);
        setIntakeOptions([]);
        return;
      }

      try {
        const response = await archiveService.getFilters(collectionId);
        setDefaultFilters(response.filters);
      } catch (error) {
        setFeedback({
          severity: "warning",
          message:
            error.message ||
            "Unable to load filters automatically. Please select manually.",
        });
        setShowFeedback(true);
        setDefaultFilters({ years: [], intakes: [] });
      }
    },
    [setDefaultFilters]
  );

  useEffect(() => {
    loadCollections();
    loadJobs();
  }, [loadCollections, loadJobs]);

  useEffect(() => {
    loadFilters(selectedCollectionId);
  }, [selectedCollectionId, loadFilters]);

  const formHasErrors = useMemo(() => {
    return !selectedCollectionId;
  }, [selectedCollectionId]);

  const primaryCtaLabel =
    selectedAction === "archive" ? "Archive Now" : "Delete Data";

  const handleCollectionChange = useCallback((event) => {
    setSelectedCollectionId(event.target.value);
  }, []);

  const handleYearChange = useCallback((event) => {
    setSelectedYear(event.target.value);
  }, []);

  const handleIntakeChange = useCallback((event) => {
    setSelectedIntake(event.target.value);
  }, []);

  const handleActionChange = useCallback((event) => {
    setSelectedAction(event.target.value);
  }, []);

  const handlePrimaryAction = useCallback(async () => {
    if (selectedAction === "delete") {
      setConfirmDeleteOpen(true);
      return;
    }

    const result = await executeJob("archive");

    if (result.success) {
      const archivedCount =
        result.response?.job?.stats?.archived ??
        result.response?.stats?.archived ??
        0;

      setPostArchiveContext({
        collectionId: result.payload.collectionId,
        year: result.payload.year || "",
        intake: result.payload.intake || "",
        archivedCount,
      });
      setPostArchiveDialogOpen(true);
    }
  }, [executeJob, selectedAction]);

  const handleConfirmDeletion = useCallback(async () => {
    setConfirmDeleteOpen(false);

    // Check if archive exists before allowing deletion
    try {
      setActionLoading(true);
      const checkResult = await archiveService.checkArchiveExists(
        selectedCollectionId,
        selectedYear,
        selectedIntake
      );

      if (!checkResult.exists) {
        showToast(
          "Cannot delete: No archive exists for this collection/year/intake. Please create an archive first.",
          "error"
        );
        setActionLoading(false);
        return;
      }

      setActionLoading(false);
      await executeJob("delete");
    } catch (error) {
      setActionLoading(false);
      showToast(error.message || "Failed to verify archive existence", "error");
    }
  }, [
    executeJob,
    selectedCollectionId,
    selectedYear,
    selectedIntake,
    showToast,
  ]);

  const handlePostArchiveDeletion = useCallback(async () => {
    if (!postArchiveContext) {
      setPostArchiveDialogOpen(false);
      return;
    }

    const payload = {
      collectionId: postArchiveContext.collectionId,
      action: "delete",
    };

    if (postArchiveContext.year) {
      payload.year = postArchiveContext.year;
    }

    if (postArchiveContext.intake) {
      payload.intake = postArchiveContext.intake;
    }

    setPostArchiveDialogOpen(false);
    setPostArchiveContext(null);

    // Check if archive exists before allowing deletion
    try {
      setActionLoading(true);
      const checkResult = await archiveService.checkArchiveExists(
        payload.collectionId,
        payload.year,
        payload.intake
      );

      if (!checkResult.exists) {
        showToast(
          "Cannot delete: Archive verification failed. Please ensure an archive exists.",
          "error"
        );
        setActionLoading(false);
        return;
      }

      setActionLoading(false);
      await executeJob("delete", payload);
    } catch (error) {
      setActionLoading(false);
      showToast(error.message || "Failed to verify archive existence", "error");
    }
  }, [postArchiveContext, executeJob, showToast]);

  const handleDismissPostArchive = useCallback(() => {
    setPostArchiveDialogOpen(false);
    setPostArchiveContext(null);
  }, []);

  const handleViewJobDetails = useCallback(
    async (job) => {
      if (!job?.id) {
        showToast("Unable to load job details", "warning");
        return;
      }

      const fallbackJob = normalizeJob(job);
      setSelectedJob(fallbackJob);
      setJobDetailsOpen(true);
      setJobDetailsLoading(true);
      try {
        const response = await archiveService.getJob(job.id);
        if (response.job) {
          setSelectedJob(normalizeJob(response.job));
        }
      } catch (error) {
        showToast(error.message || "Failed to load job details", "error");
      } finally {
        setJobDetailsLoading(false);
      }
    },
    [showToast]
  );

  const handleCloseJobDetails = useCallback(() => {
    setJobDetailsOpen(false);
    setSelectedJob(null);
    setJobDetailsLoading(false);
  }, []);

  const handleCloseFeedback = useCallback(() => {
    setShowFeedback(false);
  }, []);

  const handleDeleteArchive = useCallback((job) => {
    setArchiveToDelete(job);
    setDeleteArchiveDialogOpen(true);
  }, []);

  const handleConfirmDeleteArchive = useCallback(async () => {
    if (!archiveToDelete?.archiveId) {
      showToast("Unable to delete archive: Archive ID not found", "error");
      setDeleteArchiveDialogOpen(false);
      return;
    }

    setDeleteArchiveLoading(true);
    try {
      await archiveService.deleteArchive(archiveToDelete.archiveId);
      showToast("Archive deleted successfully", "success");
      await loadJobs();
      setDeleteArchiveDialogOpen(false);
      setArchiveToDelete(null);
    } catch (error) {
      console.error("Failed to delete archive", error.response?.data || error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete archive";
      showToast(errorMessage, "error");
    } finally {
      setDeleteArchiveLoading(false);
    }
  }, [archiveToDelete, showToast, loadJobs]);

  const handleCancelDeleteArchive = useCallback(() => {
    setDeleteArchiveDialogOpen(false);
    setArchiveToDelete(null);
  }, []);

  const handleOpenDownloadMenu = useCallback((event, job) => {
    setDownloadMenuAnchor(event.currentTarget);
    setSelectedDownloadJob(job);
  }, []);

  const handleCloseDownloadMenu = useCallback(() => {
    setDownloadMenuAnchor(null);
    setSelectedDownloadJob(null);
  }, []);

  const handleDownloadArchive = useCallback(
    async (format) => {
      if (!selectedDownloadJob?.archiveId) {
        showToast("Unable to download: Archive ID not found", "error");
        handleCloseDownloadMenu();
        return;
      }

      setDownloadLoading(true);
      try {
        const blob = await archiveService.downloadArchive(
          selectedDownloadJob.archiveId,
          format
        );

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const fileName = `${selectedDownloadJob.collection}-${
          selectedDownloadJob.filters?.intake || "all"
        }-${selectedDownloadJob.filters?.year || "all"}.${format}`;
        link.setAttribute("download", fileName);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        showToast("Archive downloaded successfully", "success");
        handleCloseDownloadMenu();
      } catch (error) {
        console.error("Failed to download archive", error);
        showToast(error.message || "Failed to download archive", "error");
      } finally {
        setDownloadLoading(false);
      }
    },
    [selectedDownloadJob, showToast, handleCloseDownloadMenu]
  );

  const formattedJobs = useMemo(() => {
    return jobs.map((job) => normalizeJob(job)).filter((job) => Boolean(job));
  }, [jobs]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Snackbar
        open={showFeedback}
        autoHideDuration={5000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity || "info"}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArchiveIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          </Box>
          <Box flex={1}>
            <Typography
              variant="h4"
              fontWeight="600"
              sx={{
                mb: 0.5,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
              }}
            >
              Data Archive Center
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.95,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              Manage historical data snapshots, create secure backups, and
              restore archived information with enterprise-grade controls.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Alert
        severity="info"
        icon={<ArchiveIcon />}
        sx={{
          mb: 3,
          borderRadius: 2,
          "& .MuiAlert-icon": {
            fontSize: 28,
          },
        }}
      >
        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
          How Archive Operations Work
        </Typography>
        <Typography variant="body2">
          Archive operations execute immediately. Select a collection, year, and
          intake, then click <strong>Archive Now</strong> to create a snapshot
          while keeping live records in place. After completion, you can clear
          the original data or choose Delete to remove it permanently.
        </Typography>
      </Alert>

      <Paper
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h5"
              fontWeight="600"
              gutterBottom
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              Configure Data Action
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.7,
                fontSize: { xs: "0.813rem", sm: "0.875rem" },
              }}
            >
              Choose the collection, academic year, and intake you want to
              process. Archives are stored as named snapshots with complete
              metadata tracking.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ width: "100%" }}
          >
            <FormControl fullWidth>
              <InputLabel id="collection-select-label">Collection</InputLabel>
              <Select
                labelId="collection-select-label"
                value={selectedCollectionId}
                label="Collection"
                onChange={handleCollectionChange}
                disabled={collectionsLoading}
              >
                {collections.map((collection) => (
                  <MenuItem key={collection.id} value={collection.id}>
                    {collection.label}
                  </MenuItem>
                ))}
              </Select>
              {collectionsLoading && (
                <FormHelperText sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} /> Loading
                  collections…
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="year-select-label">Academic Year</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                label="Academic Year"
                onChange={handleYearChange}
                disabled={yearOptions.length === 0}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={String(year)}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="intake-select-label">Intake</InputLabel>
              <Select
                labelId="intake-select-label"
                value={selectedIntake}
                label="Intake"
                onChange={handleIntakeChange}
                disabled={intakeOptions.length === 0}
              >
                {intakeOptions.map((intake) => (
                  <MenuItem key={intake} value={String(intake)}>
                    {intakeLabel(String(intake))} Intake
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: "2px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="600"
              sx={{
                mb: 2,
                fontSize: { xs: "0.938rem", sm: "1rem" },
              }}
            >
              Choose Action Type
            </Typography>
            <RadioGroup value={selectedAction} onChange={handleActionChange}>
              <FormControlLabel
                value="archive"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="500">
                      Archive Data Snapshot (Recommended)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Creates a backup without deleting original data
                    </Typography>
                  </Box>
                }
                sx={{
                  mb: 1.5,
                  p: 1,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              />
              <FormControlLabel
                value="delete"
                control={<Radio color="error" />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="500" color="error">
                      Delete Data (Irreversible)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Permanently removes data after archiving
                    </Typography>
                  </Box>
                }
                sx={{
                  p: 1,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              />
            </RadioGroup>
            {selectedAction === "delete" ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Deleting removes the data for the chosen intake and cannot be
                undone. Confirm that a snapshot exists before proceeding.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Archiving creates a read-only snapshot that stays available in
                the history section for future downloads.
              </Alert>
            )}
          </Paper>

          {selectedCollection && (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: "primary.50",
                borderRadius: 2,
                border: "2px solid",
                borderColor: "primary.200",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="600"
                color="primary"
                sx={{
                  mb: 2,
                  fontSize: { xs: "0.938rem", sm: "1rem" },
                }}
              >
                📊 Operation Summary
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedCollection.label}
                </Typography>
                <Typography variant="body2">
                  <strong>Approx. documents:</strong>{" "}
                  {collectionsLoading
                    ? "Loading..."
                    : selectedCollection.count !== null &&
                      selectedCollection.count !== undefined
                    ? Number(selectedCollection.count).toLocaleString()
                    : "Unknown"}
                </Typography>
                {selectedAction === "archive" && (
                  <>
                    <Typography variant="body2">
                      <strong>Academic year:</strong> {selectedYear}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Intake:</strong> {selectedIntake}
                    </Typography>
                  </>
                )}
                <Typography variant="body2">
                  <strong>Action:</strong>{" "}
                  {selectedAction === "archive"
                    ? "Archive snapshot"
                    : "Delete data"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This operation will execute immediately and process all
                  matching documents.
                </Typography>
              </Stack>
            </Paper>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              fullWidth={{ xs: true, sm: false }}
              startIcon={
                actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ArchiveIcon />
                )
              }
              onClick={handlePrimaryAction}
              disabled={actionLoading || formHasErrors}
              sx={{
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: "0.938rem", sm: "1rem" },
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                },
              }}
            >
              {actionLoading ? "Processing..." : primaryCtaLabel}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Confirm deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete the selected data set. Ensure you have
            archived the collection before continuing. This action cannot be
            undone.
          </Typography>
          {selectedCollection && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.100" }}>
              <Typography variant="body2">
                <strong>Collection:</strong> {selectedCollection.label}
              </Typography>
              <Typography variant="body2">
                <strong>Approx. documents:</strong>{" "}
                {selectedCollection.count !== null &&
                selectedCollection.count !== undefined
                  ? Number(selectedCollection.count).toLocaleString()
                  : "Unknown"}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeletion}
            disabled={actionLoading}
          >
            Confirm deletion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={postArchiveDialogOpen}
        onClose={handleDismissPostArchive}
        aria-labelledby="post-archive-title"
      >
        <DialogTitle id="post-archive-title">Archive completed</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant="body2">
              We saved {postArchiveContext?.archivedCount || 0} document
              {postArchiveContext?.archivedCount === 1 ? "" : "s"} to the
              archive snapshot. Do you want to clear these records from the live
              collection now?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.100" }}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Collection:</strong>{" "}
                  {postArchiveCollectionLabel || "Unknown"}
                </Typography>
                {postArchiveContext?.year ? (
                  <Typography variant="body2">
                    <strong>Academic year:</strong> {postArchiveContext.year}
                  </Typography>
                ) : null}
                {postArchiveContext?.intake ? (
                  <Typography variant="body2">
                    <strong>Intake:</strong>{" "}
                    {intakeLabel(String(postArchiveContext.intake))}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismissPostArchive}>Keep data</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handlePostArchiveDeletion}
            disabled={actionLoading}
          >
            Clear collection
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={jobDetailsOpen}
        onClose={handleCloseJobDetails}
        aria-labelledby="job-details-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="job-details-title">
          {selectedJob
            ? `${selectedJob.collection} (${selectedJob.action})`
            : "Archive job"}
        </DialogTitle>
        <DialogContent dividers>
          {jobDetailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !selectedJob ? (
            <Alert severity="warning">Unable to load job details.</Alert>
          ) : (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">What</Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedJob.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Action:</strong>{" "}
                    {selectedJob.dryRun
                      ? "Archive preview"
                      : selectedJob.action === "archive"
                      ? "Archive data"
                      : "Delete data"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Collection:</strong> {selectedJob.collection}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Filters:</strong>{" "}
                    {selectedJob.filters?.year
                      ? `Year ${selectedJob.filters.year}`
                      : "All years"}
                    {" | "}
                    {selectedJob.filters?.intake
                      ? `${intakeLabel(
                          String(selectedJob.filters.intake)
                        )} intake`
                      : "All intakes"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stats:</strong>{" "}
                    {`Scanned: ${selectedJob.stats.scanned || 0} • Matched: ${
                      selectedJob.stats.matched || 0
                    } • Archived: ${
                      selectedJob.stats.archived || 0
                    } • Deleted: ${selectedJob.stats.deleted || 0}`}
                  </Typography>
                  {selectedJob.error && (
                    <Alert severity="error">{selectedJob.error}</Alert>
                  )}
                  <Typography variant="body2">
                    <strong>Last updated:</strong> {selectedJob.updatedAtLabel}
                  </Typography>
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Who</Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong>{" "}
                    {selectedJob.requestedBy?.email || "Unknown"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong>{" "}
                    {selectedJob.requestedBy?.name || "Not provided"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>UID:</strong>{" "}
                    {selectedJob.requestedBy?.uid || "Not provided"}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJobDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Paper
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h5"
              fontWeight="600"
              gutterBottom
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              📚 Archive History
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.7,
                fontSize: { xs: "0.813rem", sm: "0.875rem" },
              }}
            >
              Complete audit trail of archive operations. Monitor all snapshots
              with detailed information about timing, initiator, and document
              counts.
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {formattedJobs.length === 0 && (
            <Alert severity="info">
              No archive jobs have been created yet.
            </Alert>
          )}

          {formattedJobs.map((job) => (
            <Paper
              key={job.id}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transform: { xs: "none", sm: "translateY(-2px)" },
                },
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="subtitle1">
                    {job.collection} ({job.action})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.filters.intake
                      ? `${intakeLabel(String(job.filters.intake))} Intake`
                      : "All intakes"}
                    {job.filters.year ? ` • ${job.filters.year}` : ""}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={job.status.toUpperCase()}
                    color={
                      job.status === "completed"
                        ? "success"
                        : job.status === "failed"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      height: 28,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created {job.createdAtLabel}
                  </Typography>
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Typography variant="body2">
                  {`Scanned: ${job.stats.scanned || 0} • Matched: ${
                    job.stats.matched || 0
                  } • Archived: ${job.stats.archived || 0} • Deleted: ${
                    job.stats.deleted || 0
                  }`}
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {job.action === "archive" && job.archiveId && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth={{ xs: true, sm: false }}
                      startIcon={<DownloadIcon />}
                      onClick={(e) => handleOpenDownloadMenu(e, job)}
                      disabled={downloadLoading}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: { xs: "0.813rem", sm: "0.875rem" },
                      }}
                    >
                      Download
                    </Button>
                  )}
                  {job.action === "archive" && job.archiveId && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      fullWidth={{ xs: true, sm: false }}
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteArchive(job)}
                      disabled={deleteArchiveLoading}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: { xs: "0.813rem", sm: "0.875rem" },
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    fullWidth={{ xs: true, sm: false }}
                    onClick={() => handleViewJobDetails(job)}
                    disabled={jobDetailsLoading && selectedJob?.id === job.id}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: { xs: "0.813rem", sm: "0.875rem" },
                    }}
                  >
                    View Details
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Dialog
        open={deleteArchiveDialogOpen}
        onClose={handleCancelDeleteArchive}
        aria-labelledby="delete-archive-title"
      >
        <DialogTitle id="delete-archive-title">Delete Archive</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Alert severity="error">
              <strong>Warning:</strong> This action will permanently delete the
              archive snapshot and cannot be undone. The archived documents will
              be lost forever.
            </Alert>
            {archiveToDelete && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.100" }}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Collection:</strong> {archiveToDelete.collection}
                  </Typography>
                  {archiveToDelete.filters?.year && (
                    <Typography variant="body2">
                      <strong>Year:</strong> {archiveToDelete.filters.year}
                    </Typography>
                  )}
                  {archiveToDelete.filters?.intake && (
                    <Typography variant="body2">
                      <strong>Intake:</strong>{" "}
                      {intakeLabel(String(archiveToDelete.filters.intake))}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Documents:</strong>{" "}
                    {archiveToDelete.stats?.archived || 0} archived
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {archiveToDelete.createdAtLabel}
                  </Typography>
                </Stack>
              </Paper>
            )}
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to permanently delete this archive? This
              will remove all archived documents and metadata.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDeleteArchive}
            disabled={deleteArchiveLoading}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDeleteArchive}
            disabled={deleteArchiveLoading}
            startIcon={
              deleteArchiveLoading ? (
                <CircularProgress size={16} />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleteArchiveLoading ? "Deleting..." : "Delete Archive"}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleCloseDownloadMenu}
      >
        <MenuItem
          onClick={() => handleDownloadArchive("csv")}
          disabled={downloadLoading}
        >
          Download as CSV
        </MenuItem>
        <MenuItem
          onClick={() => handleDownloadArchive("xlsx")}
          disabled={downloadLoading}
        >
          Download as Excel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Archive;
