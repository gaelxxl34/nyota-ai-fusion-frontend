import React from "react";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";
import {
  Add as AddIcon,
  GetApp as ExportIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";

const LeadSpeedDial = ({ open, onOpen, onClose, onAddLead, onExportLeads }) => {
  const speedDialActions = [
    {
      icon: <AddIcon />,
      name: "Add Lead",
      action: onAddLead,
    },
    {
      icon: <ExportIcon />,
      name: "Export CSV",
      action: () => onExportLeads("csv"),
    },
    {
      icon: <AnalyticsIcon />,
      name: "Analytics",
      action: () => console.log("View analytics"),
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{ position: "fixed", bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
    >
      {speedDialActions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.action}
        />
      ))}
    </SpeedDial>
  );
};

export default LeadSpeedDial;
