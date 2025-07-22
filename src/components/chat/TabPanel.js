import React from "react";
import { Box } from "@mui/material";

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        height: "100%",
        display: value === index ? "flex" : "none",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        position: "relative",
      }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel;
