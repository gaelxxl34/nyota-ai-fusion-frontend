import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  DeleteSweep as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const ChatSettingsPanel = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    autoRefreshInterval: 30,
    showUnreadOnly: false,
    enableNotifications: true,
    maxConversationsPerPage: 25,
    retentionDays: 90,
    enableAnalytics: true,
    autoDeleteOldChats: false,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    console.log("Saving settings:", settings);

    if (onSettingsChange) {
      onSettingsChange(settings);
    }

    setSnackbar({
      open: true,
      message: "Settings saved successfully",
      severity: "success",
    });
  };

  const handleResetSettings = () => {
    setSettings({
      autoRefresh: true,
      autoRefreshInterval: 30,
      showUnreadOnly: false,
      enableNotifications: true,
      maxConversationsPerPage: 25,
      retentionDays: 90,
      enableAnalytics: true,
      autoDeleteOldChats: false,
    });

    setSnackbar({
      open: true,
      message: "Settings reset to defaults",
      severity: "info",
    });
  };

  const handleCleanupOldChats = () => {
    // This would trigger cleanup on backend
    console.log("Cleaning up old chats...");

    setSnackbar({
      open: true,
      message: "Cleanup initiated - old conversations will be archived",
      severity: "warning",
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <SettingsIcon />
          Chat Management Settings
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure how the chat management system behaves and handles
          conversations.
        </Typography>

        <Grid container spacing={3}>
          {/* Display Settings */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Display Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoRefresh}
                      onChange={(e) =>
                        handleSettingChange("autoRefresh", e.target.checked)
                      }
                    />
                  }
                  label="Auto-refresh conversations"
                  sx={{ display: "block", mb: 2 }}
                />

                <TextField
                  label="Refresh interval (seconds)"
                  type="number"
                  value={settings.autoRefreshInterval}
                  onChange={(e) =>
                    handleSettingChange(
                      "autoRefreshInterval",
                      parseInt(e.target.value)
                    )
                  }
                  size="small"
                  sx={{ mb: 2, width: "100%" }}
                  disabled={!settings.autoRefresh}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showUnreadOnly}
                      onChange={(e) =>
                        handleSettingChange("showUnreadOnly", e.target.checked)
                      }
                    />
                  }
                  label="Show unread conversations only"
                  sx={{ display: "block", mb: 2 }}
                />

                <TextField
                  label="Conversations per page"
                  type="number"
                  value={settings.maxConversationsPerPage}
                  onChange={(e) =>
                    handleSettingChange(
                      "maxConversationsPerPage",
                      parseInt(e.target.value)
                    )
                  }
                  size="small"
                  sx={{ width: "100%" }}
                  inputProps={{ min: 10, max: 100 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notifications & Features
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "enableNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Enable notifications"
                  sx={{ display: "block", mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableAnalytics}
                      onChange={(e) =>
                        handleSettingChange("enableAnalytics", e.target.checked)
                      }
                    />
                  }
                  label="Enable analytics tracking"
                  sx={{ display: "block", mb: 2 }}
                />

                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    Current Status:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={
                        settings.autoRefresh
                          ? "Auto-refresh ON"
                          : "Auto-refresh OFF"
                      }
                      color={settings.autoRefresh ? "success" : "default"}
                      size="small"
                    />
                    <Chip
                      label={
                        settings.enableNotifications
                          ? "Notifications ON"
                          : "Notifications OFF"
                      }
                      color={
                        settings.enableNotifications ? "primary" : "default"
                      }
                      size="small"
                    />
                    <Chip
                      label={
                        settings.enableAnalytics
                          ? "Analytics ON"
                          : "Analytics OFF"
                      }
                      color={settings.enableAnalytics ? "info" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Data Management */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Management
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoDeleteOldChats}
                          onChange={(e) =>
                            handleSettingChange(
                              "autoDeleteOldChats",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Auto-delete old conversations"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Retention period (days)"
                      type="number"
                      value={settings.retentionDays}
                      onChange={(e) =>
                        handleSettingChange(
                          "retentionDays",
                          parseInt(e.target.value)
                        )
                      }
                      size="small"
                      fullWidth
                      disabled={!settings.autoDeleteOldChats}
                      inputProps={{ min: 1, max: 365 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<DeleteIcon />}
                      onClick={handleCleanupOldChats}
                      fullWidth
                    >
                      Cleanup Old Chats
                    </Button>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  Old conversations will be archived, not permanently deleted.
                  You can restore them from the archive if needed.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetSettings}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatSettingsPanel;
