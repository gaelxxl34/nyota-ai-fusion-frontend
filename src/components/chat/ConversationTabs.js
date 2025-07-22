import React from "react";
import { Box, Tabs, Tab, Badge } from "@mui/material";

const ConversationTabs = ({ tabValue, onTabChange, tabs, getTabCount }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={tabValue}
        onChange={onTabChange}
        aria-label="conversation tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          "& .MuiTab-root": {
            minHeight: 48,
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            transition: "all 0.2s ease-in-out",
            cursor: "pointer",
            minWidth: 100,
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
            "&.Mui-selected": {
              fontWeight: 600,
            },
          },
        }}
      >
        {tabs.map((tab, index) => {
          const count = index === tabs.length - 1 ? 0 : getTabCount(index); // No count for Knowledge Base

          return (
            <Tab
              key={index}
              icon={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: "1.1em" }}>{tab.icon}</span>
                  {count > 0 && (
                    <Badge
                      badgeContent={count}
                      color="primary"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.7rem",
                          minWidth: 18,
                          height: 18,
                        },
                      }}
                    />
                  )}
                </Box>
              }
              label={tab.label}
              id={tab.tabId}
              aria-controls={`tabpanel-${index}`}
              sx={{
                "&.Mui-selected": {
                  color: tab.color,
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default ConversationTabs;
