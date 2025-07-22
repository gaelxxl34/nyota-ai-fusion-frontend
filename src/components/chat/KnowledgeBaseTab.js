import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  School as SchoolIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Psychology as PsychologyIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { axiosInstance } from "../../services/axiosConfig";

const KnowledgeBaseTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [newItem, setNewItem] = useState({
    category: "general",
    title: "",
    content: "",
    tags: "",
    priority: "medium",
  });

  // Simplified categories
  const categories = [
    { id: "all", label: "All", icon: <InfoIcon />, color: "#9e9e9e" },
    {
      id: "academics",
      label: "Academics",
      icon: <SchoolIcon />,
      color: "#2196f3",
    },
    { id: "fees", label: "Fees", icon: <MoneyIcon />, color: "#4caf50" },
    {
      id: "admissions",
      label: "Admissions",
      icon: <AssignmentIcon />,
      color: "#ff9800",
    },
    { id: "general", label: "General", icon: <InfoIcon />, color: "#607d8b" },
  ];

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/whatsapp/knowledge");
      const data = response.data;

      if (data.success) {
        setKnowledgeItems(data.data);
      }
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      showSnackbar("Failed to load knowledge base", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredItems = knowledgeItems.filter((item) => {
    const matchesSearch =
      (item.title &&
        item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.content &&
        item.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tags &&
        item.tags.some(
          (tag) => tag && tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    const matchesCategory =
      selectedCategory === "all" ||
      (item.category && item.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleSaveItem = async () => {
    if (!newItem.title.trim() || !newItem.content.trim()) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      const item = {
        category: newItem.category,
        title: newItem.title,
        content: newItem.content,
        tags: newItem.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        priority: newItem.priority,
      };

      let response;
      if (editingItem) {
        response = await axiosInstance.put(
          `/api/whatsapp/knowledge/${editingItem.id}`,
          item
        );
      } else {
        response = await axiosInstance.post("/api/whatsapp/knowledge", item);
      }

      const data = response.data;
      if (data.success) {
        showSnackbar(
          editingItem
            ? "Knowledge item updated successfully"
            : "Knowledge item added successfully"
        );
        await loadKnowledgeBase();
        handleCloseDialog();
      } else {
        showSnackbar(data.error || "Failed to save knowledge item", "error");
      }
    } catch (error) {
      console.error("Error saving knowledge item:", error);
      showSnackbar("Failed to save knowledge item", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      ...item,
      tags: item.tags ? item.tags.join(", ") : "",
    });
    setDialogOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      setLoading(true);
      const response = await axiosInstance.delete(
        `/api/whatsapp/knowledge/${id}`
      );
      const data = response.data;

      if (data.success) {
        showSnackbar("Knowledge item deleted successfully");
        await loadKnowledgeBase();
      } else {
        showSnackbar(data.error || "Failed to delete knowledge item", "error");
      }
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      showSnackbar("Failed to delete knowledge item", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setNewItem({
      category: "general",
      title: "",
      content: "",
      tags: "",
      priority: "medium",
    });
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find((cat) => cat.id === categoryId) || categories[4];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#f44336";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: "#2196f3", mr: 2, width: 48, height: 48 }}>
            <PsychologyIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Knowledge Base
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage AI assistant knowledge for student responses
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Add knowledge items to help the AI assistant provide accurate
            information about programs, fees, and services.
          </Typography>
        </Alert>
      </Box>

      {/* Search and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search knowledge base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={
                    selectedCategory === category.id ? "filled" : "outlined"
                  }
                  size="small"
                  sx={{
                    bgcolor:
                      selectedCategory === category.id
                        ? category.color
                        : "transparent",
                    color:
                      selectedCategory === category.id
                        ? "white"
                        : category.color,
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              fullWidth
              size="small"
            >
              Add Item
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Knowledge Items */}
      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : filteredItems.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <PsychologyIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No knowledge items found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start by adding knowledge items"}
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredItems.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            return (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: categoryInfo.color,
                          width: 24,
                          height: 24,
                          mr: 1,
                        }}
                      >
                        {React.cloneElement(categoryInfo.icon, {
                          sx: { fontSize: 14 },
                        })}
                      </Avatar>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 11, fontWeight: 500 }}
                      >
                        {categoryInfo.label}
                      </Typography>
                      <Chip
                        label={item.priority}
                        size="small"
                        sx={{
                          ml: "auto",
                          height: 16,
                          fontSize: 9,
                          bgcolor: getPriorityColor(item.priority),
                          color: "white",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: 14,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        fontSize: 12,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.content}
                    </Typography>

                    {item.tags && item.tags.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {item.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ height: 16, fontSize: 9 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditItem(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(item.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit Knowledge Item" : "Add New Knowledge Item"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                SelectProps={{ native: true }}
                size="small"
              >
                {categories.slice(1).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priority"
                select
                value={newItem.priority}
                onChange={(e) =>
                  setNewItem({ ...newItem, priority: e.target.value })
                }
                SelectProps={{ native: true }}
                size="small"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newItem.title}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={4}
                value={newItem.content}
                onChange={(e) =>
                  setNewItem({ ...newItem, content: e.target.value })
                }
                placeholder="Enter detailed information..."
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={newItem.tags}
                onChange={(e) =>
                  setNewItem({ ...newItem, tags: e.target.value })
                }
                placeholder="e.g. undergraduate, fees, technology"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {editingItem ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KnowledgeBaseTab;
