import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Insights as InsightsIcon,
  Menu as MenuIcon,
  Storage as DataCenterIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 280;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, getUserRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getMenuItems = () => {
    const role = getUserRole();
    const items = [];

    switch (role) {
      case "systemAdmin":
        items.push(
          {
            text: "Dashboard",
            icon: <DashboardIcon />,
            path: "/admin/dashboard",
          },
          {
            text: "Organizations",
            icon: <BusinessIcon />,
            path: "/admin/organizations",
          },
          { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
          { text: "Chat Management", icon: <ChatIcon />, path: "/admin/chat" },
          {
            text: "Admin Settings",
            icon: <AdminIcon />,
            path: "/admin/admin-settings",
          },
          { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" }
        );
        break;

      case "organizationAdmin":
        items.push(
          {
            text: "Dashboard",
            icon: <DashboardIcon />,
            path: "/organization/dashboard",
          },
          { text: "Team", icon: <PeopleIcon />, path: "/organization/team" },
          {
            text: "Leads Overview",
            icon: <InsightsIcon />,
            path: "/organization/leads",
          },
          {
            text: "Chat Configuration",
            icon: <ChatIcon />,
            path: "/organization/chat-config",
          },
          {
            text: "Data Center",
            icon: <DataCenterIcon />,
            path: "/organization/data-center",
          },
          {
            text: "Analytics",
            icon: <InsightsIcon />,
            path: "/organization/analytics",
          },
          {
            text: "Settings",
            icon: <SettingsIcon />,
            path: "/organization/settings",
          }
        );
        break;

      case "leadManager":
        items.push({
          text: "Dashboard",
          icon: <DashboardIcon />,
          path: "/organization/dashboard",
        });
        if (hasPermission("leads")) {
          items.push({
            text: "Leads Overview",
            icon: <InsightsIcon />,
            path: "/organization/leads",
          });
        }
        break;

      case "customerSupport":
      case "salesManager":
      case "marketingManager":
        items.push({
          text: "Dashboard",
          icon: <DashboardIcon />,
          path: "/organization/dashboard",
        });
        if (hasPermission("chat-config")) {
          items.push({
            text: "Chat Configuration",
            icon: <ChatIcon />,
            path: "/organization/chat-config",
          });
        }
        if (hasPermission("leads")) {
          items.push({
            text: "Leads Overview",
            icon: <InsightsIcon />,
            path: "/organization/leads",
          });
        }
        if (hasPermission("lead-management")) {
          items.push({
            text: "Lead Management",
            icon: <AssessmentIcon />,
            path: "/organization/lead-management",
          });
        }
        break;

      default:
        if (hasPermission("dashboard")) {
          items.push({
            text: "Dashboard",
            icon: <DashboardIcon />,
            path: "/organization/dashboard",
          });
        }
    }

    if (hasPermission("analytics")) {
      items.push({
        text: "Analytics",
        icon: <InsightsIcon />,
        path: "/organization/analytics",
      });
    }

    return items;
  };

  const isCurrentPath = (path) => location.pathname === path;

  const drawer = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 2,
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: "primary.light",
            mb: 1,
          }}
        >
          {user?.email?.charAt(0)?.toUpperCase()}
        </Avatar>
      </Toolbar>
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Typography
          variant="subtitle2"
          color="primary.contrastText"
          align="center"
        >
          {user?.email}
        </Typography>
        <Typography variant="body2" color="primary.contrastText" align="center">
          {getUserRole()}
        </Typography>
        {getUserRole() === "organizationAdmin" && (
          <Typography
            variant="caption"
            color="primary.contrastText"
            align="center"
            display="block"
          >
            {user?.organization?.name}
          </Typography>
        )}
      </Box>
      <Divider sx={{ bgcolor: "primary.light" }} />
      <List sx={{ pt: 2 }}>
        {getMenuItems().map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              mb: 1,
              mx: 1,
              borderRadius: 1,
              bgcolor: isCurrentPath(item.path)
                ? "primary.light"
                : "transparent",
              "&:hover": {
                bgcolor: "primary.light",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider sx={{ my: 2, bgcolor: "primary.light" }} />
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            mx: 1,
            borderRadius: 1,
            "&:hover": {
              bgcolor: "primary.light",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "background.paper",
          color: "primary.main",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Nyota AI Fusion - Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
