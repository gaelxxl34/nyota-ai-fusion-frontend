import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { axiosInstance } from "../services/axiosConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing token and user
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");

        if (token) {
          // Set token for future requests
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;

          if (storedUser) {
            setUser(storedUser);
          } else {
            try {
              // Verify token with backend
              const response = await authService.verifyToken();
              if (response.isValid && response.user) {
                localStorage.setItem("user", JSON.stringify(response.user));
                setUser(response.user);
              } else {
                // Invalid token, clear storage
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
              }
            } catch (err) {
              console.error("Error verifying token:", err);
              // Clear invalid token and redirect to login
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
              if (
                window.location.pathname !== "/login" &&
                window.location.pathname !== "/"
              ) {
                navigate("/login", { replace: true });
              }
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  // Setup token refresh mechanism
  useEffect(() => {
    if (!user) return;

    const refreshTokenInterval = setInterval(async () => {
      try {
        const response = await authService.verifyToken();
        if (response.token) {
          localStorage.setItem("token", response.token);
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.token}`;
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        // If token refresh fails, logout the user
        logout();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(refreshTokenInterval);
  }, [user, logout]);

  const getUserRole = useCallback(() => {
    if (!user) return null;
    return user.role || user.jobRole || "user";
  }, [user]);

  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!user) return false;
      if (user.role === "superAdmin") return true;
      if (user.permissions?.includes(requiredPermission)) return true;
      return false;
    },
    [user]
  );

  const getDefaultRoute = useCallback((userRole, permissions = []) => {
    switch (userRole) {
      case "superAdmin":
        return "/super-admin/dashboard";
      case "admin":
        return "/admin/leads";
      case "admissionAdmin":
        return "/admission-admin/dashboard";
      case "marketingAgent":
        return "/admin/chat-config";
      case "admissionAgent":
        return "/admin/chat-config";
      default:
        return "/login";
    }
  }, []);

  const getRedirectPath = useCallback(() => {
    const role = getUserRole();
    switch (role) {
      case "superAdmin":
        return "/super-admin/dashboard";
      case "admin":
        return "/admin/leads";
      case "admissionAdmin":
        return "/admission-admin/dashboard";
      case "marketingAgent":
        return "/admin/chat-config";
      case "admissionAgent":
        return "/admin/chat-config";
      default:
        return "/login";
    }
  }, [getUserRole]);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password);

      if (response.success && response.token && response.user) {
        setUser(response.user);
        return { success: true };
      }
      throw new Error(response.message || "Invalid response from server");
    } catch (err) {
      setError(err.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      isSuperAdmin: () => getUserRole() === "superAdmin",
      isAdmin: () =>
        getUserRole() === "admin" || getUserRole() === "admissionAdmin",
      hasPermission,
      getUserRole,
      getRedirectPath,
      getDefaultRoute,
    }),
    [
      user,
      loading,
      error,
      login,
      logout,
      getUserRole,
      hasPermission,
      getRedirectPath,
      getDefaultRoute,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
