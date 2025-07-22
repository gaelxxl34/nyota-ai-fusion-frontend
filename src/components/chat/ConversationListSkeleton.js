import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Avatar,
} from "@mui/material";

const ConversationListSkeleton = ({ count = 5 }) => {
  return (
    <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
      {Array.from({ length: count }, (_, index) => (
        <ListItem key={index} sx={{ px: 2, py: 1.5 }}>
          <ListItemAvatar>
            <Avatar sx={{ width: 40, height: 40 }}>
              <Skeleton variant="circular" width={40} height={40} />
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            sx={{ flex: 1, ml: 1 }}
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Box sx={{ flex: 1 }} />
                <Skeleton variant="text" width="30px" height={16} />
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ConversationListSkeleton;
