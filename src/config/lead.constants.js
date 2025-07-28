/**
 * Lead Status and Source Constants
 * Shared between frontend and backend
 */

export const LEAD_STATUSES = {
  INQUIRY: "INQUIRY",
  CONTACTED: "CONTACTED",
  NURTURE: "NURTURE",
  PRE_QUALIFIED: "PRE_QUALIFIED",
  FOLLOW_UP: "FOLLOW_UP",
  APPLIED: "APPLIED",
  REVIEW: "REVIEW",
  QUALIFIED: "QUALIFIED",
  PENDING_DOCS: "PENDING_DOCS",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DECLINED: "DECLINED",
  DISQUALIFIED: "DISQUALIFIED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED",
};

export const LEAD_SOURCES = {
  WEBSITE: "WEBSITE",
  WHATSAPP: "WHATSAPP",
  GOOGLE_ADS: "GOOGLE_ADS",
  META_ADS: "META_ADS",
  REFERRAL: "REFERRAL",
  DIRECT: "DIRECT",
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
    color: "primary",
    description: "Lead has been contacted",
  },
  [LEAD_STATUSES.NURTURE]: {
    label: "Nurture",
    color: "warning",
    description: "Lead is being nurtured",
  },
  [LEAD_STATUSES.PRE_QUALIFIED]: {
    label: "Pre-Qualified",
    color: "secondary",
    description: "Lead has been pre-qualified",
  },
  [LEAD_STATUSES.FOLLOW_UP]: {
    label: "Follow Up",
    color: "warning",
    description: "Requires follow up",
  },
  [LEAD_STATUSES.APPLIED]: {
    label: "Applied",
    color: "secondary",
    description: "Application submitted",
  },
  [LEAD_STATUSES.REVIEW]: {
    label: "Review",
    color: "info",
    description: "Application under review",
  },
  [LEAD_STATUSES.QUALIFIED]: {
    label: "Qualified",
    color: "primary",
    description: "Lead has been qualified",
  },
  [LEAD_STATUSES.PENDING_DOCS]: {
    label: "Pending Docs",
    color: "warning",
    description: "Waiting for documents",
  },
  [LEAD_STATUSES.ADMITTED]: {
    label: "Admitted",
    color: "success",
    description: "Admitted to program",
  },
  [LEAD_STATUSES.ENROLLED]: {
    label: "Enrolled",
    color: "success",
    description: "Successfully enrolled",
  },
  [LEAD_STATUSES.DECLINED]: {
    label: "Declined",
    color: "default",
    description: "Lead declined offer",
  },
  [LEAD_STATUSES.DISQUALIFIED]: {
    label: "Disqualified",
    color: "error",
    description: "Lead disqualified",
  },
  [LEAD_STATUSES.REJECTED]: {
    label: "Rejected",
    color: "error",
    description: "Application rejected",
  },
  [LEAD_STATUSES.EXPIRED]: {
    label: "Expired",
    color: "default",
    description: "Lead expired",
  },
  [LEAD_STATUSES.ARCHIVED]: {
    label: "Archived",
    color: "default",
    description: "Lead archived",
  },
};

// Source configuration with display labels
export const SOURCE_CONFIG = {
  [LEAD_SOURCES.WEBSITE]: {
    label: "Website",
    icon: "🌐",
  },
  [LEAD_SOURCES.WHATSAPP]: {
    label: "WhatsApp",
    icon: "💬",
  },
  [LEAD_SOURCES.GOOGLE_ADS]: {
    label: "Google Ads",
    icon: "🔍",
  },
  [LEAD_SOURCES.META_ADS]: {
    label: "Meta Ads",
    icon: "📘",
  },
  [LEAD_SOURCES.REFERRAL]: {
    label: "Referral",
    icon: "👥",
  },
  [LEAD_SOURCES.DIRECT]: {
    label: "Direct",
    icon: "📞",
  },
  [LEAD_SOURCES.OTHER]: {
    label: "Other",
    icon: "📋",
  },
};
