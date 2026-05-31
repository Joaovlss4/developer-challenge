"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import type { AuthSession } from "@/features/auth/types/auth.types";
import { UserForm } from "@/features/users/components/UserForm";
import { useUserDetails } from "@/features/users/hooks/useUserDetails";
import type { UpdateUserFormValues } from "@/features/users/schemas/user.schema";
import { userService } from "@/features/users/services/userService";
import { canManageUsers } from "@/features/users/utils/userRules";
import { ApiError } from "@/lib/api";

type ToastState = {
  message: string;
  severity: "success" | "error";
};

export function EditUserPageClient({
  initialSession,
  userId,
}: {
  initialSession?: AuthSession | null;
  userId: number;
}) {
  const router = useRouter();
  const {
    clearSession,
    dismissLogoutError,
    error: sessionError,
    isAuthenticated,
    isPending,
    logoutError,
    retrySession,
    session,
    status,
  } = useAuthenticatedSession(initialSession);
  const {
    error,
    errorStatus,
    isLoading,
    user,
  } = useUserDetails(
    status === "authenticated" && isAuthenticated && !!session && canManageUsers(session.user.role),
    userId,
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && errorStatus === 401) {
      clearSession();
    }
  }, [clearSession, errorStatus, status]);

  if (!Number.isFinite(userId)) {
    return (
      <FullPageError
        message="Usuário inválido."
        onRetry={() => router.replace("/usuarios")}
      />
    );
  }

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando usuário..." />;
  }

  if (!canManageUsers(session.user.role)) {
    return (
      <FullPageError
        message="Você não tem permissão para editar usuários."
        onRetry={() => router.replace("/")}
      />
    );
  }

  async function handleSubmit(values: UpdateUserFormValues) {
    setIsUpdatingUser(true);

    try {
      await userService.updateUser(userId, {
        approvalLevel: values.approvalLevel,
        email: values.email,
        name: values.name,
        password: values.password.trim() ? values.password : undefined,
        role: values.role,
      });
      setToast({
        message: "Usuário atualizado com sucesso.",
        severity: "success",
      });
      router.replace("/usuarios?updated=1");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }

      setToast({
        message:
          error instanceof ApiError
            ? error.message
            : "Não foi possível atualizar o usuário. Tente novamente.",
        severity: "error",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  }

  return (
    <>
      <AppShell
        isLoggingOut={isPending}
        logoutError={logoutError}
        onDismissLogoutError={dismissLogoutError}
        onLogout={clearSession}
        subtitle="Atualize nome, e-mail, senha, perfil e nível de aprovação do usuário."
        title="Editar usuário"
        user={session.user}
      >
        {error && !user ? (
          <Alert severity={errorStatus === 404 ? "warning" : "error"}>{error}</Alert>
        ) : null}

        {isLoading ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              p: 4,
              border: "1px solid rgba(122, 92, 255, 0.16)",
            }}
          >
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <CircularProgress />
              <Typography color="text.secondary">Carregando usuário...</Typography>
            </Stack>
          </Paper>
        ) : user ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              p: { xs: 2, md: 3 },
              border: "1px solid rgba(122, 92, 255, 0.16)",
              boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
            }}
          >
            <Stack spacing={3}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => router.push("/usuarios")}
                sx={{ alignSelf: "flex-start", borderRadius: 1 }}
              >
                Voltar para usuários
              </Button>

              <UserForm
                defaultValues={{
                  approvalLevel: user.approvalLevel ?? "LEVEL_0",
                  email: user.email,
                  name: user.name,
                  password: "",
                  role: user.role,
                }}
                mode="edit"
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
              />
            </Stack>
          </Paper>
        ) : null}
      </AppShell>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>

      <Backdrop
        open={isUpdatingUser}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 2,
          bgcolor: "rgba(29, 23, 62, 0.72)",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ color: "common.white", fontWeight: 700 }}>
          Atualizando usuário...
        </Typography>
      </Backdrop>
    </>
  );
}
