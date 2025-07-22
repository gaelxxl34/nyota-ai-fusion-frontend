import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Button,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Switch,
  Tooltip,
  Tab,
  Tabs,
  IconButton,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  RestartAlt as ResetIcon,
  Translate as TranslateIcon,
} from "@mui/icons-material";
import { ChromePicker } from "react-color";

const colorThemes = [
  {
    id: "default",
    name: "Default Theme",
    colors: {
      primary: "#1a237e",
      secondary: "#000000",
    },
    preview: {
      background: "#ffffff",
      text: "#000000",
    },
  },
  {
    id: "dark",
    name: "Dark Theme",
    colors: {
      primary: "#000000",
      secondary: "#1a237e",
    },
    preview: {
      background: "#121212",
      text: "#ffffff",
    },
  },
  {
    id: "light",
    name: "Light Theme",
    colors: {
      primary: "#2196f3",
      secondary: "#000000",
    },
    preview: {
      background: "#ffffff",
      text: "#000000",
    },
  },
];

const Settings = ({ onThemeChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [customColors, setCustomColors] = useState({
    primary: "#1a237e",
    secondary: "#000000",
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorToEdit, setColorToEdit] = useState(null);
  const [settings, setSettings] = useState({
    isDarkMode: false,
    useCustomColors: false,
    emailNotifications: true,
    desktopNotifications: true,
    notificationSound: true,
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "24h",
    autoDeleteChats: false,
    chatRetentionDays: 30,
    exportData: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiration: 90,
    apiAccess: false,
    webhookUrl: "",
    maxApiCalls: 1000,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleThemeChange = (event) => {
    const themeId = event.target.value;
    setSelectedTheme(themeId);
    const theme = colorThemes.find((theme) => theme.id === themeId);
    if (theme) {
      onThemeChange(theme.colors);
      localStorage.setItem("themeColors", JSON.stringify(theme.colors));
    }
  };

  const handleReset = (settingType) => {
    switch (settingType) {
      case "theme":
        setSelectedTheme("default");
        setCustomColors({ primary: "#1a237e", secondary: "#000000" });
        onThemeChange({ primary: "#1a237e", secondary: "#000000" });
        localStorage.removeItem("themeColors");
        break;
      case "notifications":
        setSettings((prev) => ({
          ...prev,
          emailNotifications: true,
          desktopNotifications: true,
          notificationSound: true,
        }));
        break;
      case "language":
        setSettings((prev) => ({
          ...prev,
          language: "en",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "24h",
        }));
        break;
      case "all":
        setSettings({
          isDarkMode: false,
          useCustomColors: false,
          emailNotifications: true,
          desktopNotifications: true,
          notificationSound: true,
          language: "en",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "24h",
        });
        setSelectedTheme("default");
        setCustomColors({ primary: "#1a237e", secondary: "#000000" });
        onThemeChange({ primary: "#1a237e", secondary: "#000000" });
        localStorage.clear();
        break;
      default:
        break;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Appearance
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  avatar={<PaletteIcon />}
                  title="Theme Customization"
                  action={
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.isDarkMode}
                          onChange={(e) =>
                            handleSettingChange("isDarkMode", e.target.checked)
                          }
                        />
                      }
                      label="Dark Mode"
                    />
                  }
                />
                <CardContent>
                  <RadioGroup
                    value={selectedTheme}
                    onChange={handleThemeChange}
                  >
                    <Grid container spacing={2}>
                      {colorThemes.map((theme) => (
                        <Grid item xs={12} md={4} key={theme.id}>
                          <Paper
                            sx={{
                              p: 2,
                              border: "2px solid",
                              borderColor:
                                selectedTheme === theme.id
                                  ? "primary.main"
                                  : "grey.300",
                              cursor: "pointer",
                              "&:hover": {
                                borderColor: "primary.main",
                                transform: "translateY(-2px)",
                                transition: "transform 0.2s",
                              },
                            }}
                          >
                            <FormControlLabel
                              value={theme.id}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Typography variant="subtitle1">
                                    {theme.name}
                                  </Typography>
                                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                    {Object.entries(theme.colors).map(
                                      ([key, color]) => (
                                        <Box
                                          key={key}
                                          sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: color,
                                            borderRadius: 1,
                                            border: "1px solid",
                                            borderColor: "grey.300",
                                          }}
                                        />
                                      )
                                    )}
                                  </Box>
                                </Box>
                              }
                              sx={{ width: "100%", m: 0 }}
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Custom Colors
                  </Typography>
                  <Grid container spacing={2}>
                    {["primary", "secondary"].map((colorType) => (
                      <Grid item xs={12} sm={6} key={colorType}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            onClick={() => {
                              setColorToEdit(colorType);
                              setColorPickerOpen(true);
                            }}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: customColors[colorType],
                              borderRadius: 1,
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor: "grey.300",
                            }}
                          />
                          <Typography>
                            {colorType.charAt(0).toUpperCase() +
                              colorType.slice(1)}{" "}
                            Color
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1: // Notifications
        return (
          <Card>
            <CardHeader
              avatar={<NotificationsIcon />}
              title="Notification Settings"
              action={
                <IconButton onClick={() => handleReset("notifications")}>
                  <Tooltip title="Reset Notification Settings">
                    <ResetIcon />
                  </Tooltip>
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) =>
                          handleSettingChange(
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 2: // Language & Region
        return (
          <Card>
            <CardHeader
              avatar={<TranslateIcon />}
              title="Language & Region Settings"
              action={
                <IconButton onClick={() => handleReset("language")}>
                  <Tooltip title="Reset Language Settings">
                    <ResetIcon />
                  </Tooltip>
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.language}
                      label="Language"
                      onChange={(e) =>
                        handleSettingChange("language", e.target.value)
                      }
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.dateFormat}
                      label="Date Format"
                      onChange={(e) =>
                        handleSettingChange("dateFormat", e.target.value)
                      }
                    >
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={settings.timeFormat}
                      label="Time Format"
                      onChange={(e) =>
                        handleSettingChange("timeFormat", e.target.value)
                      }
                    >
                      <MenuItem value="12h">12-hour</MenuItem>
                      <MenuItem value="24h">24-hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">System Settings</Typography>
        <Button
          startIcon={<ResetIcon />}
          variant="outlined"
          color="warning"
          onClick={() => handleReset("all")}
        >
          Reset All Settings
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<PaletteIcon />} label="Appearance" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<LanguageIcon />} label="Language & Region" />
          <Tab icon={<StorageIcon />} label="Storage & Data" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>
      </Paper>

      {renderTabContent()}

      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
        <Box sx={{ p: 2 }}>
          <ChromePicker
            color={customColors[colorToEdit]}
            onChange={(color) => {
              setCustomColors((prev) => ({
                ...prev,
                [colorToEdit]: color.hex,
              }));
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onThemeChange(customColors);
              setColorPickerOpen(false);
            }}
            sx={{ mt: 2 }}
          >
            Apply Color
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Settings;
