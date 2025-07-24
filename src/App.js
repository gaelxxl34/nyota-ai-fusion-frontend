import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import ChatManagement from "./pages/ChatManagement";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Organizations from "./pages/Organizations";
import Users from "./pages/Users";
import AdminSettings from "./pages/AdminSettings";
import OrganizationDashboard from "./pages/organization/Dashboard";
import TeamManagement from "./pages/organization/TeamManagement";
import LeadsOverview from "./pages/organization/LeadsOverview";
import ChatConfig from "./pages/organization/ChatConfig";
import Analytics from "./pages/organization/Analytics";
import DataCenter from "./pages/organization/DataCenter";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme/theme";
import { Box, CircularProgress } from "@mui/material";

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
    if (userRole === "systemAdmin") redirectPath = "/admin/dashboard";
    else if (userRole === "organizationAdmin")
      redirectPath = "/organization/dashboard";
    else if (userRole === "leadManager") redirectPath = "/organization/leads";
    else if (userRole === "customerSupport")
      redirectPath = "/organization/chat-config";

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
    <ThemeProvider theme={currentTheme}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* System Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["systemAdmin"]}>
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="organizations" element={<Organizations />} />
                      <Route path="users" element={<Users />} />
                      <Route path="chat" element={<ChatManagement />} />
                      <Route
                        path="settings"
                        element={<Settings onThemeChange={handleThemeChange} />}
                      />
                      <Route
                        path="admin-settings"
                        element={<AdminSettings />}
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Organization Admin Routes */}
            <Route
              path="/organization/*"
              element={
                <Routes>
                  <Route
                    path="leads"
                    element={
                      <ProtectedRoute
                        allowedRoles={["organizationAdmin", "leadManager"]}
                      >
                        <Layout>
                          <LeadsOverview />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Ensure root organization path redirects to dashboard */}
                  <Route
                    path=""
                    element={<Navigate to="dashboard" replace />}
                  />

                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          "organizationAdmin",
                          "leadManager",
                          "customerSupport",
                          "salesManager",
                          "marketingManager",
                        ]}
                      >
                        <Layout>
                          <OrganizationDashboard />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="team"
                    element={
                      <ProtectedRoute allowedRoles={["organizationAdmin"]}>
                        <Layout>
                          <TeamManagement />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="chat-config"
                    element={
                      <ProtectedRoute allowedRoles={["organizationAdmin"]}>
                        <Layout>
                          <ChatConfig />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analytics"
                    element={
                      <ProtectedRoute allowedRoles={["organizationAdmin"]}>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="data-center"
                    element={
                      <ProtectedRoute allowedRoles={["organizationAdmin"]}>
                        <Layout>
                          <DataCenter />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={["organizationAdmin"]}>
                        <Layout>
                          <Settings onThemeChange={handleThemeChange} />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              }
            />

            {/* Regular User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
