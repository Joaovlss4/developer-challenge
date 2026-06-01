"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import {
  createRequestSchema,
  type CreateRequestFormInput,
  type CreateRequestFormValues,
} from "@/features/requests/schemas/createRequest.schema";
import { requestService } from "@/features/requests/services/requestService";
import { canCreatePurchaseRequest } from "@/features/requests/utils/requestPermissions";
import type { AuthSession } from "@/features/auth/types/auth.types";
import { ApiError } from "@/lib/api";

type ToastState = {
  message: string;
  severity: "success" | "error";
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrencyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return currencyFormatter.format(Number(digitsOnly) / 100);
}

export function CreateRequestPageClient({
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
    isLoggingOut,
    logoutError,
    logout,
    retrySession,
    session,
    status,
  } = useAuthenticatedSession(initialSession);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormInput, undefined, CreateRequestFormValues>({
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      category: "",
    },
    resolver: zodResolver(createRequestSchema),
  });

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

  const canCreate = canCreatePurchaseRequest(session.user);

  async function onSubmit(values: CreateRequestFormValues) {
    setIsSubmittingRequest(true);

    try {
      await requestService.createRequest(values);
      setToast({
        message: "Solicitação criada com sucesso.",
        severity: "success",
      });
      router.replace("/solicitacoes?created=1");
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
            : "Não foi possível criar a solicitação. Tente novamente.",
        severity: "error",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  return (
    <AppShell
      isLoggingOut={isLoggingOut}
      logoutError={logoutError}
      onDismissLogoutError={dismissLogoutError}
      onLogout={logout}
      subtitle="Preencha os dados da compra para registrar uma nova solicitação no fluxo de aprovação."
      title="Nova solicitação"
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
        {canCreate ? (
          <Stack
            component="form"
            spacing={3}
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <Stack spacing={2}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Título"
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição"
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                    fullWidth
                    multiline
                    minRows={5}
                  />
                )}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={(event) =>
                        field.onChange(formatCurrencyInput(event.target.value))
                      }
                      label="Valor"
                      placeholder="0,00"
                      error={Boolean(errors.amount)}
                      helperText={errors.amount?.message}
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        },
                        htmlInput: {
                          inputMode: "numeric",
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Categoria"
                      error={Boolean(errors.category)}
                      helperText={errors.category?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={1.5}
              sx={{ justifyContent: "space-between" }}
            >
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => router.push("/solicitacoes")}
                disabled={isSubmitting}
                sx={{ borderRadius: 1 }}
              >
                Voltar para solicitações
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <SaveRoundedIcon />
                  )
                }
                disabled={isSubmitting}
                sx={{ borderRadius: 1, minWidth: 220 }}
              >
                {isSubmitting ? "Criando solicitação..." : "Confirmar criação"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="warning">
              Seu perfil não pode criar solicitações de compra por esta interface.
            </Alert>
            <Typography color="text.secondary">
              A criação está disponível apenas para usuários com nível de
              aprovação LEVEL_0 ou LEVEL_3.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => router.push("/solicitacoes")}
              sx={{ alignSelf: "flex-start", borderRadius: 1 }}
            >
              Voltar para solicitações
            </Button>
          </Stack>
        )}
      </Paper>

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
        open={isSubmittingRequest}
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
          Criando solicitação...
        </Typography>
      </Backdrop>
    </AppShell>
  );
}
