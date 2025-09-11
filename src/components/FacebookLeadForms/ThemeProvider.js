import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

// Create a custom theme with explicit colors to override any inherited theme
const customTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#dc004e",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
    divider: "#e0e0e0",
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { color: "#333333" },
    h2: { color: "#333333" },
    h3: { color: "#333333" },
    h4: { color: "#333333" },
    h5: { color: "#333333" },
    h6: { color: "#333333" },
    body1: { color: "#333333" },
    body2: { color: "#333333" },
    caption: { color: "#666666" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#ffffff",
          color: "#333333",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#ffffff !important",
          color: "#333333 !important",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff !important",
          color: "#333333 !important",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff !important",
          color: "#333333 !important",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: "#ffffff !important",
          color: "#333333 !important",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#333333 !important",
        },
        h1: { color: "#333333 !important" },
        h2: { color: "#333333 !important" },
        h3: { color: "#333333 !important" },
        h4: { color: "#333333 !important" },
        h5: { color: "#333333 !important" },
        h6: { color: "#333333 !important" },
        body1: { color: "#333333 !important" },
        body2: { color: "#333333 !important" },
        caption: { color: "#666666 !important" },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#333333 !important",
        },
        secondary: {
          color: "#666666 !important",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "#333333 !important",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: "#333333 !important",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: "#1976d2 !important",
        },
      },
    },
  },
});

const FacebookLeadFormsThemeProvider = ({ children }) => {
  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#333333",
          minHeight: "100vh",
          padding: 0,
          margin: 0,
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  );
};

export default FacebookLeadFormsThemeProvider;
