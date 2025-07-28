/**
 * Frontend Role and Permission Configuration
 * Must match backend configuration
 */

export const LEAD_STAGES = {
  NEW_CONTACT: "new_contact",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  APPLIED: "applied",
  ADMITTED: "admitted",
  ENROLLED: "enrolled",
};

export const PERMISSIONS = {
  // Page access permissions
  LEADS_OVERVIEW: "leads_overview",
  CHAT_CONFIG: "chat_config",
  DATA_CENTER: "data_center",
  ANALYTICS: "analytics",
  TEAM: "team",
  SETTINGS: "settings",

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
      from: LEAD_STAGES.NEW_CONTACT,
      to: LEAD_STAGES.ENROLLED,
    },
  },

  marketingManager: {
    name: "Marketing Manager",
    description:
      "Access to marketing-related features (new contact to applied)",
    permissions: [
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.DATA_CENTER,
      PERMISSIONS.ANALYTICS,
      PERMISSIONS.SETTINGS,
      PERMISSIONS.VIEW_MARKETING_LEADS,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.NEW_CONTACT,
      to: LEAD_STAGES.APPLIED,
    },
  },

  admissionsOfficer: {
    name: "Admissions Officer",
    description: "Access to admissions-related features (applied to enrolled)",
    permissions: [
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.DATA_CENTER,
      PERMISSIONS.ANALYTICS,
      PERMISSIONS.SETTINGS,
      PERMISSIONS.VIEW_ADMISSIONS_LEADS,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.APPLIED,
      to: LEAD_STAGES.ENROLLED,
    },
  },

  teamMember: {
    name: "Team Member",
    description: "Basic access to leads and chat features",
    permissions: [
      PERMISSIONS.LEADS_OVERVIEW,
      PERMISSIONS.CHAT_CONFIG,
      PERMISSIONS.VIEW_ALL_LEADS,
    ],
    leadStageAccess: {
      from: LEAD_STAGES.NEW_CONTACT,
      to: LEAD_STAGES.ENROLLED,
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
    INQUIRY: LEAD_STAGES.NEW_CONTACT,
    CONTACTED: LEAD_STAGES.CONTACTED,
    PRE_QUALIFIED: LEAD_STAGES.QUALIFIED,
    QUALIFIED: LEAD_STAGES.QUALIFIED,
    APPLIED: LEAD_STAGES.APPLIED,
    ADMITTED: LEAD_STAGES.ADMITTED,
    ENROLLED: LEAD_STAGES.ENROLLED,
    REJECTED: LEAD_STAGES.NEW_CONTACT,
    NURTURE: LEAD_STAGES.CONTACTED,
    FOLLOW_UP: LEAD_STAGES.CONTACTED,
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
