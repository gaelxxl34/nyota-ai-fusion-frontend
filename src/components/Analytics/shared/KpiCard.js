import React from "react";
import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "primary",
  statusCode,
  clickable = false,
  onClick,
  ...props
}) => {
  const handleClick = () => {
    if (clickable && onClick && statusCode) {
      onClick(statusCode);
    }
  };

  return (
    <Card
      sx={{
        height: 140,
        display: "flex",
        alignItems: "center",
        cursor: clickable ? "pointer" : "default",
        transition: "all 0.3s ease",
        "&:hover": clickable
          ? {
              transform: "translateY(-2px)",
              boxShadow: 3,
            }
          : {},
        ...props.sx,
      }}
      onClick={handleClick}
    >
      <CardContent
        sx={{
          textAlign: "center",
          width: "100%",
          py: 2,
          "&:last-child": { pb: 2 },
        }}
      >
        {Icon && (
          <Box sx={{ mb: 1 }}>
            <Icon
              sx={{
                fontSize: 32,
                color: `${color}.main`,
              }}
            />
          </Box>
        )}
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: `${color}.main`,
            mb: 0.5,
          }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
        {clickable && (
          <Tooltip title={`Click to view ${title} details`}>
            <Typography
              variant="caption"
              color="primary.main"
              sx={{ mt: 0.5, display: "block" }}
            >
              Click to view details →
            </Typography>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
