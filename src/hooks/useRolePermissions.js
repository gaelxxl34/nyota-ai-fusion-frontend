import { useAuth } from "../contexts/AuthContext";
import {
  hasPermission,
  canViewLeadStage,
  getLeadStageAccess,
  LEAD_STAGES,
} from "../config/roles.config";

/**
 * Custom hook for role-based permissions
 */
export const useRolePermissions = () => {
  const { getUserRole } = useAuth();
  const role = getUserRole();

  /**
   * Check if user has a specific permission
   */
  const checkPermission = (permission) => {
    return hasPermission(role, permission);
  };

  /**
   * Check if user can view a specific lead stage
   */
  const checkLeadStageAccess = (stage) => {
    return canViewLeadStage(role, stage);
  };

  /**
   * Get the lead stage range the user can access
   */
  const getLeadStageRange = () => {
    return getLeadStageAccess(role);
  };

  /**
   * Filter leads based on user's role access
   */
  const filterLeadsByRole = (leads) => {
    if (!leads || !Array.isArray(leads)) return [];

    const stageAccess = getLeadStageAccess(role);
    if (!stageAccess) return leads; // No restrictions

    return leads.filter((lead) => {
      const leadStage = lead.status || lead.stage;
      return canViewLeadStage(role, leadStage);
    });
  };

  /**
   * Get visible lead stages for the current role
   */
  const getVisibleLeadStages = () => {
    const stageAccess = getLeadStageAccess(role);
    if (!stageAccess) return Object.values(LEAD_STAGES);

    const stages = Object.values(LEAD_STAGES);
    const fromIndex = stages.indexOf(stageAccess.from);
    const toIndex = stages.indexOf(stageAccess.to);

    return stages.slice(fromIndex, toIndex + 1);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => {
    return role === "admin" || role === "admissionAdmin";
  };

  /**
   * Check if user is marketing agent
   */
  const isMarketingAgent = () => {
    return role === "marketingAgent";
  };

  /**
   * Check if user is admission agent
   */
  const isAdmissionAgent = () => {
    return role === "admissionAgent";
  };

  return {
    role,
    checkPermission,
    checkLeadStageAccess,
    getLeadStageRange,
    filterLeadsByRole,
    getVisibleLeadStages,
    isAdmin,
    isMarketingAgent,
    isAdmissionAgent,
  };
};
