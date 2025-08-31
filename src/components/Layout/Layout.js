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
  People as PeopleIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Insights as InsightsIcon,
  Menu as MenuIcon,
  Storage as DataCenterIcon,
  MenuBook as KnowledgeBaseIcon,
  CloudUpload as ImportIcon,
  Campaign as CampaignIcon,
  Send as BulkActionsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PERMISSIONS,
  hasPermission as checkPermission,
} from "../../config/roles.config";

const drawerWidth = 280;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getUserRole } = useAuth();
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

    // Super Admin menu
    if (role === "superAdmin") {
      return [
        {
          text: "Dashboard",
          icon: <DashboardIcon />,
          path: "/super-admin/dashboard",
        },
        {
          text: "User Management",
          icon: <PeopleIcon />,
          path: "/super-admin/users",
        },
        {
          text: "Lead Forms",
          icon: <CampaignIcon />,
          path: "/super-admin/lead-forms",
        },
        {
          text: "Bulk Actions",
          icon: <BulkActionsIcon />,
          path: "/super-admin/bulk-actions",
        },
        {
          text: "Chat Management",
          icon: <ChatIcon />,
          path: "/super-admin/chat",
        },
        {
          text: "Admin Settings",
          icon: <AdminIcon />,
          path: "/super-admin/admin-settings",
        },
        {
          text: "Settings",
          icon: <SettingsIcon />,
          path: "/super-admin/settings",
        },
      ];
    }

    // Admission Admin menu
    if (role === "admissionAdmin") {
      const admissionAdminItems = [
        {
          text: "Dashboard",
          icon: <DashboardIcon />,
          path: "/admission-admin/dashboard",
        },
        {
          text: "Import Data",
          icon: <ImportIcon />,
          path: "/admission-admin/import-data",
        },
      ];

      // Add admin-level items for admission admin
      if (checkPermission(role, PERMISSIONS.LEADS_OVERVIEW)) {
        admissionAdminItems.push({
          text: "Leads Overview",
          icon: <InsightsIcon />,
          path: "/admin/leads",
        });
      }

      if (checkPermission(role, PERMISSIONS.CHAT_CONFIG)) {
        admissionAdminItems.push({
          text: "Chat Configuration",
          icon: <ChatIcon />,
          path: "/admin/chat-config",
        });
      }

      // Knowledge Base is available to all admin roles
      admissionAdminItems.push({
        text: "Knowledge Base",
        icon: <KnowledgeBaseIcon />,
        path: "/admin/knowledge-base",
      });

      if (checkPermission(role, PERMISSIONS.DATA_CENTER)) {
        admissionAdminItems.push({
          text: "Data Center",
          icon: <DataCenterIcon />,
          path: "/admin/data-center",
        });
      }

      if (checkPermission(role, PERMISSIONS.ANALYTICS)) {
        admissionAdminItems.push({
          text: "Analytics",
          icon: <InsightsIcon />,
          path: "/admin/analytics",
        });
      }

      if (checkPermission(role, PERMISSIONS.TEAM)) {
        admissionAdminItems.push({
          text: "Team",
          icon: <PeopleIcon />,
          path: "/admin/team",
        });
      }

      if (checkPermission(role, PERMISSIONS.SETTINGS)) {
        admissionAdminItems.push({
          text: "Settings",
          icon: <SettingsIcon />,
          path: "/admin/settings",
        });
      }

      return admissionAdminItems;
    }

    // Admission Agent menu
    if (role === "admissionAgent") {
      const admissionAgentItems = [];

      // Add basic items that admission agents need
      if (checkPermission(role, PERMISSIONS.DATA_CENTER)) {
        admissionAgentItems.push({
          text: "Data Center",
          icon: <DataCenterIcon />,
          path: "/admin/data-center",
        });
      }

      // Import Data is specifically available to admission agents
      admissionAgentItems.push({
        text: "Import Data",
        icon: <ImportIcon />,
        path: "/admin/import-data",
      });

      // Chat Configuration for admission agents
      if (checkPermission(role, PERMISSIONS.CHAT_CONFIG)) {
        admissionAgentItems.push({
          text: "Chat Configuration",
          icon: <ChatIcon />,
          path: "/admin/chat-config",
        });
      }

      // Knowledge Base is available to all admin roles
      admissionAgentItems.push({
        text: "Knowledge Base",
        icon: <KnowledgeBaseIcon />,
        path: "/admin/knowledge-base",
      });

      if (checkPermission(role, PERMISSIONS.SETTINGS)) {
        admissionAgentItems.push({
          text: "Settings",
          icon: <SettingsIcon />,
          path: "/admin/settings",
        });
      }

      return admissionAgentItems;
    }

    // Admin level menu based on permissions (for IUEA admins and staff)
    const adminMenuItems = [];

    // Check permissions for each menu item
    if (checkPermission(role, PERMISSIONS.LEADS_OVERVIEW)) {
      adminMenuItems.push({
        text: "Leads Overview",
        icon: <InsightsIcon />,
        path: "/admin/leads",
      });
    }

    if (checkPermission(role, PERMISSIONS.CHAT_CONFIG)) {
      adminMenuItems.push({
        text: "Chat Configuration",
        icon: <ChatIcon />,
        path: "/admin/chat-config",
      });
    }

    // Knowledge Base is available to all admin roles
    adminMenuItems.push({
      text: "Knowledge Base",
      icon: <KnowledgeBaseIcon />,
      path: "/admin/knowledge-base",
    });

    if (checkPermission(role, PERMISSIONS.DATA_CENTER)) {
      adminMenuItems.push({
        text: "Data Center",
        icon: <DataCenterIcon />,
        path: "/admin/data-center",
      });
    }

    // Import Data is available to admin roles
    if (role === "admin") {
      adminMenuItems.push({
        text: "Import Data",
        icon: <ImportIcon />,
        path: "/admin/import-data",
      });
    }

    if (checkPermission(role, PERMISSIONS.ANALYTICS)) {
      adminMenuItems.push({
        text: "Analytics",
        icon: <InsightsIcon />,
        path: "/admin/analytics",
      });
    }

    if (
      checkPermission(role, PERMISSIONS.TEAM) &&
      (role === "admin" || role === "admissionAdmin")
    ) {
      adminMenuItems.push({
        text: "Team",
        icon: <PeopleIcon />,
        path: "/admin/team",
      });
    }

    if (checkPermission(role, PERMISSIONS.SETTINGS)) {
      adminMenuItems.push({
        text: "Settings",
        icon: <SettingsIcon />,
        path: "/admin/settings",
      });
    }

    return adminMenuItems;
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
        {(getUserRole() === "admin" || getUserRole() === "admissionAdmin") && (
          <Typography
            variant="caption"
            color="primary.contrastText"
            align="center"
            display="block"
          >
            IUEA
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
