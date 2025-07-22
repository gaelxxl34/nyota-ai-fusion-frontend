import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const result = await authService.forgotPassword(email);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err.message || "An error occurred while processing your request"
      );
      setSubmitted(false);
    } finally {
      setLoading(false);
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
          <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: "center" }}>
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
              Reset Password
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!submitted ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your email address and we'll send you instructions to
                reset your password.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                error={!!error}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={24}
                      sx={{ mr: 1 }}
                      color="inherit"
                    />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Check your email for password reset instructions.
              </Alert>
            </Box>
          )}

          <Box sx={{ textAlign: "center" }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/login")}
              sx={{ mt: 2 }}
            >
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
