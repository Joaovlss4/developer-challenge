"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { authService } from "@/features/auth/services/authService";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import type { AuthSession } from "@/features/auth/types/auth.types";

type LoginFormProps = {
  onAuthenticated: (session: AuthSession) => void;
};

type ToastState = {
  message: string;
  severity: "success" | "error";
};

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const session = await authService.login(values);
      onAuthenticated(session);
      setIsRedirecting(true);
      setToast({
        message: "Login realizado com sucesso.",
        severity: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Nao foi possivel autenticar. Tente novamente.";

      setToast({
        message,
        severity: "error",
      });
    }
  }

  return (
    <>
      <Stack
        component="form"
        spacing={3}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stack spacing={1}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: "common.white",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              lineHeight: 0.95,
            }}
          >
            Solicitações de Compra
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="E-mail"
                type="email"
                autoComplete="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                variant="filled"
                placeholder="hello@empresa.com"
                sx={fieldStyles}
                slotProps={{ inputLabel: inputLabelProps }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label="Senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                variant="filled"
                placeholder="Digite sua senha"
                sx={fieldStyles}
                slotProps={{
                  inputLabel: inputLabelProps,
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          aria-label={
                            showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                          edge="end"
                          onClick={() => setShowPassword((current) => !current)}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon />
                          ) : (
                            <VisibilityRoundedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          endIcon={<EastRoundedIcon />}
          sx={{
            alignSelf: "center",
            minWidth: 188,
            px: 4.5,
            borderRadius: 999,
            bgcolor: "common.white",
            color: "#43308f",
            "&:hover": {
              bgcolor: "#f4f1ff",
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.35)",
              color: "rgba(67,48,143,0.6)",
            },
          }}
        >
          {isSubmitting ? "Autenticando..." : "Acessar painel"}
        </Button>
      </Stack>

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
        open={isSubmitting || isRedirecting}
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
          Entrando no dashboard...
        </Typography>
      </Backdrop>
    </>
  );
}

const inputLabelProps = {
  sx: {
    color: "rgba(226, 221, 255, 0.76)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
};

const fieldStyles = {
  "& .MuiFilledInput-root": {
    borderRadius: "18px",
    bgcolor: "#575471",
    color: "#ffffff",
    border: "1px solid transparent",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
    "&:before, &:after": {
      display: "none",
    },
    "&:hover": {
      bgcolor: "#615e7b",
    },
    "&.Mui-focused": {
      bgcolor: "#615e7b",
      borderColor: "rgba(255,255,255,0.3)",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.62)",
    opacity: 1,
  },
  "& .MuiFormHelperText-root": {
    color: "#ffd7ea",
    ml: 0.5,
  },
};
