/**
 * Frontend Role and Permission Configuration
 * Must match backend configuration
 */

export const LEAD_STAGES = {
  INTERESTED: "INTERESTED",
  APPLIED: "APPLIED",
  IN_REVIEW: "IN_REVIEW",
  QUALIFIED: "QUALIFIED",
  ADMITTED: "ADMITTED",
  ENROLLED: "ENROLLED",
  DEFERRED: "DEFERRED",
  EXPIRED: "EXPIRED",
};

export const PERMISSIONS = {
  // Page access permissions
  LEADS_OVERVIEW: "leads_overview",
  CHAT_CONFIG: "chat_config",
  DATA_CENTER: "data_center",
  ANALYTICS: "analytics",
  TEAM: "team",
  SETTINGS: "settings",
  KNOWLEDGE_BASE: "knowledge_base",

  // Data visibility permissions
  VIEW_ALL_LEADS: "view_all_leads",
  VIEW_MARKETING_LEADS: "view_marketing_leads",
  VIEW_ADMISSIONS_LEADS: "view_admissions_leads",

  // Action permissions
  MANAGE_TEAM: "manage_team",
  MANAGE_SETTINGS: "manage_settings",
  EXPORT_DATA: "export_data",
};

export const ROLES = {
  superAdmin: {
    name: "Super Admin",
    description: "Full system access",
    permissions: Object.values(PERMISSIONS),
  },

  admin: {
    name: "Admin",
    description: "Full access to IUEA features",
    permissions: Object.values(PERMISSIONS),
    leadStageAccess: {
      from: LEAD_STAGES.INTERESTED,
      to: LEAD_STAGES.EXPIRED,
    },
  },

  admissionAdmin: {
    name: "Admission Admin",
    description:
      "Administrative access to admission features (Applied to Enrolled stages)",
    permissions: [
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.DATA_CENTER,
      PERMISSIONS.ANALYTICS,
      PERMISSIONS.TEAM,
      PERMISSIONS.SETTINGS,
      PERMISSIONS.KNOWLEDGE_BASE,
      PERMISSIONS.VIEW_ADMISSIONS_LEADS,
      PERMISSIONS.MANAGE_TEAM,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.EXPORT_DATA,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.APPLIED,
      to: LEAD_STAGES.EXPIRED,
    },
  },

  marketingAgent: {
    name: "Marketing Agent",
    description:
      "Access to marketing-related features (Interested to Admitted)",
    permissions: [
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.DATA_CENTER,
      PERMISSIONS.SETTINGS,
      PERMISSIONS.VIEW_MARKETING_LEADS,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.INTERESTED,
      to: LEAD_STAGES.ADMITTED,
    },
  },

  admissionAgent: {
    name: "Admission Agent",
    description:
      "Access to admissions-related features (Applied to the very end)",
    permissions: [
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.DATA_CENTER,
      PERMISSIONS.SETTINGS,
      PERMISSIONS.VIEW_ADMISSIONS_LEADS,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.APPLIED,
      to: LEAD_STAGES.EXPIRED,
    },
  },
};

// Helper functions
export const getRolePermissions = (role) => {
  return ROLES[role]?.permissions || [];
};

export const hasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

export const getLeadStageAccess = (role) => {
  return ROLES[role]?.leadStageAccess || null;
};

export const canViewLeadStage = (role, stage) => {
  const access = getLeadStageAccess(role);
  if (!access) return false;

  // Map database status values to our LEAD_STAGES
  const statusToStageMap = {
    INTERESTED: LEAD_STAGES.INTERESTED,
    APPLIED: LEAD_STAGES.APPLIED,
    IN_REVIEW: LEAD_STAGES.IN_REVIEW,
    QUALIFIED: LEAD_STAGES.QUALIFIED,
    ADMITTED: LEAD_STAGES.ADMITTED,
    ENROLLED: LEAD_STAGES.ENROLLED,
    DEFERRED: LEAD_STAGES.DEFERRED,
    EXPIRED: LEAD_STAGES.EXPIRED,
    // Legacy status mappings for backward compatibility
    NO_LEAD: LEAD_STAGES.INTERESTED,
    INQUIRY: LEAD_STAGES.INTERESTED,
    PRE_QUALIFIED: LEAD_STAGES.QUALIFIED,
    REJECTED: LEAD_STAGES.EXPIRED,
    NURTURE: LEAD_STAGES.INTERESTED,
    FOLLOW_UP: LEAD_STAGES.QUALIFIED,
    REVIEW: LEAD_STAGES.IN_REVIEW,
    PENDING_DOCS: LEAD_STAGES.IN_REVIEW,
    SUCCESS: LEAD_STAGES.ENROLLED,
  };

  // Convert the stage if it's a database status value
  const normalizedStage = statusToStageMap[stage] || stage;

  const stages = Object.values(LEAD_STAGES);
  const fromIndex = stages.indexOf(access.from);
  const toIndex = stages.indexOf(access.to);
  const stageIndex = stages.indexOf(normalizedStage);

  return stageIndex >= fromIndex && stageIndex <= toIndex;
};

// Get display-friendly role options for forms
export const getRoleOptions = () => {
  return Object.entries(ROLES)
    .filter(([key]) => key !== "superAdmin") // Exclude super admin from regular forms
    .map(([value, config]) => ({
      value,
      label: config.name,
      description: config.description,
    }));
};
