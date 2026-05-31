"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
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
  isLoggingOut: boolean;
  onLogout: () => void;
  title: string;
  subtitle: string;
  user: AuthenticatedUser;
};

export function AppShell({
  children,
  isLoggingOut,
  onLogout,
  subtitle,
  title,
  user,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

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
                    Solicitações de Compra
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.name}
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <List disablePadding sx={{ display: "grid", gap: 1 }}>
                {appNavigationItems.map((item) => {
                  const isSelected = pathname === item.href;
                  const isDisabled =
                    item.href === "/aprovacoes" || item.href === "/configuracoes";

                  return (
                    <ListItemButton
                      key={item.label}
                      component={isDisabled ? "button" : Link}
                      href={isDisabled ? undefined : item.href}
                      disabled={isDisabled}
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
                onClick={() => {
                  onLogout();
                  router.replace("/login");
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
    </Box>
  );
}
