import { createTheme } from "@mui/material/styles";

export const createAppTheme = (colors = {}) =>
  createTheme({
    palette: {
      primary: {
        main: colors.primary || "#7a0000",
        light: colors.primary ? `${colors.primary}99` : "#a33333",
        dark: colors.primary ? `${colors.primary}cc` : "#4d0000",
        contrastText: "#ffffff",
      },
      secondary: {
        main: colors.secondary || "#000000",
        light: colors.secondary ? `${colors.secondary}99` : "#2c2c2c",
        dark: colors.secondary ? `${colors.secondary}cc` : "#000000",
        contrastText: "#ffffff",
      },
      background: {
        default: "#f5f5f5",
        paper: "#ffffff",
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.primary || "#7a0000",
            color: "#ffffff",
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: "#ffffff",
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: "#ffffff",
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            width: "100%",
            overflowX: "auto",
          },
        },
      },
    },
  });

export const theme = createAppTheme();
