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

const ApplicationDetailsDialog = ({ open, onClose, leadId, applicationId }) => {
  const { getUserRole, user } = useAuth();
  const userRole = getUserRole();

  console.log("ApplicationDetailsDialog - User role:", userRole);
  console.log("ApplicationDetailsDialog - Open:", open);

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
    if (!applicationId) {
      console.error("Cannot view document: No application ID available");
      setError(`Unable to view ${displayName}: No application ID available.`);
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

      console.log(
        `Fetching document from backend for application ${applicationId}, type: ${documentType}`
      );

      // Log the full URL for debugging
      const apiUrl = `/applications/${applicationId}/document/${documentType}`;
      console.log(`API Request URL: ${apiUrl}`);

      // Fetch document URL from the new endpoint
      const response = await applicationService.getApplicationDocument(
        applicationId,
        documentType
      );

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
        const directUrl = `${apiBaseUrl}/api/applications/${applicationId}/document/${fallbackDocumentTypeMap[displayName]}`;
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
    if (!applicationId && !leadId) return;

    setLoading(true);
    setError("");

    try {
      let response;
      console.log("Fetching application data:", { applicationId, leadId });

      // First try to fetch by applicationId if available
      if (applicationId) {
        console.log("Fetching by applicationId:", applicationId);
        response = await applicationService.getApplication(applicationId);
      }
      // If no applicationId but leadId is available, fetch by leadId
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

        // Make sure to map any fields that might have different names
        if (applicationData.intake && !applicationData.preferredIntake) {
          initialFormData.preferredIntake = applicationData.intake;
        }

        if (applicationData.program && !applicationData.preferredProgram) {
          initialFormData.preferredProgram = applicationData.program;
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
  }, [open, applicationId, leadId]);

  useEffect(() => {
    // Use the fetchApplicationData function that's defined above
    // We don't need to redefine it here anymore

    fetchApplicationData();
  }, [fetchApplicationData, open, applicationId, leadId]);

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

      console.log("Initializing edit mode with data:", initialFormData);
      setFormData(initialFormData);
    } else {
      // No application data, start with an empty form
      setFormData({});
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
  // Total document size in Firestore must be under 1,048,487 bytes (1MB)
  // Base64 encoding increases size by ~33%, so we need to account for that
  const MAX_PASSPORT_PHOTO_SIZE = 200 * 1024; // 200KB for passport photo
  const MAX_ACADEMIC_DOCS_SIZE = 350 * 1024; // 350KB for academic documents
  const MAX_ID_DOC_SIZE = 300 * 1024; // 300KB for identification document
  // These limits total to 850KB, leaving buffer for other application data

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
      // Create data to send
      const dataToSend = { ...formData };

      // Use ISO format for consistency with the backend and lead documents
      dataToSend.updatedAt = new Date().toISOString();

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

      const response = await applicationService.updateApplication(
        applicationId,
        dataToSend,
        config
      );

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
    // Map program values to their display labels
    const programLabelsMap = {
      // Business and Management Programs
      bachelor_business_administration: "Bachelor of Business Administration",
      bachelor_public_administration: "Bachelor of Public Administration",
      bachelor_procurement_logistics:
        "Bachelor of Procurement and Logistics Management",
      bachelor_tourism_hotel: "Bachelor of Tourism and Hotel Management",
      bachelor_human_resource: "Bachelor of Human Resource Management",
      bachelor_journalism_communication:
        "Bachelor of Journalism and Communication Studies",
      master_business_administration: "Master of Business Administration (MBA)",

      // Science and Technology Programs
      bachelor_computer_science: "Bachelor of Science in Computer Science",
      bachelor_information_technology: "Bachelor of Information Technology",
      bachelor_software_engineering:
        "Bachelor of Science in Software Engineering",
      bachelor_climate_smart_agriculture:
        "Bachelor of Science in Climate Smart Agriculture",
      bachelor_environmental_science:
        "Bachelor of Science in Environmental Science and Management",
      master_information_technology: "Master of Information Technology",

      // Engineering Programs
      bachelor_electrical_engineering:
        "Bachelor of Science in Electrical Engineering",
      bachelor_civil_engineering: "Bachelor of Science in Civil Engineering",
      bachelor_architecture: "Bachelor of Architecture",
      bachelor_petroleum_engineering:
        "Bachelor of Science in Petroleum Engineering",
      bachelor_mechatronics_robotics:
        "Bachelor of Science in Mechatronics and Robotics",
      bachelor_communications_engineering:
        "Bachelor of Science in Communications Engineering",
      bachelor_mining_engineering: "Bachelor of Science in Mining Engineering",
      diploma_electrical_engineering: "Diploma in Electrical Engineering",
      diploma_civil_engineering: "Diploma in Civil Engineering",
      diploma_architecture: "Diploma in Architecture",

      // Law and Humanities Programs
      bachelor_laws: "Bachelor of Laws (LLB)",
      bachelor_international_relations:
        "Bachelor of International Relations and Diplomatic Studies",
      master_international_relations:
        "Master of International Relations and Diplomatic Studies",

      // Certificate Programs
      higher_education_access_arts: "Higher Education Access Programme - Arts",
      higher_education_access_sciences:
        "Higher Education Access Programme - Sciences",
    };

    return programLabelsMap[programValue] || programValue;
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
                </Grid>

                {application.stage && (
                  <Grid item>
                    <Chip
                      label={`Stage: ${application.stage}`}
                      sx={{
                        bgcolor: "success.main",
                        color: "white",
                        fontWeight: "bold",
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
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber || ""}
                        onChange={handleInputChange}
                        error={!!formErrors.phoneNumber}
                        helperText={formErrors.phoneNumber}
                        margin="normal"
                      />
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
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                          <MenuItem value="prefer_not_to_say">
                            Prefer not to say
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country of Birth"
                        name="countryOfBirth"
                        value={formData.countryOfBirth || ""}
                        onChange={handleInputChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Postal Address"
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
                          Postal Address
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
                          <MenuItem value="bachelor_business_administration">
                            Bachelor of Business Administration
                          </MenuItem>
                          <MenuItem value="bachelor_public_administration">
                            Bachelor of Public Administration
                          </MenuItem>
                          <MenuItem value="bachelor_procurement_logistics">
                            Bachelor of Procurement and Logistics Management
                          </MenuItem>
                          <MenuItem value="bachelor_tourism_hotel">
                            Bachelor of Tourism and Hotel Management
                          </MenuItem>
                          <MenuItem value="bachelor_human_resource">
                            Bachelor of Human Resource Management
                          </MenuItem>
                          <MenuItem value="bachelor_journalism_communication">
                            Bachelor of Journalism and Communication Studies
                          </MenuItem>
                          <MenuItem value="master_business_administration">
                            Master of Business Administration (MBA)
                          </MenuItem>

                          {/* Science and Technology Programs */}
                          <MenuItem value="bachelor_computer_science">
                            Bachelor of Science in Computer Science
                          </MenuItem>
                          <MenuItem value="bachelor_information_technology">
                            Bachelor of Information Technology
                          </MenuItem>
                          <MenuItem value="bachelor_software_engineering">
                            Bachelor of Science in Software Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_climate_smart_agriculture">
                            Bachelor of Science in Climate Smart Agriculture
                          </MenuItem>
                          <MenuItem value="bachelor_environmental_science">
                            Bachelor of Science in Environmental Science and
                            Management
                          </MenuItem>
                          <MenuItem value="master_information_technology">
                            Master of Information Technology
                          </MenuItem>

                          {/* Engineering Programs */}
                          <MenuItem value="bachelor_electrical_engineering">
                            Bachelor of Science in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_civil_engineering">
                            Bachelor of Science in Civil Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_architecture">
                            Bachelor of Architecture
                          </MenuItem>
                          <MenuItem value="bachelor_petroleum_engineering">
                            Bachelor of Science in Petroleum Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_mechatronics_robotics">
                            Bachelor of Science in Mechatronics and Robotics
                          </MenuItem>
                          <MenuItem value="bachelor_communications_engineering">
                            Bachelor of Science in Communications Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_mining_engineering">
                            Bachelor of Science in Mining Engineering
                          </MenuItem>
                          <MenuItem value="diploma_electrical_engineering">
                            Diploma in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="diploma_civil_engineering">
                            Diploma in Civil Engineering
                          </MenuItem>
                          <MenuItem value="diploma_architecture">
                            Diploma in Architecture
                          </MenuItem>

                          {/* Law and Humanities Programs */}
                          <MenuItem value="bachelor_laws">
                            Bachelor of Laws (LLB)
                          </MenuItem>
                          <MenuItem value="bachelor_international_relations">
                            Bachelor of International Relations and Diplomatic
                            Studies
                          </MenuItem>
                          <MenuItem value="master_international_relations">
                            Master of International Relations and Diplomatic
                            Studies
                          </MenuItem>

                          {/* Certificate Programs */}
                          <MenuItem value="higher_education_access_arts">
                            Higher Education Access Programme - Arts
                          </MenuItem>
                          <MenuItem value="higher_education_access_sciences">
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
                          <MenuItem value="bachelor_business_administration">
                            Bachelor of Business Administration
                          </MenuItem>
                          <MenuItem value="bachelor_public_administration">
                            Bachelor of Public Administration
                          </MenuItem>
                          <MenuItem value="bachelor_procurement_logistics">
                            Bachelor of Procurement and Logistics Management
                          </MenuItem>
                          <MenuItem value="bachelor_tourism_hotel">
                            Bachelor of Tourism and Hotel Management
                          </MenuItem>
                          <MenuItem value="bachelor_human_resource">
                            Bachelor of Human Resource Management
                          </MenuItem>
                          <MenuItem value="bachelor_journalism_communication">
                            Bachelor of Journalism and Communication Studies
                          </MenuItem>
                          <MenuItem value="master_business_administration">
                            Master of Business Administration (MBA)
                          </MenuItem>

                          {/* Science and Technology Programs */}
                          <MenuItem value="bachelor_computer_science">
                            Bachelor of Science in Computer Science
                          </MenuItem>
                          <MenuItem value="bachelor_information_technology">
                            Bachelor of Information Technology
                          </MenuItem>
                          <MenuItem value="bachelor_software_engineering">
                            Bachelor of Science in Software Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_climate_smart_agriculture">
                            Bachelor of Science in Climate Smart Agriculture
                          </MenuItem>
                          <MenuItem value="bachelor_environmental_science">
                            Bachelor of Science in Environmental Science and
                            Management
                          </MenuItem>
                          <MenuItem value="master_information_technology">
                            Master of Information Technology
                          </MenuItem>

                          {/* Engineering Programs */}
                          <MenuItem value="bachelor_electrical_engineering">
                            Bachelor of Science in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_civil_engineering">
                            Bachelor of Science in Civil Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_architecture">
                            Bachelor of Architecture
                          </MenuItem>
                          <MenuItem value="bachelor_petroleum_engineering">
                            Bachelor of Science in Petroleum Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_mechatronics_robotics">
                            Bachelor of Science in Mechatronics and Robotics
                          </MenuItem>
                          <MenuItem value="bachelor_communications_engineering">
                            Bachelor of Science in Communications Engineering
                          </MenuItem>
                          <MenuItem value="bachelor_mining_engineering">
                            Bachelor of Science in Mining Engineering
                          </MenuItem>
                          <MenuItem value="diploma_electrical_engineering">
                            Diploma in Electrical Engineering
                          </MenuItem>
                          <MenuItem value="diploma_civil_engineering">
                            Diploma in Civil Engineering
                          </MenuItem>
                          <MenuItem value="diploma_architecture">
                            Diploma in Architecture
                          </MenuItem>

                          {/* Law and Humanities Programs */}
                          <MenuItem value="bachelor_laws">
                            Bachelor of Laws (LLB)
                          </MenuItem>
                          <MenuItem value="bachelor_international_relations">
                            Bachelor of International Relations and Diplomatic
                            Studies
                          </MenuItem>
                          <MenuItem value="master_international_relations">
                            Master of International Relations and Diplomatic
                            Studies
                          </MenuItem>

                          {/* Certificate Programs */}
                          <MenuItem value="higher_education_access_arts">
                            Higher Education Access Programme - Arts
                          </MenuItem>
                          <MenuItem value="higher_education_access_sciences">
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
                          <MenuItem value="on_campus">On Campus</MenuItem>
                          <MenuItem value="online">Online</MenuItem>
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
                          <MenuItem value="january">January</MenuItem>
                          <MenuItem value="may">May</MenuItem>
                          <MenuItem value="august">August</MenuItem>
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
                        {application.modeOfStudy === "on_campus"
                          ? "On Campus"
                          : application.modeOfStudy === "online"
                          ? "Online"
                          : application.modeOfStudy === "hybrid"
                          ? "Hybrid"
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
                    {application.submittedBy && (
                      <Grid item xs={12}>
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
