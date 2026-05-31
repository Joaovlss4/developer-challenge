"use client";

import { useState } from "react";
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
import type { CreateUserFormValues } from "@/features/users/schemas/user.schema";
import { userService } from "@/features/users/services/userService";
import { canManageUsers } from "@/features/users/utils/userRules";
import { ApiError } from "@/lib/api";

type ToastState = {
  message: string;
  severity: "success" | "error";
};

export function CreateUserPageClient({
  initialSession,
}: {
  initialSession?: AuthSession | null;
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
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando formulário..." />;
  }

  if (!canManageUsers(session.user.role)) {
    return (
      <FullPageError
        message="Você não tem permissão para criar usuários."
        onRetry={() => router.replace("/")}
      />
    );
  }

  async function handleSubmit(values: CreateUserFormValues) {
    setIsCreatingUser(true);

    try {
      await userService.createUser(values);
      setToast({
        message: "Usuário criado com sucesso.",
        severity: "success",
      });
      router.replace("/usuarios?created=1");
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
            : "Não foi possível criar o usuário. Tente novamente.",
        severity: "error",
      });
    } finally {
      setIsCreatingUser(false);
    }
  }

  return (
    <>
      <AppShell
        isLoggingOut={isPending}
        logoutError={logoutError}
        onDismissLogoutError={dismissLogoutError}
        onLogout={clearSession}
        subtitle="Preencha os dados do novo usuário respeitando as regras de perfil e nível de aprovação."
        title="Novo usuário"
        user={session.user}
      >
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
                name: "",
                email: "",
                password: "",
                role: "SOLICITANTE",
                approvalLevel: "LEVEL_0",
              }}
              mode="create"
              onSubmit={handleSubmit}
              submitLabel="Criar usuário"
            />
          </Stack>
        </Paper>
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
        open={isCreatingUser}
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
          Criando usuário...
        </Typography>
      </Backdrop>
    </>
  );
}
