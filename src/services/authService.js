import { axiosInstance } from "./axiosConfig";

class AuthService {
  async checkEmailExists(email) {
    try {
      const response = await axiosInstance.post(
        process.env.REACT_APP_CHECK_EMAIL_ENDPOINT || "/api/auth/check-email",
        { email }
      );
      return response.data;
    } catch (error) {
      console.error("Check email error:", error);
      throw new Error(
        error.response?.data?.error || error.message || "Failed to check email"
      );
    }
  }

  async login(email, password) {
    try {
      console.log("Attempting login with email:", email);

      // Step 1: Verify email exists before attempting login
      const emailCheck = await this.checkEmailExists(email);
      if (!emailCheck.exists) {
        throw new Error("Invalid email or password");
      }

      // Step 2: Authenticate through backend
      const response = await axiosInstance.post(
        process.env.REACT_APP_LOGIN_ENDPOINT || "/api/auth/login",
        { email, password }
      );

      if (response.data.success && response.data.token) {
        // Store the token and user data
        localStorage.setItem("token", response.data.token);

        // Get user's organization data if not included in response
        let userData = response.data.user;
        if (userData.organizationId && !userData.organization) {
          try {
            const orgResponse = await axiosInstance.get(
              `/organizations/${userData.organizationId}`
            );
            if (orgResponse.data) {
              userData = {
                ...userData,
                organization: orgResponse.data,
              };
            }
          } catch (err) {
            console.warn("Could not fetch organization data:", err);
          }
        }

        localStorage.setItem("user", JSON.stringify(userData));

        return {
          success: true,
          token: response.data.token,
          user: userData,
        };
      }

      throw new Error(response.data.error || "Authentication failed");
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(
        error.response?.data?.error || error.message || "Login failed"
      );
    }
  }

  async forgotPassword(email) {
    try {
      console.log("Requesting password reset for email:", email);

      const response = await axiosInstance.post(
        process.env.REACT_APP_FORGOT_PASSWORD_ENDPOINT ||
          "/api/auth/forgot-password",
        { email }
      );

      return {
        success: response.data.success,
        message:
          response.data.message ||
          "Password reset email sent. Check your inbox.",
      };
    } catch (error) {
      console.error("Forgot password error:", error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error(
          error.response.data.message ||
            "No account exists with this email address"
        );
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send reset email"
      );
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await axiosInstance.post(
        process.env.REACT_APP_RESET_PASSWORD_ENDPOINT ||
          "/api/auth/reset-password",
        { token, newPassword }
      );

      return {
        success: response.data.success,
        message: response.data.message || "Password reset successful",
      };
    } catch (error) {
      console.error("Reset password error:", error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          "Failed to reset password"
      );
    }
  }

  async verifyToken() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      // Set token in headers for the request
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const response = await axiosInstance.post(
        process.env.REACT_APP_VERIFY_TOKEN_ENDPOINT || "/api/auth/verify-token"
      );

      return response.data;
    } catch (error) {
      console.error("Token verification error:", error);
      throw error;
    }
  }

  verifyAuth() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { token, user };
  }

  getRole() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role || user?.jobRole || null;
  }

  getDefaultRoute() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return "/login";

    switch (user.role) {
      case "superAdmin":
        return "/super-admin/dashboard";
      case "admin":
        return "/admin/leads";
      case "marketingManager":
        return "/admin/chat-config";
      case "admissionsOfficer":
        return "/admin/chat-config";
      case "teamMember":
        return "/admin/leads";
      default:
        return "/login";
    }
  }

  async logout() {
    try {
      // Call the backend logout endpoint
      await axiosInstance
        .post("/api/auth/logout")
        .catch((err) => console.warn("Logout API call failed:", err));

      // Clear local storage regardless of API call success
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear axios default headers
      delete axiosInstance.defaults.headers.common["Authorization"];

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axiosInstance.defaults.headers.common["Authorization"];
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
