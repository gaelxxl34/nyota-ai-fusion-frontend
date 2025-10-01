// Main Analytics component
export { default as Analytics } from "./Analytics";

// Tab components
export { default as AdmissionsTab } from "./tabs/AdmissionsTab";
export { default as LeadAssignmentsTab } from "./tabs/LeadAssignmentsTab";
export { default as InsightsTab } from "./tabs/InsightsTab";

// Shared components
export { default as KpiCard } from "./shared/KpiCard";
export { default as InteractionMetrics } from "./shared/InteractionMetrics";
export { default as TimeFilter } from "./shared/TimeFilter";

// Custom hooks
export { default as useAnalyticsData } from "../../hooks/useAnalyticsData";
export { default as useAssignmentData } from "../../hooks/useAssignmentData";
