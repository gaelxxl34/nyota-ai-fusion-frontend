import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
  Divider,
  Paper,
  CircularProgress,
  Chip,
  Alert,
  Skeleton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
  Cancel as CancelIcon,
  Launch as LaunchIcon,
  PhotoCamera,
} from "@mui/icons-material";
import applicationService from "../../services/applicationService";
import { useAuth } from "../../contexts/AuthContext";
import { COUNTRIES } from "../common/CountrySelect";

const ApplicationDetailsDialog = ({
  open,
  onClose,
  leadId,
  applicationId,
  email,
}) => {
  const { getUserRole, user } = useAuth();
  const userRole = getUserRole();

  console.log("ApplicationDetailsDialog - User role:", userRole);
  console.log("ApplicationDetailsDialog - Open:", open);
  console.log("ApplicationDetailsDialog - Email:", email);

  // Tag configuration
  const AVAILABLE_TAGS = [
    {
      value: "no_proper_respond",
      label: "No proper respond",
      color: "#f5f5f5",
      textColor: "#000",
    },
    { value: "paid", label: "Paid", color: "#4caf50", textColor: "#000" },
    {
      value: "going_to_pay",
      label: "Going to pay",
      color: "#e91e63",
      textColor: "#000",
    },
    {
      value: "scholarship_request",
      label: "Scholarship request",
      color: "#f44336",
      textColor: "#000",
    },
  ];

  // Helper function to get tag configuration by value
  const getTagConfig = (tagValue) => {
    return AVAILABLE_TAGS.find((tag) => tag.value === tagValue) || null;
  };

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
    isFileError: false,
  });
  const [documentPreview, setDocumentPreview] = useState({
    open: false,
    url: "",
    title: "",
    type: "",
  });

  // Store any object URLs created for file previews so we can revoke them later
  const filePreviewUrls = useRef([]);

  // Check if user can edit applications
  const canEditApplication = () => {
    console.log("Current user role:", userRole);
    console.log("User object:", user);
    console.log("Checking edit permissions...");

    // Marketing agents and admins can only view (no editing)
    const restrictedRoles = ["marketingAgent", "admin"];
    const canEdit = !restrictedRoles.includes(userRole);

    console.log("Restricted roles:", restrictedRoles);
    console.log(
      "User role in restricted list:",
      restrictedRoles.includes(userRole)
    );
    console.log("Can edit result:", canEdit);

    return canEdit;
  };

  // Cleanup function for file preview URLs
  useEffect(() => {
    return () => {
      // Clean up all created object URLs when component unmounts
      filePreviewUrls.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      filePreviewUrls.current = [];
    };
  }, []);

  // Handler for opening documents in a new window or in a dialog
  const handleViewDocument = async (documentUrl, displayName) => {
    // Use email to fetch application if applicationId is not available
    if (!applicationId && !email) {
      console.error(
        "Cannot view document: No application ID or email available"
      );
      setError(
        `Unable to view ${displayName}: No application reference available.`
      );
      return;
    }

    try {
      // Show loading indicator
      setLoading(true);

      // Map display names to document types for the API
      const documentTypeMap = {
        "Passport Photo": "passportPhoto",
        "Academic Documents": "academicDocuments",
        "ID Document": "identificationDocument",
      };

      const documentType = documentTypeMap[displayName];

      console.log(`Mapped document type for '${displayName}': ${documentType}`);
      console.log(
        `Document URL passed: ${documentUrl || "none - will fetch from server"}`
      );

      if (!documentType) {
        throw new Error(`Unknown document type: ${displayName}`);
      }

      let response;

      if (applicationId) {
        console.log(
          `Fetching document from backend for application ${applicationId}, type: ${documentType}`
        );
        // Fetch document URL from the new endpoint using applicationId
        response = await applicationService.getApplicationDocument(
          applicationId,
          documentType
        );
      } else if (email) {
        console.log(
          `Fetching document using email ${email} for type: ${documentType}`
        );
        // Use the new email-based document fetching method
        response = await applicationService.getApplicationDocumentByEmail(
          email,
          documentType
        );
      }

      console.log(`Document response for ${displayName}:`, response);

      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to retrieve document");
      }

      const resolvedUrl = response.url;
      const isBase64 = resolvedUrl && resolvedUrl.startsWith("data:");
      const isPdf =
        resolvedUrl &&
        (resolvedUrl.includes("application/pdf") ||
          resolvedUrl.toLowerCase().endsWith(".pdf"));
      const isImage =
        resolvedUrl &&
        (resolvedUrl.includes("image/") ||
          /\.(jpe?g|png|gif|bmp|webp)$/i.test(resolvedUrl));

      if (!resolvedUrl) {
        throw new Error(`No URL provided for ${displayName}`);
      }

      console.log(`Retrieved ${displayName} URL:`, resolvedUrl);

      // For Academic Documents or any PDF/image, use the dialog approach
      if (
        displayName === "Academic Documents" ||
        isPdf ||
        isImage ||
        isBase64
      ) {
        // Open in dialog/modal instead of a popup window
        setDocumentPreview({
          open: true,
          url: resolvedUrl,
          title: displayName,
          type: isPdf ? "pdf" : isImage ? "image" : "iframe",
        });
        setLoading(false);
        return;
      }

      // For other types, try to open in a new tab with direct URL
      const newTab = window.open(resolvedUrl, "_blank");

      if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
        console.warn("Tab opening was blocked. Falling back to dialog view.");
        // Fall back to dialog view
        setDocumentPreview({
          open: true,
          url: resolvedUrl,
          title: displayName,
          type: "iframe",
        });
      }
    } catch (err) {
      console.error(`Error opening ${displayName}:`, err);

      // Try direct approach as a fallback
      console.log("Trying direct approach to fetch document...");
      try {
        // Map display names to document types for the API
        const fallbackDocumentTypeMap = {
          "Passport Photo": "passportPhoto",
          "Academic Documents": "academicDocuments",
          "ID Document": "identificationDocument",
        };

        const apiBaseUrl =
          process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

        let directUrl;
        if (applicationId) {
          directUrl = `${apiBaseUrl}/api/applications/${applicationId}/document/${fallbackDocumentTypeMap[displayName]}`;
        } else if (email) {
          // For email-based approach, we need to get the application first
          const applicationsResponse =
            await applicationService.getApplicationsByEmail(email);
          if (
            applicationsResponse.success &&
            applicationsResponse.data &&
            applicationsResponse.data.length > 0
          ) {
            const latestApplication = applicationsResponse.data[0];
            directUrl = `${apiBaseUrl}/api/applications/${latestApplication.id}/document/${fallbackDocumentTypeMap[displayName]}`;
          } else {
            throw new Error("No applications found for email in fallback");
          }
        }

        console.log(`Direct URL: ${directUrl}`);
        const fetchResponse = await fetch(directUrl);
        console.log(`Direct fetch status: ${fetchResponse.status}`);

        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          console.log(`Direct fetch successful:`, data);

          if (data.url) {
            console.log(`Opening direct URL: ${data.url}`);
            // Use our dialog approach instead of window.open
            setDocumentPreview({
              open: true,
              url: data.url,
              title: displayName,
              type: data.url.includes("application/pdf")
                ? "pdf"
                : data.url.includes("image/")
                ? "image"
                : "iframe",
            });
            return;
          }
        } else {
          console.error(
            `Direct fetch failed with status: ${fetchResponse.status}`
          );
        }
      } catch (directError) {
        console.error("Direct fetch attempt failed:", directError);
      }

      setError(`Failed to open ${displayName}. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler to show file error dialog
  const showFileErrorDialog = (message) => {
    setErrorDialog({
      open: true,
      message,
      isFileError: true,
    });
  };

  // Handler to close the error dialog
  const handleCloseErrorDialog = () => {
    setErrorDialog({
      ...errorDialog,
      open: false,
    });
  };

  // Handler to close the document preview dialog
  const handleCloseDocumentPreview = () => {
    setDocumentPreview({
      open: false,
      url: "",
      title: "",
      type: "",
    });
  };

  // Helper function to format dates for display purposes only
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const dateTimeOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    try {
      // Handle Date objects
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString("en-US", dateTimeOptions);
      }

      // Handle Firestore Timestamps or similar objects with seconds
      if (
        typeof dateValue === "object" &&
        (dateValue.seconds || dateValue._seconds)
      ) {
        const seconds = dateValue.seconds || dateValue._seconds;
        return new Date(seconds * 1000).toLocaleString(
          "en-US",
          dateTimeOptions
        );
      }

      // Handle string dates and ISO format
      if (typeof dateValue === "string") {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("en-US", dateTimeOptions);
        }
        return dateValue;
      }

      // Handle timestamp numbers
      if (typeof dateValue === "number") {
        return new Date(dateValue).toLocaleString("en-US", dateTimeOptions);
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }

    return typeof dateValue === "string" ? dateValue : "N/A";
  };

  // Helper function to sanitize Firestore timestamp objects throughout the data
  const sanitizeFirestoreTimestamps = (data) => {
    if (!data) return data;

    // Create a deep copy to avoid mutating the original
    const result = JSON.parse(
      JSON.stringify(data, (key, value) => {
        // Check for Firestore timestamp objects
        if (
          value &&
          typeof value === "object" &&
          value._seconds !== undefined &&
          value._nanoseconds !== undefined
        ) {
          // Convert to ISO string format
          return new Date(value._seconds * 1000).toISOString();
        }
        return value;
      })
    );

    return result;
  };

  // Helper function to fetch application data
  const fetchApplicationData = useCallback(async () => {
    if (!open) return;
    if (!applicationId && !leadId && !email) return;

    setLoading(true);
    setError("");

    try {
      let response;
      console.log("Fetching application data:", {
        applicationId,
        leadId,
        email,
      });

      // Priority order: 1. applicationId, 2. email, 3. leadId
      if (applicationId) {
        console.log("Fetching by applicationId:", applicationId);
        response = await applicationService.getApplication(applicationId);
      } else if (email) {
        console.log("Fetching by email:", email);
        const emailResponse = await applicationService.getApplicationsByEmail(
          email
        );
        if (
          emailResponse &&
          emailResponse.success &&
          emailResponse.data &&
          emailResponse.data.length > 0
        ) {
          // Use the most recent application
          const latestApplication = emailResponse.data[0];
          response = {
            success: true,
            data: latestApplication,
          };
        } else {
          response = {
            success: false,
            message: "No applications found for this email",
          };
        }
      }
      // If no applicationId or email but leadId is available, fetch by leadId
      else if (leadId) {
        console.log("Fetching by leadId:", leadId);
        response = await applicationService.getApplicationByLeadId(leadId);
      }

      console.log("Application API response:", response);

      if (response && response.success) {
        const applicationData = response.data.data || response.data;
        console.log("Application data loaded:", applicationData);

        // Process the data to handle timestamp objects
        const processedData = sanitizeFirestoreTimestamps(applicationData);

        // Set application state
        setApplication(processedData);

        // Initialize form data with a deep copy of application data to avoid reference issues
        const initialFormData = JSON.parse(JSON.stringify(applicationData));

        // Enhanced field mapping to handle different field names between frontend and backend
        const fieldMappings = {
          // Program mappings
          intake: "preferredIntake",
          program: "preferredProgram",

          // Personal info mappings
          countryOfBirth: "countryOfBirth",
          gender: "gender",
          modeOfStudy: "modeOfStudy",
          postalAddress: "postalAddress",

          // Document mappings
          passportPhoto: "passportPhoto",
          academicDocuments: "academicDocuments",
          identificationDocument: "identificationDocument",

          // Sponsor info mappings
          sponsorEmail: "sponsorEmail",
          sponsorTelephone: "sponsorTelephone",
          sponsorPhone: "sponsorTelephone", // Alternative field name

          // Additional info
          howDidYouHear: "howDidYouHear",
          additionalNotes: "additionalNotes",

          // Bio data mappings - use original field names for direct display
          registrationNumber: "registrationNumber",
          faculty: "faculty",
          dateOfBirth: "dateOfBirth",
          company: "company", // Use original company field
          companyLocation: "companyLocation", // Use original companyLocation field
          idType: "idType",
          uaceLevel: "uaceLevel",
          uaceLevelResults: "uaceLevelResults",
          otherDocuments: "otherDocuments",
          equating: "equating",
        };

        // Apply field mappings to ensure all data is available
        Object.keys(fieldMappings).forEach((sourceField) => {
          const targetField = fieldMappings[sourceField];
          if (applicationData[sourceField] && !initialFormData[targetField]) {
            initialFormData[targetField] = applicationData[sourceField];
          }
        });

        // Add mock data for More Bio Data fields if they don't exist
        if (!initialFormData.dateOfBirth) {
          initialFormData.dateOfBirth = "1998-05-15";
        }
        if (!initialFormData.registrationNumber) {
          initialFormData.registrationNumber = "REG/2024/001234";
        }
        if (!initialFormData.faculty) {
          initialFormData.faculty = "";
        }
        if (!initialFormData.idType) {
          initialFormData.idType = "";
        }
        if (!initialFormData.equating) {
          initialFormData.equating = "UNEB Equivalent - Grade A";
        }
        if (!initialFormData.company) {
          initialFormData.company = "Kampala International School";
        }
        if (!initialFormData.companyLocation) {
          initialFormData.companyLocation = "Kampala, Central Region";
        }
        if (!initialFormData.uaceLevel) {
          initialFormData.uaceLevel = "A-Level";
        }
        if (!initialFormData.uaceLevelResults) {
          initialFormData.uaceLevelResults =
            "AAB (Mathematics-A, Physics-A, Chemistry-B)";
        }
        if (!initialFormData.uceLevel) {
          initialFormData.uceLevel = "O-Level";
        }
        if (!initialFormData.otherDocuments) {
          initialFormData.otherDocuments =
            "Certificate in Computer Applications (ICDL), First Aid Certificate from Red Cross Uganda, Leadership Training Certificate from Youth Leadership Program 2023";
        }

        console.log("Setting initial form data:", initialFormData);
        setFormData(initialFormData);
      } else {
        console.error("Failed to fetch application data:", response);
        setError("No application data found");
      }
    } catch (err) {
      console.error("Error fetching application data:", err);
      setError("An error occurred while loading application details");
    } finally {
      setLoading(false);
    }
  }, [open, applicationId, leadId, email]);

  useEffect(() => {
    // Use the fetchApplicationData function that's defined above
    fetchApplicationData();
  }, [fetchApplicationData, open, applicationId, leadId, email]);

  const handleEditApplication = () => {
    // Initialize form data with current application data
    if (application) {
      const initialFormData = { ...application };

      // Make sure to map any fields that might have different names
      if (application.intake && !application.preferredIntake) {
        initialFormData.preferredIntake = application.intake;
      }

      if (application.program && !application.preferredProgram) {
        initialFormData.preferredProgram = application.program;
      }

      // Add mock data for More Bio Data fields if they don't exist
      if (!initialFormData.dateOfBirth) {
        initialFormData.dateOfBirth = "1998-05-15";
      }
      if (!initialFormData.registrationNumber) {
        initialFormData.registrationNumber = "REG/2024/001234";
      }
      if (!initialFormData.equating) {
        initialFormData.equating = "UNEB Equivalent - Grade A";
      }
      if (!initialFormData.company) {
        initialFormData.company = "Kampala International School";
      }
      if (!initialFormData.companyLocation) {
        initialFormData.companyLocation = "Kampala, Central Region";
      }
      if (!initialFormData.uaceLevel) {
        initialFormData.uaceLevel = "A-Level";
      }
      if (!initialFormData.uaceLevelResults) {
        initialFormData.uaceLevelResults =
          "AAB (Mathematics-A, Physics-A, Chemistry-B)";
      }
      if (!initialFormData.uceLevel) {
        initialFormData.uceLevel = "O-Level";
      }
      if (!initialFormData.otherDocuments) {
        initialFormData.otherDocuments =
          "Certificate in Computer Applications (ICDL), First Aid Certificate from Red Cross Uganda, Leadership Training Certificate from Youth Leadership Program 2023";
      }

      console.log("Initializing edit mode with data:", initialFormData);
      setFormData(initialFormData);
    } else {
      // No application data, start with an empty form but include mock bio data
      const mockFormData = {
        dateOfBirth: "1998-05-15",
        registrationNumber: "REG/2024/001234",
        faculty: "",
        idType: "",
        equating: "UNEB Equivalent - Grade A",
        company: "Kampala International School",
        companyLocation: "Kampala, Central Region",
        uaceLevel: "A-Level",
        uaceLevelResults: "AAB (Mathematics-A, Physics-A, Chemistry-B)",
        uceLevel: "O-Level",
        otherDocuments:
          "Certificate in Computer Applications (ICDL), First Aid Certificate from Red Cross Uganda, Leadership Training Certificate from Youth Leadership Program 2023",
      };
      setFormData(mockFormData);
    }

    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);

    // Clean up any created object URLs
    filePreviewUrls.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    filePreviewUrls.current = [];

    // Reset form data to original application data
    setFormData(application || {});
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form field changed: ${name} = ${value}`);

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  // Handler for tag selection - single select
  const handleTagChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      tag: value, // Single tag instead of array
    });
  };

  const validateForm = () => {
    const errors = {};

    console.log("Validating form data:", formData);

    // Required fields validation
    const requiredFields = ["name", "email", "phoneNumber", "preferredProgram"];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation - basic check for minimum length
    if (formData.phoneNumber && formData.phoneNumber.length < 8) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    console.log("Validation errors:", errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Maximum file size limits in bytes for each document type
  // Updated to 10MB limit for all document types since we're using Firebase Storage
  const MAX_PASSPORT_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB for passport photo
  const MAX_ACADEMIC_DOCS_SIZE = 10 * 1024 * 1024; // 10MB for academic documents
  const MAX_ID_DOC_SIZE = 10 * 1024 * 1024; // 10MB for identification document

  // Helper function to check file size against appropriate limit based on file type
  const isFileTooLarge = (file, fileType) => {
    if (!file) return false;

    let sizeLimit;
    switch (fileType) {
      case "passportPhoto":
        sizeLimit = MAX_PASSPORT_PHOTO_SIZE;
        break;
      case "academicDocuments":
        sizeLimit = MAX_ACADEMIC_DOCS_SIZE;
        break;
      case "identificationDocument":
        sizeLimit = MAX_ID_DOC_SIZE;
        break;
      default:
        sizeLimit = Math.min(
          MAX_PASSPORT_PHOTO_SIZE,
          MAX_ACADEMIC_DOCS_SIZE,
          MAX_ID_DOC_SIZE
        );
    }

    return file.size > sizeLimit;
  };

  // Helper function to convert file to base64 with size validation
  const fileToBase64 = (file, fileType = null) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      // Get the appropriate size limit based on document type
      let sizeLimit;
      switch (fileType) {
        case "passportPhoto":
          sizeLimit = MAX_PASSPORT_PHOTO_SIZE;
          break;
        case "academicDocuments":
          sizeLimit = MAX_ACADEMIC_DOCS_SIZE;
          break;
        case "identificationDocument":
          sizeLimit = MAX_ID_DOC_SIZE;
          break;
        default:
          sizeLimit = Math.min(
            MAX_PASSPORT_PHOTO_SIZE,
            MAX_ACADEMIC_DOCS_SIZE,
            MAX_ID_DOC_SIZE
          );
      }

      // Check file size before conversion
      if (isFileTooLarge(file, fileType)) {
        // For large files, we'll compress the image if it's an image type
        if (file.type.startsWith("image/")) {
          console.log(
            `File too large (${(file.size / 1024).toFixed(
              0
            )}KB). Compressing...`
          );
          compressImage(file, sizeLimit)
            .then((compressedFile) => {
              const reader = new FileReader();
              reader.readAsDataURL(compressedFile);
              reader.onload = () => resolve(reader.result);
              reader.onerror = (error) => reject(error);
            })
            .catch((error) => {
              console.error("Compression failed:", error);
              reject(
                new Error(
                  `File is too large (${(file.size / 1024).toFixed(
                    0
                  )}KB). Maximum size is ${(sizeLimit / 1024).toFixed(0)}KB.`
                )
              );
            });
        } else {
          // If not an image, reject with size error
          reject(
            new Error(
              `File is too large (${(file.size / 1024).toFixed(
                0
              )}KB). Maximum size is ${(sizeLimit / 1024).toFixed(0)}KB.`
            )
          );
        }
      } else {
        // File is within size limit, proceed normally
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      }
    });
  };

  // Helper function to compress images
  const compressImage = (file, targetSize) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          // Adjust dimensions based on file size vs target size
          const sizeRatio = file.size / targetSize;
          let maxDimension = 1200; // Default max dimension

          // For very large files, reduce dimensions more aggressively
          if (sizeRatio > 4) {
            maxDimension = 800; // Much smaller for very large files
          } else if (sizeRatio > 2) {
            maxDimension = 1000; // Smaller for large files
          }

          if (width > height && width > maxDimension) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Adjust quality based on file size vs target size
          let quality = 0.8; // Start with 80% quality for most files

          if (sizeRatio > 5) {
            quality = 0.4; // Very aggressive compression for extremely large files
          } else if (sizeRatio > 3) {
            quality = 0.5; // More aggressive compression for very large files
          } else if (sizeRatio > 1.5) {
            quality = 0.7; // Some compression for moderately large files
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create a new file from the compressed blob
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });

                console.log(
                  `Compressed from ${(file.size / 1024).toFixed(0)}KB to ${(
                    compressedFile.size / 1024
                  ).toFixed(0)}KB`
                );

                // If still too large, try again with lower quality or reject
                if (compressedFile.size > targetSize) {
                  if (quality > 0.2) {
                    // Try again with lower quality
                    const newQuality = Math.max(0.2, quality - 0.2);
                    console.log(
                      `Still too large, retrying with quality: ${newQuality.toFixed(
                        1
                      )}`
                    );
                    canvas.toBlob(
                      (blob) => {
                        if (blob) {
                          const finalCompressedFile = new File(
                            [blob],
                            file.name,
                            {
                              type: file.type,
                              lastModified: Date.now(),
                            }
                          );
                          console.log(
                            `Final compression: ${(
                              finalCompressedFile.size / 1024
                            ).toFixed(0)}KB (target: ${(
                              targetSize / 1024
                            ).toFixed(0)}KB)`
                          );

                          if (finalCompressedFile.size > targetSize) {
                            // Last attempt with even more aggressive settings
                            const smallerCanvas =
                              document.createElement("canvas");
                            const scaleFactor =
                              Math.sqrt(targetSize / finalCompressedFile.size) *
                              0.9; // Scale dimensions to reduce area
                            smallerCanvas.width = Math.max(
                              300,
                              Math.floor(width * scaleFactor)
                            );
                            smallerCanvas.height = Math.max(
                              300,
                              Math.floor(height * scaleFactor)
                            );

                            const smallerCtx = smallerCanvas.getContext("2d");
                            smallerCtx.drawImage(
                              img,
                              0,
                              0,
                              smallerCanvas.width,
                              smallerCanvas.height
                            );

                            smallerCanvas.toBlob(
                              (finalBlob) => {
                                if (finalBlob) {
                                  const ultimateCompressedFile = new File(
                                    [finalBlob],
                                    file.name,
                                    {
                                      type: file.type,
                                      lastModified: Date.now(),
                                    }
                                  );
                                  console.log(
                                    `Ultimate compression: ${(
                                      ultimateCompressedFile.size / 1024
                                    ).toFixed(0)}KB`
                                  );
                                  resolve(ultimateCompressedFile);
                                } else {
                                  resolve(finalCompressedFile); // Use the previous result if this fails
                                }
                              },
                              file.type,
                              0.2
                            );
                          } else {
                            resolve(finalCompressedFile);
                          }
                        } else {
                          reject(new Error("Failed to compress image"));
                        }
                      },
                      file.type,
                      newQuality
                    );
                  } else {
                    reject(
                      new Error(
                        `File is still too large after compression (${(
                          compressedFile.size / 1024
                        ).toFixed(0)}KB, target: ${(targetSize / 1024).toFixed(
                          0
                        )}KB)`
                      )
                    );
                  }
                } else {
                  resolve(compressedFile);
                }
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error("Failed to load image for compression"));
        };
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file for compression"));
      };
    });
  };

  const handleSaveApplication = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Check if only status/management fields changed for optimized update
      const statusOnlyChange =
        formData.status !== application.status &&
        formData.name === application.name &&
        formData.email === application.email &&
        formData.phoneNumber === application.phoneNumber &&
        formData.preferredProgram === application.preferredProgram;

      // If only status changed, use the dedicated status update endpoint
      if (statusOnlyChange && applicationId) {
        console.log("Status-only update detected, using dedicated endpoint...");

        // Prepare updatedBy information
        const updatedBy = {
          email: user?.email || "unknown@system.com",
          name:
            user?.displayName || user?.name || user?.email || "Unknown User",
          role: userRole || "unknown",
          timestamp: new Date().toISOString(),
          uid: user?.uid || null,
        };

        const statusUpdateResponse =
          await applicationService.updateApplicationStatus(
            applicationId,
            formData.status,
            formData.statusNote || `Status updated to ${formData.status}`,
            updatedBy
          );

        if (statusUpdateResponse && statusUpdateResponse.success) {
          console.log(
            "Application status updated successfully:",
            statusUpdateResponse.data
          );
          setEditMode(false);
          // Re-fetch application data to ensure we have the most up-to-date information
          await fetchApplicationData();
          return;
        } else {
          throw new Error(
            "Status update failed: " +
              (statusUpdateResponse.message || "Unknown error")
          );
        }
      }

      // Create data to send for full update - filter out undefined values
      const dataToSend = {};

      // Only include defined values to avoid backend Firestore errors
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined) {
          dataToSend[key] = formData[key];
        }
      });

      // Use ISO format for consistency with the backend and lead documents
      dataToSend.updatedAt = new Date().toISOString();

      // Add updatedBy information for audit trail
      dataToSend.updatedBy = {
        email: user?.email || "unknown@system.com",
        name: user?.displayName || user?.name || user?.email || "Unknown User",
        role: userRole || "unknown",
        timestamp: new Date().toISOString(),
        uid: user?.uid || null,
      };

      // Remove preview URL
      delete dataToSend.passportPhotoPreview;

      console.log("Converting files to base64...");

      try {
        // Convert passport photo to base64
        if (dataToSend.passportPhoto instanceof File) {
          console.log("Converting passport photo to base64...");
          dataToSend.passportPhoto = await fileToBase64(
            dataToSend.passportPhoto,
            "passportPhoto"
          );
        }

        // Convert academic documents to base64
        if (dataToSend.academicDocuments instanceof File) {
          console.log("Converting academic documents to base64...");
          dataToSend.academicDocuments = await fileToBase64(
            dataToSend.academicDocuments,
            "academicDocuments"
          );
        }

        // Convert identification documents to base64
        if (dataToSend.identificationDocument instanceof File) {
          console.log("Converting identification documents to base64...");
          dataToSend.identificationDocument = await fileToBase64(
            dataToSend.identificationDocument,
            "identificationDocument"
          );
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setError(error.message);
        setSaving(false);
        return;
      }

      console.log("Saving application data with files converted to base64...");

      // Create config to handle JSON data
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      let response;

      // Determine which identifier to use for update
      if (applicationId) {
        response = await applicationService.updateApplication(
          applicationId,
          dataToSend,
          config
        );
      } else if (email) {
        // Use the new email-based update method
        response = await applicationService.updateApplicationByEmail(
          email,
          dataToSend,
          config
        );
      } else {
        throw new Error("Cannot update: No application identifier available");
      }

      if (response && response.success) {
        console.log("Application updated successfully:", response.data);
        setEditMode(false);

        // Re-fetch application data to ensure we have the most up-to-date information
        await fetchApplicationData();
      } else {
        console.error("Failed to update application:", response);
        setError(
          "Failed to save changes: " +
            (response ? response.message : "Unknown error")
        );
      }
    } catch (err) {
      console.error("Error updating application:", err);
      setError("An error occurred while saving changes");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to display program name
  const getProgramName = (program) => {
    if (!program) return "Not available";

    if (typeof program === "object" && program !== null) {
      return program.name || program.code || "Unknown Program";
    }

    // Use the new getProgramLabel function for consistent naming
    if (typeof program === "string") {
      return getProgramLabel(program) || program;
    }

    return "Unknown Program";
  };

  // Helper function to get the formatted program name
  const getProgramLabel = (programValue) => {
    // Since we now store full program names directly, just return the value
    return programValue || "Program Not Specified";
  };

  return (
    <Dialog
      open={open}
      onClose={editMode ? undefined : onClose} // Prevent closing when in edit mode
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {editMode ? "Edit Application" : "Application Details"}
            {(loading || saving) && (
              <CircularProgress size={20} sx={{ ml: 2 }} />
            )}
          </Typography>
          <Box>
            {!editMode && canEditApplication() && (
              <IconButton onClick={handleEditApplication} disabled={loading}>
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={editMode ? handleCancelEdit : onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ height: "550px" }}>
            {/* Application skeleton */}
            <Paper
              sx={{ p: 2, mb: 3, bgcolor: "primary.light", color: "white" }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={32}
                    sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
                  />
                </Grid>
                <Grid item>
                  <Skeleton
                    variant="rounded"
                    width={100}
                    height={32}
                    sx={{ bgcolor: "rgba(255,255,255,0.3)" }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Personal info skeleton */}
            <Typography variant="h6" gutterBottom>
              <Skeleton width="30%" />
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="70%" height={28} />
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Academic info skeleton */}
            <Typography variant="h6" gutterBottom>
              <Skeleton width="35%" />
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="text" width="50%" height={20} />
                  <Skeleton variant="text" width="65%" height={28} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This lead has an APPLIED status but no application record was
              found. This might happen if:
              <ul>
                <li>
                  The application was deleted but the lead status wasn't updated
                </li>
                <li>
                  The lead was manually marked as APPLIED without creating an
                  application
                </li>
              </ul>
              You may want to update the lead status or create a new application
              for this lead.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleEditApplication}
            >
              Create New Application
            </Button>
          </Box>
        ) : application ? (
          <Box>
            {/* Application Status Banner */}
            <Paper
              sx={{ p: 2, mb: 3, bgcolor: "primary.light", color: "white" }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Typography variant="h6">
                    Application #{application.applicationNumber}
                  </Typography>
                  {/* Display tag in view mode */}
                  {!editMode && application.tag && (
                    <Box sx={{ mt: 1 }}>
                      {(() => {
                        const tagConfig = getTagConfig(application.tag);
                        return (
                          <Chip
                            label={
                              tagConfig ? tagConfig.label : application.tag
                            }
                            size="small"
                            sx={{
                              backgroundColor: tagConfig
                                ? tagConfig.color
                                : "#f5f5f5",
                              color: "#000 !important",
                              fontWeight: "medium",
                              border: "1px solid rgba(255,255,255,0.3)",
                            }}
                          />
                        );
                      })()}
                    </Box>
                  )}
                </Grid>

                {application.status && (
                  <Grid item>
                    <Chip
                      label={`Status: ${application.status
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}`}
                      sx={{
                        bgcolor: "warning.main",
                        color: "white",
                        fontWeight: "bold",
                        mr: 1,
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Personal Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Personal Information
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                {editMode ? (
                  // Edit mode - show form fields
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <PhoneInput
                          international
                          defaultCountry="UG"
                          value={formData.phoneNumber || ""}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              phoneNumber: value,
                            }))
                          }
                          placeholder="Enter phone number"
                          style={{
                            "--PhoneInputCountrySelectArrow-color": "#666",
                            "--PhoneInputCountrySelectArrow-opacity": "0.8",
                          }}
                          className={`phone-input-custom ${
                            formErrors.phoneNumber ? "error" : ""
                          }`}
                        />
                        {formErrors.phoneNumber && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            {formErrors.phoneNumber}
                          </Typography>
                        )}
                        <style jsx>{`
                          .phone-input-custom {
                            width: 100%;
                            border: 1px solid #c4c4c4;
                            border-radius: 4px;
                            padding: 16.5px 14px;
                            font-size: 16px;
                            font-family: "Roboto", "Helvetica", "Arial",
                              sans-serif;
                            background-color: #fff;
                            transition: border-color 0.15s ease-in-out;
                          }
                          .phone-input-custom:hover {
                            border-color: #000;
                          }
                          .phone-input-custom:focus-within {
                            border-color: #1976d2;
                            border-width: 2px;
                            outline: none;
                          }
                          .phone-input-custom.error {
                            border-color: #d32f2f;
                          }
                          .phone-input-custom .PhoneInputInput {
                            border: none;
                            outline: none;
                            font-size: 16px;
                            font-family: "Roboto", "Helvetica", "Arial",
                              sans-serif;
                            background: transparent;
                            flex: 1;
                            margin-left: 8px;
                          }
                          .phone-input-custom .PhoneInputCountrySelect {
                            border: none;
                            background: transparent;
                            margin-right: 8px;
                          }
                          .phone-input-custom .PhoneInputCountrySelectArrow {
                            border-top-color: var(
                              --PhoneInputCountrySelectArrow-color
                            );
                            opacity: var(
                              --PhoneInputCountrySelectArrow-opacity
                            );
                          }
                          .phone-input-custom .PhoneInputCountryIcon {
                            width: 24px;
                            height: 18px;
                          }
                        `}</style>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="gender-select-label">Gender</InputLabel>
                        <Select
                          labelId="gender-select-label"
                          name="gender"
                          value={formData.gender || ""}
                          onChange={handleInputChange}
                          label="Gender"
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="country-of-birth-label">
                          Country of Birth
                        </InputLabel>
                        <Select
                          labelId="country-of-birth-label"
                          name="countryOfBirth"
                          value={formData.countryOfBirth || ""}
                          onChange={handleInputChange}
                          label="Country of Birth"
                        >
                          <MenuItem value="">
                            <em>Select Country</em>
                          </MenuItem>
                          {COUNTRIES.map((country) => (
                            <MenuItem key={country} value={country}>
                              {country}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Physical Address"
                        name="postalAddress"
                        value={formData.postalAddress || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </>
                ) : (
                  // View mode - show data
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body1">
                        {application.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {application.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1">
                        {application.phoneNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gender
                      </Typography>
                      <Typography variant="body1">
                        {application.gender || "Not specified"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Country of Birth
                      </Typography>
                      <Typography variant="body1">
                        {application.countryOfBirth || "Not specified"}
                      </Typography>
                    </Grid>
                    {application.postalAddress && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Physical Address
                        </Typography>
                        <Typography variant="body1">
                          {application.postalAddress}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Paper>

            {/* More Bio Data */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              More Bio Data
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                {editMode ? (
                  // Edit mode - show form fields
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Registration Number"
                        name="registrationNumber"
                        value={formData.registrationNumber || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter registration number"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Faculty"
                        name="faculty"
                        value={formData.faculty || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter faculty"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Equating"
                        name="equating"
                        value={formData.equating || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter equating information"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ID Type"
                        name="idType"
                        value={formData.idType || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter ID type (e.g., National ID, Passport)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company [Previous School]"
                        name="company"
                        value={formData.company || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter previous school/company"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company (City/Province)"
                        name="companyLocation"
                        value={formData.companyLocation || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter city/province"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="UACE Level"
                        name="uaceLevel"
                        value={formData.uaceLevel || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter UACE level (e.g., A-Level, Diploma, Certificate)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="UACE Level Results"
                        name="uaceLevelResults"
                        value={formData.uaceLevelResults || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Enter UACE results (e.g., AAB, BBC)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Others [Any other document after high school]"
                        name="otherDocuments"
                        value={formData.otherDocuments || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Describe any other qualifications or documents obtained after high school"
                      />
                    </Grid>
                  </>
                ) : (
                  // View mode - show data
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body1">
                        {application.dateOfBirth || "May 15, 1998"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Registration Number
                      </Typography>
                      <Typography variant="body1">
                        {application.registrationNumber || "REG/2024/001234"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Faculty
                      </Typography>
                      <Typography variant="body1">
                        {application.faculty || "Not specified"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Equating
                      </Typography>
                      <Typography variant="body1">
                        {application.equating || "UNEB Equivalent - Grade A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ID Type
                      </Typography>
                      <Typography variant="body1">
                        {application.idType || "Not specified"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Company [Previous School]
                      </Typography>
                      <Typography variant="body1">
                        {application.company || "Kampala International School"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Company (City/Province)
                      </Typography>
                      <Typography variant="body1">
                        {application.companyLocation ||
                          "Kampala, Central Region"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        UACE Level
                      </Typography>
                      <Typography variant="body1">
                        {application.uaceLevel || "A-Level"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        UACE Level Results
                      </Typography>
                      <Typography variant="body1">
                        {application.uaceLevelResults ||
                          "AAB (Mathematics-A, Physics-A, Chemistry-B)"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Others [Any other document after high school]
                      </Typography>
                      <Typography variant="body1">
                        {application.otherDocuments ||
                          "Certificate in Computer Applications (ICDL), First Aid Certificate from Red Cross Uganda, Leadership Training Certificate from Youth Leadership Program 2023"}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Program Information */}
            <Typography variant="h6" gutterBottom>
              Program Information
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                {editMode ? (
                  // Edit mode - show form fields
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        margin="normal"
                        error={!!formErrors.preferredProgram}
                      >
                        <InputLabel id="preferred-program-label">
                          Preferred Program
                        </InputLabel>
                        <Select
                          labelId="preferred-program-label"
                          name="preferredProgram"
                          value={formData.preferredProgram || ""}
                          onChange={handleInputChange}
                          label="Preferred Program"
                        >
                          {/* Business and Management Programs */}
                          <MenuItem value="Bachelor of Business Administration">
                            Bachelor of Business Administration
                          </MenuItem>
                          <MenuItem value="Bachelor of Public Administration">
                            Bachelor of Public Administration
                          </MenuItem>
                          <MenuItem value="Bachelor of Procurement and Logistics Management">
                            Bachelor of Procurement and Logistics Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Tourism and Hotel Management">
                            Bachelor of Tourism and Hotel Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Human Resource Management">
                            Bachelor of Human Resource Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Journalism and Communication Studies">
                            Bachelor of Journalism and Communication Studies
                          </MenuItem>
                          <MenuItem value="Master of Business Administration (MBA)">
                            Master of Business Administration (MBA)
                          </MenuItem>

                          {/* Science and Technology Programs */}
                          <MenuItem value="Bachelor of Science in Computer Science">
                            Bachelor of Science in Computer Science
                          </MenuItem>
                          <MenuItem value="Bachelor of Information Technology">
                            Bachelor of Information Technology
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Software Engineering">
                            Bachelor of Science in Software Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Climate Smart Agriculture">
                            Bachelor of Science in Climate Smart Agriculture
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Environmental Science and Management">
                            Bachelor of Science in Environmental Science and
                            Management
                          </MenuItem>
                          <MenuItem value="Master of Information Technology">
                            Master of Information Technology
                          </MenuItem>

                          {/* Engineering Programs */}
                          <MenuItem value="Bachelor of Science in Electrical Engineering">
                            Bachelor of Science in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Civil Engineering">
                            Bachelor of Science in Civil Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Architecture">
                            Bachelor of Architecture
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Petroleum Engineering">
                            Bachelor of Science in Petroleum Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Mechatronics and Robotics">
                            Bachelor of Science in Mechatronics and Robotics
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Communications Engineering">
                            Bachelor of Science in Communications Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Mining Engineering">
                            Bachelor of Science in Mining Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Electrical Engineering">
                            Diploma in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Civil Engineering">
                            Diploma in Civil Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Architecture">
                            Diploma in Architecture
                          </MenuItem>

                          {/* Law and Humanities Programs */}
                          <MenuItem value="Bachelor of Laws (LLB)">
                            Bachelor of Laws (LLB)
                          </MenuItem>
                          <MenuItem value="Bachelor of International Relations and Diplomatic Studies">
                            Bachelor of International Relations and Diplomatic
                            Studies
                          </MenuItem>
                          <MenuItem value="Master of International Relations and Diplomatic Studies">
                            Master of International Relations and Diplomatic
                            Studies
                          </MenuItem>

                          {/* Certificate Programs */}
                          <MenuItem value="Higher Education Access Programme - Arts">
                            Higher Education Access Programme - Arts
                          </MenuItem>
                          <MenuItem value="Higher Education Access Programme - Sciences">
                            Higher Education Access Programme - Sciences
                          </MenuItem>
                        </Select>
                        {formErrors.preferredProgram && (
                          <FormHelperText>
                            {formErrors.preferredProgram}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="secondary-program-label">
                          Alternative Program
                        </InputLabel>
                        <Select
                          labelId="secondary-program-label"
                          name="secondaryProgram"
                          value={formData.secondaryProgram || ""}
                          onChange={handleInputChange}
                          label="Alternative Program"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {/* Business and Management Programs */}
                          <MenuItem value="Bachelor of Business Administration">
                            Bachelor of Business Administration
                          </MenuItem>
                          <MenuItem value="Bachelor of Public Administration">
                            Bachelor of Public Administration
                          </MenuItem>
                          <MenuItem value="Bachelor of Procurement and Logistics Management">
                            Bachelor of Procurement and Logistics Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Tourism and Hotel Management">
                            Bachelor of Tourism and Hotel Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Human Resource Management">
                            Bachelor of Human Resource Management
                          </MenuItem>
                          <MenuItem value="Bachelor of Journalism and Communication Studies">
                            Bachelor of Journalism and Communication Studies
                          </MenuItem>
                          <MenuItem value="Master of Business Administration">
                            Master of Business Administration (MBA)
                          </MenuItem>

                          {/* Science and Technology Programs */}
                          <MenuItem value="Bachelor of Science in Computer Science">
                            Bachelor of Science in Computer Science
                          </MenuItem>
                          <MenuItem value="Bachelor of Information Technology">
                            Bachelor of Information Technology
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Software Engineering">
                            Bachelor of Science in Software Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Climate Smart Agriculture">
                            Bachelor of Science in Climate Smart Agriculture
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Environmental Science and Management">
                            Bachelor of Science in Environmental Science and
                            Management
                          </MenuItem>
                          <MenuItem value="Master of Information Technology">
                            Master of Information Technology
                          </MenuItem>

                          {/* Engineering Programs */}
                          <MenuItem value="Bachelor of Science in Electrical Engineering">
                            Bachelor of Science in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Civil Engineering">
                            Bachelor of Science in Civil Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Architecture">
                            Bachelor of Architecture
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Petroleum Engineering">
                            Bachelor of Science in Petroleum Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Mechatronics and Robotics">
                            Bachelor of Science in Mechatronics and Robotics
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Communications Engineering">
                            Bachelor of Science in Communications Engineering
                          </MenuItem>
                          <MenuItem value="Bachelor of Science in Mining Engineering">
                            Bachelor of Science in Mining Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Electrical Engineering">
                            Diploma in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Civil Engineering">
                            Diploma in Civil Engineering
                          </MenuItem>
                          <MenuItem value="Diploma in Architecture">
                            Diploma in Architecture
                          </MenuItem>

                          {/* Law and Humanities Programs */}
                          <MenuItem value="Bachelor of Laws">
                            Bachelor of Laws (LLB)
                          </MenuItem>
                          <MenuItem value="Bachelor of International Relations and Diplomatic Studies">
                            Bachelor of International Relations and Diplomatic
                            Studies
                          </MenuItem>
                          <MenuItem value="Master of International Relations and Diplomatic Studies">
                            Master of International Relations and Diplomatic
                            Studies
                          </MenuItem>

                          {/* Certificate Programs */}
                          <MenuItem value="Higher Education Access Programme - Arts">
                            Higher Education Access Programme - Arts
                          </MenuItem>
                          <MenuItem value="Higher Education Access Programme - Sciences">
                            Higher Education Access Programme - Sciences
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="mode-of-study-label">
                          Mode of Study
                        </InputLabel>
                        <Select
                          labelId="mode-of-study-label"
                          name="modeOfStudy"
                          value={formData.modeOfStudy || ""}
                          onChange={handleInputChange}
                          label="Mode of Study"
                        >
                          <MenuItem value="On Campus">On Campus</MenuItem>
                          <MenuItem value="Online">Online</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="preferred-intake-label">
                          Preferred Intake
                        </InputLabel>
                        <Select
                          labelId="preferred-intake-label"
                          name="preferredIntake"
                          value={formData.preferredIntake || ""}
                          onChange={handleInputChange}
                          label="Preferred Intake"
                        >
                          <MenuItem value="January">January</MenuItem>
                          <MenuItem value="May">May</MenuItem>
                          <MenuItem value="August">August</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                ) : (
                  // View mode - show data
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Preferred Program
                      </Typography>
                      <Typography variant="body1">
                        {getProgramName(application.preferredProgram)}
                      </Typography>
                    </Grid>
                    {application.secondaryProgram && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Alternative Program
                        </Typography>
                        <Typography variant="body1">
                          {getProgramName(application.secondaryProgram)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Mode of Study
                      </Typography>
                      <Typography variant="body1">
                        {application.modeOfStudy === "On Campus"
                          ? "On Campus"
                          : application.modeOfStudy === "Online"
                          ? "Online"
                          : application.modeOfStudy || "Not specified"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Preferred Intake
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {application.preferredIntake || "Not specified"}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Application Management Section - Only in Edit Mode for Admin Users */}
            {editMode && canEditApplication() && (
              <>
                <Typography variant="h6" gutterBottom>
                  Application Management
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="application-status-label">
                          Application Status
                        </InputLabel>
                        <Select
                          labelId="application-status-label"
                          name="status"
                          value={formData.status || ""}
                          onChange={handleInputChange}
                          label="Application Status"
                        >
                          <MenuItem value="INTERESTED">Interested</MenuItem>
                          <MenuItem value="APPLIED">Applied</MenuItem>
                          <MenuItem value="IN_REVIEW">In Review</MenuItem>
                          <MenuItem value="QUALIFIED">Qualified</MenuItem>
                          <MenuItem value="ADMITTED">Admitted</MenuItem>
                          <MenuItem value="ENROLLED">Enrolled</MenuItem>
                          <MenuItem value="DEFERRED">Deferred</MenuItem>
                          <MenuItem value="EXPIRED">Expired</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="application-tags-label">Tag</InputLabel>
                        <Select
                          labelId="application-tags-label"
                          value={formData.tag || ""}
                          onChange={handleTagChange}
                          label="Tag"
                          sx={{
                            "& .MuiMenuItem-root": {
                              color: "#000 !important",
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>No tag</em>
                          </MenuItem>
                          {AVAILABLE_TAGS.map((tag) => (
                            <MenuItem
                              key={tag.value}
                              value={tag.value}
                              sx={{ color: "#000 !important" }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  color: "#000 !important",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: tag.color,
                                    borderRadius: "50%",
                                    border: "1px solid #ddd",
                                  }}
                                />
                                <span style={{ color: "#000" }}>
                                  {tag.label}
                                </span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Status Notes"
                        name="statusNote"
                        value={formData.statusNote || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="Add any notes about the status or stage change..."
                      />
                    </Grid>
                    {formData.status !== application.status && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Status Change Detected:</strong>{" "}
                            {application.status || "Unknown"} →{" "}
                            {formData.status}
                            <br />
                            <em>
                              This will also update the corresponding lead
                              status automatically.
                            </em>
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </>
            )}

            {/* Sponsor Information (if available) */}
            {(application.sponsorEmail ||
              application.sponsorTelephone ||
              editMode) && (
              <>
                <Typography variant="h6" gutterBottom>
                  Sponsor Information
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    {editMode ? (
                      // Edit mode - show form fields
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Sponsor Email"
                            name="sponsorEmail"
                            value={formData.sponsorEmail || ""}
                            onChange={handleInputChange}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Sponsor Phone"
                            name="sponsorTelephone"
                            value={formData.sponsorTelephone || ""}
                            onChange={handleInputChange}
                            margin="normal"
                          />
                        </Grid>
                      </>
                    ) : (
                      // View mode - show data
                      <>
                        {application.sponsorEmail && (
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Sponsor Email
                            </Typography>
                            <Typography variant="body1">
                              {application.sponsorEmail}
                            </Typography>
                          </Grid>
                        )}
                        {application.sponsorTelephone && (
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Sponsor Phone
                            </Typography>
                            <Typography variant="body1">
                              {application.sponsorTelephone}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </Paper>
              </>
            )}

            {/* Documents Section */}
            <>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              {editMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>File upload limits:</strong>
                    <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                      <li>
                        Passport Photo: Maximum size{" "}
                        {(MAX_PASSPORT_PHOTO_SIZE / 1024).toFixed(0)}KB
                      </li>
                      <li>
                        Academic Documents: Maximum size{" "}
                        {(MAX_ACADEMIC_DOCS_SIZE / 1024).toFixed(0)}KB
                      </li>
                      <li>
                        ID Document: Maximum size{" "}
                        {(MAX_ID_DOC_SIZE / 1024).toFixed(0)}KB
                      </li>
                    </ul>
                    Images exceeding these limits will be automatically
                    compressed during upload. For PDF or other document files
                    over the limit, please reduce the file size before
                    uploading.
                  </Typography>
                </Alert>
              )}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  {editMode ? (
                    // Edit Mode - Document Upload/Replace
                    <>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Passport Photo
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PhotoCamera />}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          {application.passportPhoto
                            ? "Replace Photo"
                            : "Upload Photo"}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Check file size against specific passport photo size limit - STRICT ENFORCEMENT
                                if (file.size > MAX_PASSPORT_PHOTO_SIZE) {
                                  showFileErrorDialog(
                                    `Passport photo size (${(
                                      file.size / 1024
                                    ).toFixed(0)}KB) exceeds the ${(
                                      MAX_PASSPORT_PHOTO_SIZE / 1024
                                    ).toFixed(
                                      0
                                    )}KB limit. Please select a smaller image.`
                                  );
                                  e.target.value = ""; // Reset the file input
                                  return; // Prevent further processing
                                }

                                // Create a preview URL
                                const previewUrl = URL.createObjectURL(file);
                                filePreviewUrls.current.push(previewUrl);

                                // Store the file object directly in formData
                                setFormData({
                                  ...formData,
                                  passportPhoto: file,
                                  passportPhotoPreview: previewUrl,
                                });
                              }
                            }}
                          />
                        </Button>
                        {formData.passportPhotoPreview ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              mt: 1,
                            }}
                          >
                            <img
                              src={formData.passportPhotoPreview}
                              alt="Passport Preview"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100px",
                                objectFit: "contain",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                textAlign: "center",
                                color: "success.main",
                                mt: 1,
                              }}
                            >
                              New photo selected
                            </Typography>
                          </Box>
                        ) : application.passportPhoto ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              mt: 1,
                            }}
                          >
                            <img
                              src={application.passportPhoto}
                              alt="Current Passport"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100px",
                                objectFit: "contain",
                                opacity: "0.8",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                textAlign: "center",
                                mt: 1,
                              }}
                            >
                              Current photo
                            </Typography>
                          </Box>
                        ) : null}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Academic Documents
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PdfIcon />}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          {application.academicDocuments
                            ? "Replace Documents"
                            : "Upload Documents"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Check file size against specific academic document size limit - STRICT ENFORCEMENT
                                if (file.size > MAX_ACADEMIC_DOCS_SIZE) {
                                  showFileErrorDialog(
                                    `Academic document size (${(
                                      file.size / 1024
                                    ).toFixed(0)}KB) exceeds the ${(
                                      MAX_ACADEMIC_DOCS_SIZE / 1024
                                    ).toFixed(
                                      0
                                    )}KB limit. Please select a smaller file.`
                                  );
                                  e.target.value = ""; // Reset the file input
                                  return; // Prevent further processing
                                }

                                // If file size is acceptable, update form data
                                setFormData({
                                  ...formData,
                                  academicDocuments: file,
                                });
                              }
                            }}
                          />
                        </Button>
                        {formData.academicDocuments && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "center",
                              color: "success.main",
                            }}
                          >
                            {formData.academicDocuments.name} selected
                          </Typography>
                        )}
                        {application.academicDocuments &&
                          !formData.academicDocuments && (
                            <Typography
                              variant="caption"
                              sx={{ display: "block", textAlign: "center" }}
                            >
                              Document exists (keep current version)
                            </Typography>
                          )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          ID Document
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<PdfIcon />}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          {application.identificationDocument
                            ? "Replace ID Document"
                            : "Upload ID Document"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Check file size against specific ID document size limit - STRICT ENFORCEMENT
                                if (file.size > MAX_ID_DOC_SIZE) {
                                  showFileErrorDialog(
                                    `ID document size (${(
                                      file.size / 1024
                                    ).toFixed(0)}KB) exceeds the ${(
                                      MAX_ID_DOC_SIZE / 1024
                                    ).toFixed(
                                      0
                                    )}KB limit. Please select a smaller file.`
                                  );
                                  e.target.value = ""; // Reset the file input
                                  return; // Prevent further processing
                                }

                                // If file size is acceptable, update form data
                                setFormData({
                                  ...formData,
                                  identificationDocument: file,
                                });
                              }
                            }}
                          />
                        </Button>
                        {formData.identificationDocument && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "center",
                              color: "success.main",
                            }}
                          >
                            {formData.identificationDocument.name} selected
                          </Typography>
                        )}
                        {application.identificationDocument &&
                          !formData.identificationDocument && (
                            <Typography
                              variant="caption"
                              sx={{ display: "block", textAlign: "center" }}
                            >
                              Document exists (keep current version)
                            </Typography>
                          )}
                      </Grid>
                    </>
                  ) : (
                    // View Mode - Display Documents
                    <>
                      {application.passportPhoto && (
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Passport Photo
                            </Typography>
                            <Box
                              sx={{ display: "flex", justifyContent: "center" }}
                            >
                              <img
                                src={application.passportPhoto}
                                alt="Passport"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "150px",
                                  objectFit: "contain",
                                  cursor: "pointer",
                                  border: "2px solid #f0f0f0",
                                  borderRadius: "4px",
                                }}
                                onClick={() =>
                                  handleViewDocument(null, "Passport Photo")
                                }
                                title={`View full size: ${
                                  application.passportPhoto ||
                                  "URL not available"
                                }`}
                                onError={(e) => {
                                  console.error("Error loading passport photo");
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=Photo+Not+Available";
                                  e.target.style.opacity = "0.6";
                                }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      )}
                      {application.academicDocuments && (
                        <Grid item xs={12} sm={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Academic Documents
                          </Typography>
                          <Button
                            startIcon={<PdfIcon />}
                            endIcon={<LaunchIcon fontSize="small" />}
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() =>
                              handleViewDocument(null, "Academic Documents")
                            }
                            title={`View document: ${
                              application.academicDocuments ||
                              "URL not available"
                            }`}
                          >
                            View Document
                          </Button>
                        </Grid>
                      )}
                      {application.identificationDocument && (
                        <Grid item xs={12} sm={4}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            ID Document
                          </Typography>
                          <Button
                            startIcon={<PdfIcon />}
                            endIcon={<LaunchIcon fontSize="small" />}
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() =>
                              handleViewDocument(null, "ID Document")
                            }
                            title={`View document: ${
                              application.identificationDocument ||
                              "URL not available"
                            }`}
                          >
                            View Document
                          </Button>
                        </Grid>
                      )}
                      {!application.passportPhoto &&
                        !application.academicDocuments &&
                        !application.identificationDocument && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              No documents uploaded
                            </Typography>
                          </Grid>
                        )}
                    </>
                  )}
                </Grid>
              </Paper>
            </>

            {/* Notes Section */}
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes about this application here..."
                />
              ) : (
                <Typography variant="body1">
                  {application.notes || "No notes available."}
                </Typography>
              )}
            </Paper>

            {/* Application Timeline - view only */}
            {!editMode && (
              <>
                <Typography variant="h6" gutterBottom>
                  Application Timeline
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Status
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {application.status
                          ? application.status
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())
                          : "Not Set"}
                      </Typography>
                    </Grid>
                    {/* Display tag in timeline section */}
                    {application.tag && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tag
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {(() => {
                            const tagConfig = getTagConfig(application.tag);
                            return (
                              <Chip
                                label={
                                  tagConfig ? tagConfig.label : application.tag
                                }
                                size="small"
                                sx={{
                                  backgroundColor: tagConfig
                                    ? tagConfig.color
                                    : "#f5f5f5",
                                  color: "#000 !important",
                                  fontWeight: "medium",
                                }}
                              />
                            );
                          })()}
                        </Box>
                      </Grid>
                    )}
                    {application.statusNote && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status Notes
                        </Typography>
                        <Typography variant="body1">
                          {application.statusNote}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Submitted On
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(application.submittedAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(application.updatedAt)}
                      </Typography>
                    </Grid>
                    {application.lastUpdatedBy && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Updated By
                        </Typography>
                        <Typography variant="body1">
                          {application.lastUpdatedBy.name || "Unknown"}
                          {application.lastUpdatedBy.role &&
                            ` (${application.lastUpdatedBy.role})`}
                        </Typography>
                      </Grid>
                    )}
                    {application.submittedBy && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Submitted By
                        </Typography>
                        <Typography variant="body1">
                          {application.submittedBy.name || "Unknown"}
                          {application.submittedBy.role &&
                            ` (${application.submittedBy.role})`}
                          {application.submittedBy.timestamp &&
                            ` on ${formatDate(
                              application.submittedBy.timestamp
                            )}`}
                        </Typography>
                      </Grid>
                    )}

                    {/* Timeline History */}
                    {application.timeline &&
                      application.timeline.length > 0 && (
                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Update History
                          </Typography>
                          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                            {application.timeline
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date)
                              )
                              .map((entry, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    p: 2,
                                    mb: 1,
                                    backgroundColor:
                                      index === 0
                                        ? "action.hover"
                                        : "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                    >
                                      {entry.action ===
                                        "APPLICATION_SUBMITTED" &&
                                        "📝 Application Submitted"}
                                      {entry.action === "STATUS_UPDATED" &&
                                        "🔄 Status Updated"}
                                      {entry.action === "APPLICATION_UPDATED" &&
                                        "✏️ Information Updated"}
                                      {![
                                        "APPLICATION_SUBMITTED",
                                        "STATUS_UPDATED",
                                        "APPLICATION_UPDATED",
                                      ].includes(entry.action) &&
                                        `📋 ${entry.action
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                          )}`}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatDate(entry.date)}
                                    </Typography>
                                  </Box>

                                  {entry.action === "STATUS_UPDATED" &&
                                    entry.previousStatus && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mb: 1 }}
                                      >
                                        Status:{" "}
                                        {entry.previousStatus
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                          )}
                                        →{" "}
                                        {entry.status
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase()
                                          )}
                                      </Typography>
                                    )}

                                  {entry.notes && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {entry.notes}
                                    </Typography>
                                  )}

                                  {entry.updatedBy && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      By:{" "}
                                      {entry.updatedBy.name ||
                                        entry.updatedBy.email ||
                                        "Unknown"}
                                      {entry.updatedBy.role &&
                                        ` (${entry.updatedBy.role})`}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                          </Box>
                        </Grid>
                      )}
                  </Grid>
                </Paper>
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No application data available
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {editMode ? (
          <>
            <Button
              onClick={handleCancelEdit}
              variant="outlined"
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log(
                  "Save button clicked, current form data:",
                  formData
                );
                handleSaveApplication();
              }}
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleEditApplication}
              disabled={loading || !application}
              startIcon={<EditIcon />}
            >
              Edit Application
            </Button>
          </>
        )}
      </DialogActions>

      {/* Document Preview Dialog */}
      <Dialog
        open={documentPreview.open}
        onClose={handleCloseDocumentPreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: "80vh", maxHeight: "90vh" },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{documentPreview.title}</Typography>
            <IconButton onClick={handleCloseDocumentPreview} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {documentPreview.type === "pdf" && (
            <object
              data={documentPreview.url}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ minHeight: "70vh" }}
            >
              <Typography variant="body1" sx={{ p: 3, textAlign: "center" }}>
                Unable to display PDF.{" "}
                <a
                  href={documentPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Click here
                </a>{" "}
                to download.
              </Typography>
            </object>
          )}
          {documentPreview.type === "image" && (
            <Box
              sx={{
                p: 2,
                textAlign: "center",
                maxHeight: "70vh",
                overflow: "auto",
              }}
            >
              <img
                src={documentPreview.url}
                alt={documentPreview.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
          {documentPreview.type === "iframe" && (
            <iframe
              src={documentPreview.url}
              title={documentPreview.title}
              width="100%"
              height="100%"
              style={{ minHeight: "70vh", border: "none" }}
            >
              <Typography variant="body1" sx={{ p: 3, textAlign: "center" }}>
                Unable to display content.{" "}
                <a
                  href={documentPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Click here
                </a>{" "}
                to open in a new tab.
              </Typography>
            </iframe>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentPreview}>Close</Button>
          <Button
            component="a"
            href={documentPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            color="primary"
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Error Dialog */}
      <Dialog open={errorDialog.open} onClose={handleCloseErrorDialog}>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">File Size Error</Typography>
            <IconButton onClick={handleCloseErrorDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
            {errorDialog.message}
          </Alert>
          <Typography variant="body2">
            Please select a smaller file that meets the size requirements or
            compress your file before uploading.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseErrorDialog}
            variant="contained"
            color="primary"
          >
            OK, I'll Try Again
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;
