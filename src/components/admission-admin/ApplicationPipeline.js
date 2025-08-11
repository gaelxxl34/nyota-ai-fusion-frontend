import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Description as DocumentIcon,
  RateReview as ReviewIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";

/**
 * Pipeline Item Component
 */
const PipelineItem = ({ item, type, onView, onEdit }) => {
  const getIcon = () => {
    switch (type) {
      case "urgent":
        return <WarningIcon color="error" />;
      case "recent":
        return <ScheduleIcon color="primary" />;
      case "missing":
        return <DocumentIcon color="warning" />;
      case "ready":
        return <ReviewIcon color="success" />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getTimeText = () => {
    switch (type) {
      case "urgent":
        return `${item.daysSinceReview} days in review`;
      case "recent":
        return new Date(item.submittedAt).toLocaleDateString();
      case "missing":
        return `${item.daysSinceApplication} days ago`;
      case "ready":
        return `Ready for ${item.daysSinceReady} days`;
      default:
        return "";
    }
  };

  const getSecondaryText = () => {
    switch (type) {
      case "missing":
        return `Missing: ${item.missingDocs?.join(", ")}`;
      case "urgent":
        return item.reason;
      default:
        return item.program;
    }
  };

  return (
    <ListItem
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        mb: 1,
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <ListItemIcon>{getIcon()}</ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" fontWeight={500}>
              {item.name}
            </Typography>
            {type === "urgent" && (
              <Chip label="URGENT" color="error" size="small" />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="textSecondary">
              {getSecondaryText()}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <TimeIcon sx={{ fontSize: 14, color: "textSecondary" }} />
              <Typography variant="caption" color="textSecondary">
                {getTimeText()}
              </Typography>
            </Box>
          </Box>
        }
      />
      <Box display="flex" gap={1}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView?.(item)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit?.(item)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItem>
  );
};

/**
 * Pipeline Section Component
 */
const PipelineSection = ({
  title,
  items = [],
  type,
  maxItems = 5,
  onViewAll,
  onViewItem,
  onEditItem,
}) => {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  const getSectionColor = () => {
    switch (type) {
      case "urgent":
        return "error";
      case "recent":
        return "primary";
      case "missing":
        return "warning";
      case "ready":
        return "success";
      default:
        return "primary";
    }
  };

  return (
    <Box mb={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" color={`${getSectionColor()}.main`}>
            {title}
          </Typography>
          <Badge badgeContent={items.length} color={getSectionColor()} />
        </Box>
        {hasMore && (
          <Button size="small" onClick={() => onViewAll?.(type)}>
            View All ({items.length})
          </Button>
        )}
      </Box>

      {displayItems.length === 0 ? (
        <Box
          p={3}
          textAlign="center"
          border={1}
          borderColor="divider"
          borderRadius={1}
          bgcolor="grey.50"
        >
          <Typography variant="body2" color="textSecondary">
            No items in this category
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {displayItems.map((item) => (
            <PipelineItem
              key={item.id}
              item={item}
              type={type}
              onView={onViewItem}
              onEdit={onEditItem}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

/**
 * Real-time Application Pipeline Component
 */
const ApplicationPipeline = ({
  pipeline,
  loading = false,
  onViewItem,
  onEditItem,
  onViewAllItems,
}) => {
  if (loading) {
    return null; // Skeleton will be handled by parent
  }

  const sections = [
    {
      title: "Urgent Attention",
      type: "urgent",
      items: pipeline?.urgent || [],
      description: "Applications requiring immediate action",
    },
    {
      title: "Ready for Review",
      type: "ready",
      items: pipeline?.readyForReview || [],
      description: "Complete applications awaiting evaluation",
    },
    {
      title: "Recent Applications",
      type: "recent",
      items: pipeline?.recentApplications || [],
      description: "Submitted in the last 48 hours",
    },
    {
      title: "Missing Documents",
      type: "missing",
      items: pipeline?.missingDocuments || [],
      description: "Applications with incomplete documentation",
    },
  ];

  const getTotalItems = () => {
    return sections.reduce((total, section) => total + section.items.length, 0);
  };

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Typography variant="h6" fontWeight="bold">
            Application Pipeline
          </Typography>
          <Chip
            label={`${getTotalItems()} Total Items`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
          {sections.map((section, index) => (
            <React.Fragment key={section.type}>
              <PipelineSection
                title={section.title}
                items={section.items}
                type={section.type}
                maxItems={3}
                onViewAll={onViewAllItems}
                onViewItem={onViewItem}
                onEditItem={onEditItem}
              />
              {index < sections.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </Box>

        {getTotalItems() === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              All Caught Up! 🎉
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No pending items in the pipeline right now.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationPipeline;
