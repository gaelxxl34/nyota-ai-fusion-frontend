import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as PreviewIcon,
  Clear as ClearIcon,
  TableView as TableViewIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

const ImportData = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [emailReportData, setEmailReportData] = useState(null); // Store CSV data for email campaigns
  const [previewData, setPreviewData] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [completeData, setCompleteData] = useState(null); // Store all data
  const [showPreview, setShowPreview] = useState(false);
  const [showFullData, setShowFullData] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [processingFile, setProcessingFile] = useState(false);
  const [dataLimited, setDataLimited] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [importType, setImportType] = useState("applications"); // "applications", "tags", or "emails"

  // File validation
  const validateFile = (file) => {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        "File type not supported. Please upload CSV or Excel files only."
      );
    }

    if (file.size > maxSize) {
      errors.push("File size exceeds 10MB limit.");
    }

    return errors;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);

    const errors = validateFile(file);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setSelectedFile(file);
      setUploadResult(null);
      setProcessingFile(true);
      // Generate preview
      generatePreview(file);
    }
  };

  // Generate file preview
  const generatePreview = (file) => {
    console.log(
      "Generating preview for file:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size
    );

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        console.log("File read successfully, processing...");
        let allData = [];
        let originalRowCount = 0;

        if (file.type === "text/csv") {
          // Handle CSV files
          const csv = e.target.result;
          const lines = csv.split("\n").filter((line) => line.trim() !== "");
          originalRowCount = lines.length;
          console.log("CSV total lines found:", originalRowCount);

          allData = lines.map((line) => {
            const result = [];
            let current = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ""));
                current = "";
              } else {
                current += char;
              }
            }
            result.push(current.trim().replace(/^"|"$/g, ""));
            return result;
          });
        } else if (
          file.type.includes("spreadsheet") ||
          file.type === "application/vnd.ms-excel" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          // Handle Excel files
          console.log("Processing Excel file...");

          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON format (array of arrays)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Return array of arrays instead of objects
            defval: "", // Default value for empty cells
            raw: false, // Convert numbers to strings for consistency
          });

          // Filter out completely empty rows
          const filteredData = jsonData.filter(
            (row) =>
              row &&
              row.some(
                (cell) => cell !== null && cell !== undefined && cell !== ""
              )
          );

          originalRowCount = filteredData.length;
          allData = filteredData;

          console.log("Excel total rows found:", originalRowCount);
          console.log("Excel processed data rows:", allData.length);
          console.log("Excel sample data:", allData.slice(0, 2));
        } else {
          throw new Error("Unsupported file type");
        }

        // Store complete data
        setCompleteData(allData);
        setTotalRows(originalRowCount);

        // Determine if we need to limit display
        const displayLimit = 2000; // Increased limit to support 1500+ row email imports
        let displayData = allData;
        let isLimited = false;

        if (allData.length > displayLimit) {
          displayData = allData.slice(0, displayLimit);
          isLimited = true;
          setDataLimited(true);
          // Don't add this as an error - we'll handle it separately
        } else {
          setDataLimited(false);
        }

        console.log("Display data rows:", displayData.length);
        console.log("Is limited:", isLimited);

        // Set preview data (first 6 rows)
        setPreviewData(displayData.slice(0, 6));
        // Set display data
        setFullData(displayData);

        setProcessingFile(false);
      } catch (error) {
        console.error("Error parsing file:", error);
        setValidationErrors((prev) => [
          ...prev,
          `Error parsing file: ${error.message}`,
        ]);
        setProcessingFile(false);
      }
    };

    reader.onerror = (error) => {
      console.error("File reading error:", error);
      setValidationErrors((prev) => [
        ...prev,
        "Error reading file. Please try again.",
      ]);
      setProcessingFile(false);
    };

    // Read file based on type
    if (file.type === "text/csv") {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file); // Required for Excel files
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("importType", importType);

      // Add email-specific parameters if sending emails
      if (importType === "emails") {
        // Use the updated subject
        formData.append(
          "subject",
          "Fix Your Application to Secure Your Place at IUEA – August 2025"
        );
        // No custom content - use backend defaults
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Get the API base URL
      const baseURL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

      // Choose endpoint based on import type
      let endpoint = "/api/admin/import-data"; // default
      if (importType === "tags") {
        endpoint = "/api/admin/import-tag-updates";
      } else if (importType === "emails") {
        endpoint = "/api/admin/import-send-emails";
      }

      // Make API call to upload file
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // Don't set Content-Type header, let the browser set it with boundary
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setUploadResult({
        success: true,
        message: result.message || "Data imported successfully",
        stats: result.stats || {
          total: 0,
          successful: 0,
          failed: 0,
          duplicates: 0,
        },
        errors: result.errors || [],
      });

      // Store CSV data for email campaigns
      if (importType === "emails" && result.csvData) {
        console.log("Email report data received:", result.csvData);
        console.log("Type of csvData:", typeof result.csvData);
        console.log("Is Array:", Array.isArray(result.csvData));
        setEmailReportData(result.csvData);
      }

      // Add to history
      setImportHistory((prev) => [
        {
          id: Date.now(),
          fileName: selectedFile.name,
          uploadDate: new Date().toLocaleString(),
          status: "success",
          recordsProcessed: result.stats?.total || 0,
          importType: importType,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error.message || "Upload failed",
        errors: [error.message],
      });

      // Add to history
      setImportHistory((prev) => [
        {
          id: Date.now(),
          fileName: selectedFile.name,
          uploadDate: new Date().toLocaleString(),
          status: "error",
          recordsProcessed: 0,
          importType: importType,
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  }; // Load all data (for large files)
  const loadAllData = () => {
    if (completeData) {
      console.log("Loading all data:", completeData.length, "rows");
      setProcessingFile(true); // Show loading state

      // Use setTimeout to allow UI to update
      setTimeout(() => {
        setFullData(completeData);
        setDataLimited(false);
        setProcessingFile(false);
        console.log("All data loaded successfully");
      }, 100);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setFullData(null);
    setCompleteData(null);
    setUploadResult(null);
    setValidationErrors([]);
    setUploadProgress(0);
    setShowFullData(false);
    setProcessingFile(false);
    setDataLimited(false);
    setTotalRows(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download template based on import type
  const handleDownloadTemplate = () => {
    let csvContent = "";
    let filename = "";

    if (importType === "tags") {
      // Template for tag updates
      csvContent = `Reg No.,Tags
REG001,green
REG002,red
REG003,yellow`;
      filename = "tag_update_template.csv";
    } else if (importType === "emails") {
      // Template for email campaigns
      csvContent = `FirstName,LastName,email
John,Doe,john.doe@example.com
Jane,Smith,jane.smith@example.com
Mark,Johnson,mark.johnson@example.com`;
      filename = "email_campaign_template.csv";
    } else {
      // Template for new applications
      csvContent = `CreatedAt,Source,FirstName,LastName,Email,Phone No.,Nationality,Reg No.,Course,Faculty,Mode of study,Date of Birth,Company,Company(City/Province),ID TYPE,UACE Level,UACE Level Results,Other Documents,Sponsor Email,Sponsor Phone
2024-01-15,Website,John,Doe,john.doe@email.com,+256700000000,Ugandan,REG001,Information Technology,Computing,On Campus,1995-05-15,Tech Corp,Kampala,National ID,O-Level,Good,High School Certificate,sponsor@email.com,+256700000001
2024-01-16,Reference,Jane,Smith,jane.smith@email.com,+256700000002,Kenyan,REG002,Business Administration,Business,Online,1993-08-22,Business Ltd,Nairobi,Passport,A-Level,Excellent,University Transcript,jane.sponsor@email.com,+256700000003`;
      filename = "student_data_import_template.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Download email campaign report as CSV
  const handleDownloadEmailReport = () => {
    if (!emailReportData) {
      console.error("No email report data available");
      return;
    }

    // Convert array of objects to CSV format
    let csvContent = "";
    if (Array.isArray(emailReportData) && emailReportData.length > 0) {
      // Get headers from the first object
      const headers = Object.keys(emailReportData[0]);
      csvContent = headers.join(",") + "\n";

      // Add data rows
      csvContent += emailReportData
        .map((row) =>
          headers
            .map((header) => {
              const value = row[header] || "";
              // Escape quotes and wrap in quotes if needed
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(",")
        )
        .join("\n");
    } else if (typeof emailReportData === "string") {
      // If it's already a string, use it directly
      csvContent = emailReportData;
    } else {
      console.error("Invalid email report data format:", emailReportData);
      return;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `email-campaign-report-${timestamp}.csv`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Role authorization check
  if (
    !user ||
    !user.role ||
    !["superAdmin", "admin", "admissionAdmin", "admissionAgent"].includes(
      user.role
    )
  ) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          You don't have permission to access the Import Data page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Import Student Data
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {importType === "applications"
            ? "Upload and import student application data in bulk. Creates both applications and leads with ADMITTED status automatically."
            : importType === "tags"
            ? "Update existing applications with tags based on registration numbers. Green tags will update ADMITTED status to ENROLLED."
            : "Send campaign emails using the IUEA template to a list of recipients. Upload a CSV with email addresses and names."}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Import Type Selection */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  <Typography variant="h6" gutterBottom>
                    Import Type
                  </Typography>
                </FormLabel>
                <RadioGroup
                  row
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value);
                    handleClear(); // Clear file when switching import types
                  }}
                >
                  <FormControlLabel
                    value="applications"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          New Applications Import
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Create new student applications with full data
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="tags"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          Tag Updates Import
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Update existing applications with tags (green tags
                          promote ADMITTED to ENROLLED)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="emails"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          Email Campaign Import
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Send campaign emails using IUEA template to email list
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Upload Section */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload File
              </Typography>

              {/* File Upload Area */}
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: selectedFile ? "success.main" : "grey.300",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  mb: 3,
                  backgroundColor: selectedFile ? "success.50" : "grey.50",
                  transition: "all 0.3s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {selectedFile ? (
                  <Box>
                    <FileIcon
                      sx={{ fontSize: 48, color: "success.main", mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon
                      sx={{ fontSize: 48, color: "grey.400", mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      Drop your file here or click to browse
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Maximum file size: 10MB | Up to 2000 rows supported for
                      display | Unlimited rows for processing
                    </Typography>
                  </Box>
                )}

                <Button
                  variant="contained"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mt: 2 }}
                  disabled={uploading}
                >
                  {selectedFile ? "Change File" : "Select File"}
                </Button>
              </Box>

              {/* Large File Information */}
              {dataLimited && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Large Dataset Detected
                      </Typography>
                      <Typography variant="body2">
                        Showing first {fullData?.length - 1 || 0} rows of{" "}
                        {totalRows - 1} total data rows for optimal performance.
                        All rows will be processed when uploaded.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={loadAllData}
                      startIcon={<TableViewIcon />}
                      sx={{ ml: 2 }}
                    >
                      Load All {totalRows - 1} Rows
                    </Button>
                  </Box>
                </Alert>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Please fix the following issues:
                  </Typography>
                  <List dense>
                    {validationErrors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2">Uploading...</Typography>
                    <Typography variant="body2">{uploadProgress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                </Box>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <Alert
                  severity={uploadResult.success ? "success" : "error"}
                  sx={{ mb: 3 }}
                  action={
                    uploadResult.success && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {importType === "emails" && emailReportData && (
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleDownloadEmailReport}
                            startIcon={<CloudDownloadIcon />}
                          >
                            Download Report
                          </Button>
                        )}
                        <Button
                          color="inherit"
                          size="small"
                          onClick={handleClear}
                        >
                          Upload Another
                        </Button>
                      </Box>
                    )
                  }
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {uploadResult.message}
                  </Typography>
                  {uploadResult.stats && (
                    <Box>
                      {importType === "applications" ? (
                        <Typography variant="body2">
                          Total Records: {uploadResult.stats.total} |
                          Successful: {uploadResult.stats.successful} | Failed:{" "}
                          {uploadResult.stats.failed} | Duplicates:{" "}
                          {uploadResult.stats.duplicates}
                        </Typography>
                      ) : importType === "tag-updates" ? (
                        <Typography variant="body2">
                          Total Records: {uploadResult.stats.total} | Updated:{" "}
                          {uploadResult.stats.updated} | Enrolled:{" "}
                          {uploadResult.stats.enrolled} | Not Found:{" "}
                          {uploadResult.stats.notFound} | Failed:{" "}
                          {uploadResult.stats.failed}
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          Total Recipients: {uploadResult.stats.total} | Sent:{" "}
                          {uploadResult.stats.sent} | Failed:{" "}
                          {uploadResult.stats.failed}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {uploadResult.errors?.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Errors:
                      </Typography>
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <Typography key={index} variant="body2">
                          • {error}
                        </Typography>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <Typography variant="body2">
                          ... and {uploadResult.errors.length - 5} more errors
                        </Typography>
                      )}
                    </Box>
                  )}
                </Alert>
              )}
            </CardContent>

            {/* Debug Info - Remove this in production */}
            {selectedFile && (
              <CardContent
                sx={{
                  bgcolor: "grey.50",
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="textSecondary">
                  Debug Info: File: {selectedFile.name} | Type:{" "}
                  {selectedFile.type} | Preview Data: {previewData?.length || 0}{" "}
                  rows | Display Data: {fullData?.length || 0} rows | Total
                  Data: {completeData?.length || 0} rows | Limited:{" "}
                  {dataLimited ? "Yes" : "No"} | Processing:{" "}
                  {processingFile ? "Yes" : "No"}
                </Typography>
              </CardContent>
            )}

            {/* File Processing Status */}
            {processingFile && (
              <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress sx={{ flexGrow: 1 }} />
                  <Typography variant="body2">Processing file...</Typography>
                </Box>
              </Box>
            )}

            {/* Actions */}
            {selectedFile && !uploading && !uploadResult?.success && (
              <CardActions
                sx={{ justifyContent: "space-between", px: 3, pb: 3 }}
              >
                <Box>
                  <Button
                    startIcon={<PreviewIcon />}
                    onClick={() => setShowPreview(true)}
                    disabled={!previewData || processingFile}
                  >
                    Quick Preview
                  </Button>
                  <Button
                    startIcon={<TableViewIcon />}
                    onClick={() => {
                      console.log(
                        "View All Data clicked. FullData:",
                        fullData?.length,
                        "File type:",
                        selectedFile?.type
                      );
                      setShowFullData(true);
                    }}
                    disabled={
                      !fullData || fullData.length <= 1 || processingFile
                    }
                    sx={{ ml: 1 }}
                  >
                    View All Data{" "}
                    {fullData &&
                      fullData.length > 1 &&
                      `(${fullData.length - 1} rows)`}
                  </Button>
                  <Button
                    startIcon={<ClearIcon />}
                    onClick={handleClear}
                    sx={{ ml: 1 }}
                    disabled={processingFile}
                  >
                    Clear
                  </Button>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={handleUpload}
                  disabled={validationErrors.length > 0 || processingFile}
                >
                  {importType === "applications"
                    ? "Import Applications"
                    : importType === "tags"
                    ? "Update Tags"
                    : "Send Emails"}
                </Button>
              </CardActions>
            )}
          </Card>

          {/* Import History */}
          {importHistory.length > 0 && (
            <Card elevation={2} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Imports
                </Typography>
                <List>
                  {importHistory.slice(0, 5).map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemIcon>
                        {item.status === "success" ? (
                          <SuccessIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.fileName}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {item.uploadDate} • {item.recordsProcessed}{" "}
                              records
                            </Typography>
                            <Chip
                              label={
                                item.importType === "tags"
                                  ? "Tag Updates"
                                  : "New Applications"
                              }
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <Chip
                        label={item.status}
                        color={item.status === "success" ? "success" : "error"}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Full Data Table View */}
        {fullData && fullData.length > 1 && showFullData && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Complete Data View - {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Showing: {fullData.length - 1} records | Total in file:{" "}
                      {totalRows - 1} records | Columns:{" "}
                      {fullData[0]?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      File Type: {selectedFile.type || "Unknown"} | Size:{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      {dataLimited &&
                        " | Click 'Load All Rows' in the warning above to see everything"}
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<ClearIcon />}
                    onClick={() => setShowFullData(false)}
                    size="small"
                  >
                    Hide Table
                  </Button>
                </Box>

                <TableContainer
                  sx={{ maxHeight: 600, border: 1, borderColor: "divider" }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: "bold",
                            minWidth: 60,
                          }}
                        >
                          #
                        </TableCell>
                        {fullData[0]?.map((header, index) => (
                          <TableCell
                            key={index}
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: "bold",
                              minWidth: 120,
                              maxWidth: 200,
                            }}
                          >
                            {header || `Column ${index + 1}`}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fullData.slice(1).map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          sx={{
                            "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                            "&:hover": { bgcolor: "action.selected" },
                          }}
                        >
                          <TableCell
                            sx={{ fontWeight: "bold", bgcolor: "grey.100" }}
                          >
                            {rowIndex + 1}
                          </TableCell>
                          {/* Ensure we render cells for all columns even if row is shorter */}
                          {Array.from(
                            { length: fullData[0]?.length || 0 },
                            (_, cellIndex) => (
                              <TableCell
                                key={cellIndex}
                                sx={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={row[cellIndex] || ""} // Show full content on hover
                              >
                                {row[cellIndex] || "-"}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {fullData.length > 500 && (
                  <Box mt={2} p={2} bgcolor="info.light" borderRadius={1}>
                    <Typography variant="body2" color="info.dark">
                      <strong>Performance Note:</strong> Large datasets with{" "}
                      {fullData.length - 1} rows are displayed. The system can
                      process up to 2000+ rows for email campaigns efficiently.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Instructions and Template */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              {importType === "applications" ? (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        1.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Download the template file with required columns"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        2.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Fill in student data using the provided format"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        3.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Include required fields: FirstName, LastName, Email/Phone, Course"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        4.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Save as CSV or Excel file and upload"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                </List>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        1.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Download the tag update template"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        2.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Fill in registration numbers and corresponding tags"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        3.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Use 'green' tag to promote ADMITTED status to ENROLLED"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight="bold">
                        4.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary="Only existing applications with matching Reg No. will be updated"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                      }}
                    />
                  </ListItem>
                </List>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {importType === "applications"
                  ? "File Requirements"
                  : "Tag Update Requirements"}
              </Typography>
              {importType === "applications" ? (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="CSV or Excel format"
                      secondary="(.csv, .xlsx, .xls)"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Maximum 10MB file size"
                      secondary="For larger files, split into multiple uploads"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Required columns"
                      secondary="FirstName, LastName, Email or Phone No., Course"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Duplicate detection"
                      secondary="Skips existing records by email/phone"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Auto-admitted status"
                      secondary="All imported records get ADMITTED status"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                </List>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="CSV or Excel format"
                      secondary="(.csv, .xlsx, .xls)"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Required columns"
                      secondary="Reg No. and Tags columns are mandatory"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Green tag promotion"
                      secondary="Green tags change ADMITTED to ENROLLED status"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Existing records only"
                      secondary="Only updates applications that already exist"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tag tracking"
                      secondary="All tag updates are logged in application timeline"
                      sx={{
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                        },
                        "& .MuiListItemText-secondary": {
                          color: "text.secondary",
                        },
                      }}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {previewData[0]?.map((header, index) => (
                      <TableCell key={index} sx={{ fontWeight: "bold" }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.slice(1, 6).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {previewData && previewData.length > 6 && (
            <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
              Showing first 5 rows. Total rows in file: {previewData.length - 1}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ImportData;
