"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { appTheme } from "@/lib/theme";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
