import { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import applicationService from "../../services/applicationService";

// Helper function to format phone number to match backend expectations
const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, "");

  // Ensure it has a + prefix if not already
  if (!formatted.startsWith("+")) {
    // If it's a Ugandan number without country code, add it
    if (formatted.length === 9) {
      formatted = "+256" + formatted;
    } else {
      formatted = "+" + formatted;
    }
  }

  return formatted;
};

// Helper function to convert program format from hyphen to underscore (if needed)
const convertProgramFormat = (program) => {
  // Since we've updated the UI values to match backend expectations,
  // this is just a safety function in case some legacy values come through
  return program.replace(/-/g, "_");
};

// Helper function to convert mode of study format (if needed)
const convertModeOfStudy = (mode) => {
  // Since we've updated the UI values to match backend expectations,
  // this is just a safety function
  if (mode === "on-campus") return "on_campus";
  return mode;
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    // Check file size - limit to 5MB
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      reject(new Error(`File size exceeds 5MB limit: ${file.name}`));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const initialFormData = {
  // Personal Details
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryOfBirth: "",
  gender: "",
  postalAddress: "",
  passportPhoto: null,

  // Program
  program: "",
  modeOfStudy: "",
  intake: "",
  academicDocuments: null,
  identificationDocuments: null,

  // Additional Data
  sponsorTelephone: "",
  sponsorEmail: "",
  howDidYouHear: "",
  additionalNotes: "",
};

export const useApplicationForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load application data for editing
  const loadApplication = useCallback(async (applicationId) => {
    if (!applicationId) return;

    setIsLoading(true);
    try {
      console.log("Loading application data for editing:", applicationId);
      const response = await applicationService.getApplication(applicationId);

      if (response.success && response.data) {
        const appData = response.data;
        console.log("Application data loaded:", appData);

        // Map application data to form fields
        const mappedData = {
          firstName: appData.name?.split(" ")[0] || "",
          lastName: appData.name?.split(" ").slice(1).join(" ") || "",
          email: appData.email || "",
          phone: appData.phoneNumber || "",
          countryOfBirth: appData.countryOfBirth || "",
          gender: appData.gender || "",
          postalAddress: appData.postalAddress || "",
          passportPhoto: appData.passportPhoto || null,

          // Program
          program: appData.preferredProgram || "",
          modeOfStudy: appData.modeOfStudy || "",
          intake: appData.preferredIntake || "",
          academicDocuments: appData.academicDocuments || null,
          identificationDocuments: appData.identificationDocument || null,

          // Additional Data
          sponsorTelephone: appData.sponsorTelephone || "",
          sponsorEmail: appData.sponsorEmail || "",
          howDidYouHear: appData.additionalInfo?.howDidYouHear || "",
          additionalNotes: appData.notes || "",

          // Important: Include the stage field
          stage: appData.stage || "new",

          // Store the application ID for updates
          applicationId: applicationId,
        };

        setFormData(mappedData);
        return true;
      } else {
        console.error("Failed to load application:", response.message);
        return false;
      }
    } catch (error) {
      console.error("Error loading application:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFormData = useCallback((newData) => {
    console.log("Updating form data with:", newData);
    setFormData((prev) => {
      const updated = { ...prev, ...newData };
      console.log("New form data state:", updated);
      return updated;
    });

    // Clear errors for updated fields
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newData).forEach((key) => {
        delete newErrors[key];
      });
      return newErrors;
    });
  }, []);

  const validateStep = useCallback((stepIndex, data) => {
    const stepErrors = {};
    console.log("Validating step", stepIndex, "with data", data);

    switch (stepIndex) {
      case 0: // Personal Details
        if (!data.firstName?.trim())
          stepErrors.firstName = "First name is required";
        if (!data.lastName?.trim())
          stepErrors.lastName = "Last name is required";
        if (!data.email?.trim()) stepErrors.email = "Email is required";
        if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
          stepErrors.email = "Please enter a valid email";
        }
        if (!data.phone?.trim()) stepErrors.phone = "Phone number is required";
        if (!data.countryOfBirth?.trim())
          stepErrors.countryOfBirth = "Country of birth is required";
        if (!data.gender?.trim()) stepErrors.gender = "Gender is required";
        if (!data.postalAddress?.trim())
          stepErrors.postalAddress = "Postal address is required";
        break;

      case 1: // Program
        if (!data.program?.trim()) stepErrors.program = "Program is required";
        if (!data.modeOfStudy?.trim())
          stepErrors.modeOfStudy = "Mode of study is required";
        if (!data.intake?.trim()) stepErrors.intake = "Intake is required";
        break;

      case 2: // Additional Data
        if (!data.howDidYouHear?.trim())
          stepErrors.howDidYouHear =
            "Please tell us how you heard about the university";
        break;

      default:
        break;
    }

    setErrors(stepErrors);
    console.log("Validation errors:", stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, []);

  const submitApplication = useCallback(
    async (forceSubmit = false) => {
      setIsSubmitting(true);

      try {
        // Validate all steps before submission
        const isStep0Valid = validateStep(0, formData);
        const isStep1Valid = validateStep(1, formData);
        const isStep2Valid = validateStep(2, formData);

        if (!isStep0Valid || !isStep1Valid || !isStep2Valid) {
          throw new Error("Please fix validation errors before submitting");
        }

        // Convert all file objects to base64 before submission
        const processedFormData = { ...formData };

        // Convert passport photo to base64 if it exists
        if (formData.passportPhoto && formData.passportPhoto instanceof File) {
          try {
            console.log("Converting passport photo to base64...");
            processedFormData.passportPhoto = await fileToBase64(
              formData.passportPhoto
            );
          } catch (error) {
            console.error("Failed to convert passport photo to base64:", error);
            setErrors((prev) => ({ ...prev, passportPhoto: error.message }));
            throw new Error(`File error: ${error.message}`);
          }
        }

        // Convert academic documents to base64 if they exist
        if (formData.academicDocuments) {
          try {
            console.log("Converting academic documents to base64...");
            if (Array.isArray(formData.academicDocuments)) {
              // For multiple files, just get the first one or null
              const file = formData.academicDocuments[0] || null;
              if (file) {
                // Convert directly to base64 string
                processedFormData.academicDocuments = await fileToBase64(file);
              } else {
                processedFormData.academicDocuments = null;
              }
            } else {
              // Handle single file - direct base64 string
              processedFormData.academicDocuments = await fileToBase64(
                formData.academicDocuments
              );
            }
          } catch (error) {
            console.error(
              "Failed to convert academic documents to base64:",
              error
            );
            setErrors((prev) => ({
              ...prev,
              academicDocuments: error.message,
            }));
            throw new Error(`File error: ${error.message}`);
          }
        }

        // Convert identification documents to base64 if they exist
        if (formData.identificationDocuments) {
          try {
            console.log("Converting identification documents to base64...");
            if (Array.isArray(formData.identificationDocuments)) {
              // For multiple files, just get the first one or null
              const file = formData.identificationDocuments[0] || null;
              if (file) {
                // Convert directly to base64 string
                processedFormData.identificationDocuments = await fileToBase64(
                  file
                );
              } else {
                processedFormData.identificationDocuments = null;
              }
            } else {
              // Handle single file - direct base64 string
              processedFormData.identificationDocuments = await fileToBase64(
                formData.identificationDocuments
              );
            }
          } catch (error) {
            console.error(
              "Failed to convert identification documents to base64:",
              error
            );
            setErrors((prev) => ({
              ...prev,
              identificationDocuments: error.message,
            }));
            throw new Error(`File error: ${error.message}`);
          }
        }

        // Format data to match backend expectations
        const formattedData = {
          // Personal Details
          name: `${processedFormData.firstName} ${processedFormData.lastName}`,
          email: processedFormData.email,
          phoneNumber: formatPhoneNumber(processedFormData.phone),
          countryOfBirth: processedFormData.countryOfBirth,
          gender: processedFormData.gender.toLowerCase(), // Ensure lowercase for gender
          postalAddress: processedFormData.postalAddress,
          passportPhoto: processedFormData.passportPhoto,

          // Program details
          preferredProgram: convertProgramFormat(processedFormData.program),
          modeOfStudy: convertModeOfStudy(processedFormData.modeOfStudy),
          preferredIntake: processedFormData.intake,
          academicDocuments: processedFormData.academicDocuments, // Now just base64 string
          identificationDocument: processedFormData.identificationDocuments, // Now just base64 string

          // Sponsor info - explicitly add these even if empty
          sponsor: null, // No sponsor name field in form, but expected by backend
          sponsorTelephone: processedFormData.sponsorTelephone || null,
          sponsorEmail: processedFormData.sponsorEmail || null,

          // Additional data
          additionalData: {
            howDidYouHear: processedFormData.howDidYouHear,
            notes: processedFormData.additionalNotes || "",
          },

          // Set flag to indicate this is a manual application (not from webhook)
          source: "MANUAL_APPLICATION_FORM",
          skipWhatsappMessage: true, // Don't send WhatsApp message for manual applications

          // Add stage field with default value "new"
          stage: "new",
        };

        console.log(
          "Submitting application with formatted data:",
          formattedData
        );

        // Check if we have an applicationId for editing
        if (formData.applicationId) {
          console.log("Updating existing application:", formData.applicationId);

          // Preserve the existing stage field if it was loaded
          if (formData.stage) {
            formattedData.stage = formData.stage;
          }

          // Update existing application
          const result = await applicationService.updateApplication(
            formData.applicationId,
            formattedData
          );

          return result;
        } else {
          // Submit new application through service
          const result = await applicationService.submitApplication(
            formattedData,
            user,
            forceSubmit
          );

          return result;
        }
      } catch (error) {
        console.error("Application submission failed:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, user, validateStep]
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    updateFormData,
    validateStep,
    submitApplication,
    loadApplication,
    resetForm,
    isSubmitting,
    isLoading,
    errors,
  };
};
