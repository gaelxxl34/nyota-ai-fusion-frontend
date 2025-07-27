import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout/Layout";
// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import ChatManagement from "./pages/super-admin/ChatManagement";
import Settings from "./pages/super-admin/Settings";
import Organizations from "./pages/super-admin/Organizations";
import UserManagement from "./pages/super-admin/UserManagement";
import SuperAdminSettings from "./pages/super-admin/AdminSettings";
// Admin Pages (formerly organization)
import TeamManagement from "./pages/admin/TeamManagement";
import LeadsOverview from "./pages/admin/LeadsOverview";
import ChatConfig from "./pages/admin/ChatConfig";
import Analytics from "./pages/admin/Analytics";
import DataCenter from "./pages/admin/DataCenter";
// Auth Pages
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
// Public Pages
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme/theme";
import { Box, CircularProgress } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";

const ProtectedRoute = ({
  allowedRoles = [],
  requiredPermission = null,
  children,
}) => {
  const { user, loading, hasPermission } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.log("No user found, redirecting to login");
    }
    return <Navigate to="/login" replace />;
  }

  // Get user role
  const userRole = user.role || user.jobRole || null;

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`Access denied: ${userRole} not in ${allowedRoles.join(", ")}`);

    // Redirect to appropriate dashboard based on role
    let redirectPath = "/login";
    if (userRole === "superAdmin") redirectPath = "/super-admin/dashboard";
    else if (userRole === "admin") redirectPath = "/admin/leads";
    else if (userRole === "marketingManager")
      redirectPath = "/admin/chat-config";
    else if (userRole === "admissionsOfficer")
      redirectPath = "/admin/chat-config";
    else if (userRole === "teamMember") redirectPath = "/admin/leads";

    return <Navigate to={redirectPath} replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(`Permission denied: ${requiredPermission}`);
    return <Navigate to={user.defaultRoute || "/login"} replace />;
  }

  return children;
};

function App() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedColors = localStorage.getItem("themeColors");
    return createAppTheme(savedColors ? JSON.parse(savedColors) : {});
  });

  const handleThemeChange = (colors) => {
    const newTheme = createAppTheme(colors);
    setCurrentTheme(newTheme);
  };

  return (
    <HelmetProvider>
      <ThemeProvider theme={currentTheme}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Super Admin Routes */}
              <Route
                path="/super-admin/*"
                element={
                  <ProtectedRoute allowedRoles={["superAdmin"]}>
                    <Layout>
                      <Routes>
                        <Route
                          path="dashboard"
                          element={<SuperAdminDashboard />}
                        />
                        <Route
                          path="organizations"
                          element={<Organizations />}
                        />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="chat" element={<ChatManagement />} />
                        <Route
                          path="settings"
                          element={
                            <Settings onThemeChange={handleThemeChange} />
                          }
                        />
                        <Route
                          path="admin-settings"
                          element={<SuperAdminSettings />}
                        />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes (IUEA Admins) */}
              <Route
                path="/admin/*"
                element={
                  <Routes>
                    <Route
                      path="leads"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                            "teamMember",
                          ]}
                        >
                          <Layout>
                            <LeadsOverview />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Ensure root admin path redirects appropriately */}
                    <Route
                      path=""
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                            "teamMember",
                          ]}
                        >
                          <Navigate to="leads" replace />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="team"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Layout>
                            <TeamManagement />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="chat-config"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                          ]}
                        >
                          <Layout>
                            <ChatConfig />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="analytics"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                          ]}
                        >
                          <Layout>
                            <Analytics />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="data-center"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                          ]}
                        >
                          <Layout>
                            <DataCenter />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "admin",
                            "marketingManager",
                            "admissionsOfficer",
                          ]}
                        >
                          <Layout>
                            <Settings onThemeChange={handleThemeChange} />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="leads" replace />} />
                  </Routes>
                }
              />

              {/* Redirect dashboard to appropriate role-based dashboard */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
