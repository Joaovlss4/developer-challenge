"use client";

import { useEffect } from "react";
import { Alert, Box, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import type { AuthSession } from "@/features/auth/types/auth.types";
import type { DashboardKpi } from "@/features/requests/types/request.types";

export function DashboardPageClient({
  initialSession,
}: {
  initialSession?: AuthSession | null;
}) {
  const {
    clearSession,
    dismissLogoutError,
    error: sessionError,
    isAuthenticated,
    isPending,
    retrySession,
    logoutError,
    session,
    status,
  } = useAuthenticatedSession(initialSession);
  const { error, errorStatus, isLoading, kpis } = useDashboardSummary(
    status === "authenticated" && isAuthenticated && session
      ? String(session.user.id)
      : null,
  );

  useEffect(() => {
    if (status === "authenticated" && errorStatus === 401) {
      clearSession();
    }
  }, [clearSession, errorStatus, status]);

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando dashboard..." />;
  }

  return (
    <AppShell
      isLoggingOut={isPending}
      logoutError={logoutError}
      onDismissLogoutError={dismissLogoutError}
      onLogout={clearSession}
      subtitle="Resumo inicial das solicitações por status para acompanhar o fluxo de compras."
      title="Dashboard"
      user={session.user}
    >
      {error && errorStatus !== 401 ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  borderRadius: 1,
                  p: 3,
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                  boxShadow: "none",
                }}
              >
                <Stack spacing={1.25}>
                  <Skeleton variant="text" width="45%" />
                  <Skeleton variant="text" width="30%" height={56} />
                </Stack>
              </Paper>
            ))
          : kpis.map((kpi) => (
              <Paper
                key={kpi.status}
                elevation={0}
                sx={{
                  borderRadius: 1,
                  p: 3,
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                  boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
                  background: "background.paper",
                }}
              >
                <Stack spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontWeight: 700 }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{ color: "primary.main", lineHeight: 1 }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status {formatStatusLabel(kpi.status)}
                  </Typography>
                </Stack>
              </Paper>
            ))}
      </Box>
    </AppShell>
  );
}

function formatStatusLabel(status: DashboardKpi["status"]) {
  switch (status) {
    case "PENDING":
      return "pendente";
    case "APPROVED":
      return "aprovada";
    case "REJECTED":
      return "rejeitada";
    case "CANCELLED":
      return "cancelada";
    default:
      return status;
  }
}
