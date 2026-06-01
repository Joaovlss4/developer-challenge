"use client";

import { useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { appNavigationItems } from "@/features/app-shell/constants/navigation";
import type { AuthenticatedUser } from "@/features/auth/types/auth.types";

type AppShellProps = {
  children: ReactNode;
  logoutError?: string | null;
  onDismissLogoutError?: () => void;
  isLoggingOut: boolean;
  onLogout: () => Promise<boolean> | boolean;
  title: string;
  subtitle: string;
  user: AuthenticatedUser;
};

export function AppShell({
  children,
  isLoggingOut,
  logoutError,
  onDismissLogoutError,
  onLogout,
  subtitle,
  title,
  user,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        background: "#faf7ff",
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0, 1fr)" },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              position: { lg: "sticky" },
              top: { lg: 24 },
              borderRadius: 1,
              p: 2.5,
              border: "1px solid rgba(122, 92, 255, 0.16)",
              boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
            }}
          >
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.light",
                    color: "primary.dark",
                    fontWeight: 800,
                  }}
                >
                  {user.name.charAt(0)}
                </Avatar>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontWeight: 800 }}>
                    {user.name}
                  </Typography> 
                </Stack>
              </Stack>

              <Divider />

              <List disablePadding sx={{ display: "grid", gap: 1 }}>
                {appNavigationItems
                  .filter((item) => item.roles.includes(user.role))
                  .map((item) => {
                  const isSelected =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <ListItemButton
                      key={item.label}
                      component={Link}
                      href={item.href}
                      onClick={() => {
                        if (!isSelected) {
                          setIsNavigating(true);
                        }
                      }}
                      selected={isSelected}
                      sx={{
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: isSelected
                          ? "primary.main"
                          : "rgba(122, 92, 255, 0.12)",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        color: isSelected ? "common.white" : "text.primary",
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "common.white",
                        },
                        "&.Mui-selected:hover": {
                          bgcolor: "primary.dark",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 34,
                          color: isSelected ? "common.white" : "inherit",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 700 }}>
                            {item.label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>

              <Divider />

              <Button
                variant="outlined"
                startIcon={<LogoutRoundedIcon />}
                onClick={async () => {
                  const shouldRedirect = await onLogout();

                  if (shouldRedirect === false) {
                    return;
                  }

                  router.replace("/login");
                  router.refresh();
                }}
                disabled={isLoggingOut}
                sx={{ borderRadius: 1 }}
              >
                Encerrar sessão
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 1,
                p: { xs: 3, md: 4 },
                border: "1px solid rgba(122, 92, 255, 0.16)",
                boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h3">{title}</Typography>
                <Typography color="text.secondary">{subtitle}</Typography>
              </Stack>
            </Paper>

            {children}
          </Stack>
        </Box>
      </Container>

      <Backdrop
        open={isNavigating}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 2,
          bgcolor: "rgba(29, 23, 62, 0.48)",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ color: "common.white", fontWeight: 700 }}>
          Abrindo página...
        </Typography>
      </Backdrop>

      <Snackbar
        open={Boolean(logoutError)}
        autoHideDuration={5000}
        onClose={onDismissLogoutError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onDismissLogoutError}
          severity="warning"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {logoutError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
