import React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import { Lock, Email } from "@mui/icons-material";

function App() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        padding: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          {/* University Logo */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginBottom: { xs: 2, sm: 3 },
            }}
          >
            <img
              src="https://iuea.ac.ug/sitepad-data/uploads/2020/11/Website-Logo.png"
              alt="IUEA Logo"
              style={{
                maxWidth: "100%",
                width: "250px",
                height: "auto",
              }}
            />
          </Box>

          {/* Lock Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginBottom: { xs: 1.5, sm: 2 },
            }}
          >
            <Lock
              sx={{
                fontSize: { xs: 50, sm: 60 },
                color: "#667eea",
              }}
            />
          </Box>

          {/* Main Heading */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "#2c3e50",
              marginBottom: { xs: 1.5, sm: 2 },
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            System Under Review
          </Typography>

          {/* Access Restricted Message */}
          <Typography
            variant="h6"
            sx={{
              color: "#e74c3c",
              fontWeight: 600,
              marginBottom: { xs: 2, sm: 3 },
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            Access Restricted
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: "#555",
              marginBottom: { xs: 2, sm: 3 },
              lineHeight: 1.8,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              px: { xs: 0, sm: 2 },
            }}
          >
            This system is currently undergoing maintenance and review. Access
            has been temporarily restricted to ensure system integrity and
            security.
          </Typography>

          {/* Contact Information */}
          <Paper
            sx={{
              padding: { xs: 2, sm: 3 },
              backgroundColor: "#f8f9fa",
              borderRadius: 2,
              marginTop: { xs: 2, sm: 3 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Email
                sx={{
                  color: "#667eea",
                  marginRight: 1,
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#2c3e50",
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                }}
              >
                For More Information
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "#555",
                marginBottom: 1,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              Please contact the Head of ICT:
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#667eea",
                marginBottom: 0.5,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              Mohammed Yahya
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#777",
                fontStyle: "italic",
                marginBottom: 1,
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
              }}
            >
              Head of ICT Department
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#667eea",
                fontWeight: 500,
                marginTop: 1,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                wordBreak: "break-all",
              }}
            >
              mohammed.yahya@iuea.ac.ug
            </Typography>
          </Paper>

          {/* Footer Message */}
          <Typography
            variant="caption"
            sx={{
              display: "block",
              marginTop: { xs: 2, sm: 3 },
              color: "#999",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Thank you for your patience and understanding
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
