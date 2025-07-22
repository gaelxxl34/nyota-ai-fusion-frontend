import React from "react";
import {
  Box,
  Paper,
  Skeleton,
  Avatar,
  Typography,
  Divider,
} from "@mui/material";

const ChatMessagesSkeleton = ({ count = 6 }) => {
  const renderMessageSkeleton = (isCustomer, index) => (
    <Box
      key={index}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: isCustomer ? "flex-start" : "flex-end",
        gap: 1,
        mb: 2,
      }}
    >
      {isCustomer && (
        <Avatar sx={{ width: 32, height: 32 }}>
          <Skeleton variant="circular" width={32} height={32} />
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isCustomer ? "flex-start" : "flex-end",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: isCustomer ? "#ffffff" : "#dcf8c6",
            borderRadius: "18px",
            borderTopLeftRadius: isCustomer ? "4px" : "18px",
            borderTopRightRadius: !isCustomer ? "4px" : "18px",
            boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            border: isCustomer ? "1px solid #e0e0e0" : "none",
          }}
        >
          <Skeleton
            variant="text"
            width={Math.random() * 200 + 100}
            height={16}
            sx={{ mb: 0.5 }}
          />
          {Math.random() > 0.5 && (
            <Skeleton
              variant="text"
              width={Math.random() * 150 + 80}
              height={16}
            />
          )}
        </Paper>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 0.5,
            justifyContent: isCustomer ? "flex-start" : "flex-end",
          }}
        >
          <Skeleton variant="text" width={40} height={12} />
        </Box>
      </Box>

      {!isCustomer && (
        <Avatar sx={{ width: 32, height: 32 }}>
          <Skeleton variant="circular" width={32} height={32} />
        </Avatar>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Chat Header Skeleton */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "#075E54",
          color: "white",
          borderBottom: "1px solid #128C7E",
        }}
      >
        <Avatar sx={{ width: 40, height: 40 }}>
          <Skeleton variant="circular" width={40} height={40} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: "white", fontSize: "1rem" }}>
            <Skeleton variant="text" width={120} height={20} />
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            <Skeleton variant="text" width={100} height={14} />
          </Typography>
        </Box>
      </Paper>

      <Divider />

      {/* Messages Area Skeleton */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "#e5ddd5",
          backgroundImage:
            "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEsLTEpIj48cGF0aCBkPSJNIDEsIDEgTCA5LCA5IE0gOSwgMSBMIDEsIDkiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {Array.from({ length: count }, (_, index) =>
          renderMessageSkeleton(index % 3 === 0, index)
        )}
      </Box>
    </Box>
  );
};

export default ChatMessagesSkeleton;
