import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError, loading, user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (token && savedUser) {
      console.log("User already logged in, redirecting to dashboard");

      // Determine redirect path based on role
      let redirectPath = "/login";
      if (savedUser.role === "systemAdmin") redirectPath = "/admin/dashboard";
      else if (savedUser.role === "organizationAdmin")
        redirectPath = "/organization/dashboard";
      else if (savedUser.jobRole === "leadManager")
        redirectPath = "/organization/leads";
      else if (savedUser.jobRole === "customerSupport")
        redirectPath = "/organization/chat-config";

      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  // Redirect after successful login
  useEffect(() => {
    if (user) {
      console.log("Login successful, redirecting to dashboard");

      // Determine redirect path based on role
      let redirectPath = "/login";
      if (user.role === "systemAdmin") redirectPath = "/admin/dashboard";
      else if (user.role === "organizationAdmin")
        redirectPath = "/organization/dashboard";
      else if (user.jobRole === "leadManager")
        redirectPath = "/organization/leads";
      else if (user.jobRole === "customerSupport")
        redirectPath = "/organization/chat-config";

      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setLocalError(result.error || "Login failed");
      }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "background.default",
        p: 0,
        m: 0,
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Container
        maxWidth="xs"
        sx={{
          p: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            height: { xs: "100vh", sm: "auto" },
            borderRadius: { xs: 0, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            m: { xs: 0, sm: 2 },
          }}
        >
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              component="h1"
              variant="h5"
              align="center"
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 500,
                mb: 1,
              }}
            >
              Login to Nyota AI Fusion
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              mt: { xs: 0, sm: 1 },
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            {(authError || localError) && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {authError || localError}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
