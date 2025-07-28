import React from "react";
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
} from "@mui/material";
import { Sort as SortIcon, Visibility as ViewIcon } from "@mui/icons-material";
import SourceIcon from "../common/SourceIcon";

const LeadsTable = ({
  leads,
  loading,
  hasMore,
  sortBy,
  sortOrder,
  getStatusColor,
  formatDate,
  onSort,
  onViewLead,
  onLoadMore,
}) => {
  const tableColumns = [
    { id: "name", label: "Name", sortable: true },
    { id: "contact", label: "Contact", sortable: false },
    { id: "source", label: "Source", sortable: true },
    { id: "program", label: "Program", sortable: false },
    { id: "status", label: "Status", sortable: true },
    { id: "created", label: "Created", sortable: true },
    { id: "actions", label: "Actions", sortable: false },
  ];

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {tableColumns.map((column) => (
                <TableCell key={column.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {column.label}
                    {column.sortable && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          onSort(
                            column.id,
                            sortBy === column.id && sortOrder === "desc"
                              ? "asc"
                              : "desc"
                          )
                        }
                        color={sortBy === column.id ? "primary" : "default"}
                      >
                        <SortIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{ bgcolor: getStatusColor(lead.status) + ".light" }}
                    >
                      {lead.name?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {lead.name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {lead.id?.slice(-8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {lead.email || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lead.phone || "N/A"}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SourceIcon source={lead.source} />
                    <Typography variant="body2">
                      {lead.source?.replace(/_/g, " ") || "Unknown"}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {lead.program || "Not specified"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={lead.status?.replace(/_/g, " ") || "Unknown"}
                      color={getStatusColor(lead.status)}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {formatDate(lead.createdAt)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewLead(lead.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default LeadsTable;
