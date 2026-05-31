import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7a5cff",
      dark: "#4f37b3",
      light: "#ece6ff",
    },
    secondary: {
      main: "#b7a7ff",
    },
    background: {
      default: "#faf7ff",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f1a3d",
      secondary: "#5e5a7d",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'var(--font-sans), "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.05em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 48,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
  },
});
