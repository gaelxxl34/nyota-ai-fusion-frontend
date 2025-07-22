import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Api as ApiIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    requireEmailVerification: true,
    maxUsersPerOrg: 50,
    defaultLanguage: "en",
    maintenanceMode: false,
    allowNewRegistrations: true,
    apiRateLimit: 100,
    chatRetentionDays: 30,
    notifyAdminNewOrg: true,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // API call to save settings
      console.log("Saving settings:", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // General
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {/* Organization Settings Card */}
              <Card>
                <CardHeader
                  title="Organization Settings"
                  avatar={<AdminIcon color="primary" />}
                />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowNewRegistrations}
                        onChange={(e) =>
                          handleSettingChange(
                            "allowNewRegistrations",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Allow New Organization Registrations"
                  />
                  <TextField
                    fullWidth
                    label="Max Users per Organization"
                    type="number"
                    value={settings.maxUsersPerOrg}
                    onChange={(e) =>
                      handleSettingChange(
                        "maxUsersPerOrg",
                        parseInt(e.target.value)
                      )
                    }
                    margin="normal"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* System Settings Card */}
              <Card>
                <CardHeader
                  title="System Settings"
                  avatar={<ApiIcon color="primary" />}
                />
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenanceMode}
                        onChange={(e) =>
                          handleSettingChange(
                            "maintenanceMode",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Maintenance Mode"
                  />
                  <TextField
                    fullWidth
                    label="API Rate Limit (requests/min)"
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) =>
                      handleSettingChange(
                        "apiRateLimit",
                        parseInt(e.target.value)
                      )
                    }
                    margin="normal"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              {/* Chat Settings Card */}
              <Card>
                <CardHeader
                  title="Chat Settings"
                  avatar={<ChatIcon color="primary" />}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Chat History Retention (days)"
                        type="number"
                        value={settings.chatRetentionDays}
                        onChange={(e) =>
                          handleSettingChange(
                            "chatRetentionDays",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifyAdminNewOrg}
                            onChange={(e) =>
                              handleSettingChange(
                                "notifyAdminNewOrg",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Notify Admins of New Organizations"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1: // Security
        return (
          <Card>
            <CardHeader
              title="Security Settings"
              avatar={<SecurityIcon color="primary" />}
            />
            <CardContent>{/* Add security settings */}</CardContent>
          </Card>
        );

      case 2: // Email
        return (
          <Card>
            <CardHeader
              title="Email Configuration"
              avatar={<EmailIcon color="primary" />}
            />
            <CardContent>{/* Add email settings */}</CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure global system settings and controls
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab icon={<AdminIcon />} label="General" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Security" iconPosition="start" />
          <Tab icon={<EmailIcon />} label="Email" iconPosition="start" />
        </Tabs>
      </Paper>

      {renderTabContent()}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSettings;
