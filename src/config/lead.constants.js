/**
 * Lead Status and Source Constants
 * Shared between frontend and backend
 */

export const LEAD_STATUSES = {
  // Main funnel stages
  INQUIRY: "INQUIRY", // Initial inquiry/lead capture
  CONTACTED: "CONTACTED", // First contact made
  PRE_QUALIFIED: "PRE_QUALIFIED", // Interested/Pre-qualified
  APPLIED: "APPLIED", // Application submitted
  QUALIFIED: "QUALIFIED", // Meets all requirements
  ADMITTED: "ADMITTED", // Officially admitted
  ENROLLED: "ENROLLED", // Successfully enrolled

  // Additional statuses for lead management
  NURTURE: "NURTURE", // In nurturing process
  REJECTED: "REJECTED", // Application rejected
};

export const LEAD_SOURCES = {
  WEBSITE: "WEBSITE",
  META_ADS: "META_ADS",
  GOOGLE_ADS: "GOOGLE_ADS",
  WHATSAPP: "WHATSAPP",
  LINKEDIN: "LINKEDIN",
  REFERRAL: "REFERRAL",
  WALK_IN: "WALK_IN",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  EDUCATION_FAIR: "EDUCATION_FAIR",
  PARTNER: "PARTNER",
  MANUAL: "MANUAL",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  EVENT: "EVENT",
  OTHER: "OTHER",
};

// Status configuration with display labels and colors
export const STATUS_CONFIG = {
  [LEAD_STATUSES.INQUIRY]: {
    label: "Inquiry",
    color: "info",
    description: "Initial contact or inquiry",
  },
  [LEAD_STATUSES.CONTACTED]: {
    label: "Contacted",
    color: "info",
    description: "First contact made",
  },
  [LEAD_STATUSES.PRE_QUALIFIED]: {
    label: "Interested",
    color: "warning",
    description: "Shows interest and pre-qualified",
  },
  [LEAD_STATUSES.APPLIED]: {
    label: "Applied",
    color: "info",
    description: "Application submitted",
  },
  [LEAD_STATUSES.QUALIFIED]: {
    label: "Qualified",
    color: "success",
    description: "Meets all requirements",
  },
  [LEAD_STATUSES.ADMITTED]: {
    label: "Admitted",
    color: "secondary",
    description: "Officially admitted to program",
  },
  [LEAD_STATUSES.ENROLLED]: {
    label: "Enrolled",
    color: "primary",
    description: "Successfully enrolled - final goal",
  },
  [LEAD_STATUSES.NURTURE]: {
    label: "Nurture",
    color: "warning",
    description: "Lead is being nurtured",
  },
  [LEAD_STATUSES.REJECTED]: {
    label: "Rejected",
    color: "error",
    description: "Application rejected",
  },
};

// Source configuration with display labels
export const SOURCE_CONFIG = {
  [LEAD_SOURCES.WEBSITE]: {
    label: "Website",
    icon: "🌐",
  },
  [LEAD_SOURCES.META_ADS]: {
    label: "Meta Ads",
    icon: "�",
  },
  [LEAD_SOURCES.GOOGLE_ADS]: {
    label: "Google Ads",
    icon: "🔍",
  },
  [LEAD_SOURCES.WHATSAPP]: {
    label: "WhatsApp",
    icon: "💬",
  },
  [LEAD_SOURCES.LINKEDIN]: {
    label: "LinkedIn",
    icon: "�",
  },
  [LEAD_SOURCES.REFERRAL]: {
    label: "Referral",
    icon: "👥",
  },
  [LEAD_SOURCES.WALK_IN]: {
    label: "Walk-in",
    icon: "🚶",
  },
  [LEAD_SOURCES.PHONE]: {
    label: "Phone Call",
    icon: "📞",
  },
  [LEAD_SOURCES.EMAIL]: {
    label: "Email",
    icon: "📧",
  },
  [LEAD_SOURCES.EDUCATION_FAIR]: {
    label: "Education Fair",
    icon: "🎓",
  },
  [LEAD_SOURCES.PARTNER]: {
    label: "Partner Institution",
    icon: "🤝",
  },
  [LEAD_SOURCES.MANUAL]: {
    label: "Manual Entry",
    icon: "✍️",
  },
  [LEAD_SOURCES.SOCIAL_MEDIA]: {
    label: "Social Media",
    icon: "📱",
  },
  [LEAD_SOURCES.EVENT]: {
    label: "Event",
    icon: "�",
  },
  [LEAD_SOURCES.OTHER]: {
    label: "Other",
    icon: "📋",
  },
};
