"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
} from "@/features/users/schemas/user.schema";
import {
  createUserSchema,
  updateUserSchema,
} from "@/features/users/schemas/user.schema";
import {
  getAllowedApprovalLevels,
  getDefaultApprovalLevel,
  normalizeApprovalLevelForRole,
  USER_ROLE_OPTIONS,
} from "@/features/users/utils/userRules";

type UserFormValues = CreateUserFormValues | UpdateUserFormValues;

type UserFormProps = {
  defaultValues: UserFormValues;
  mode: "create" | "edit";
  onSubmit: (values: UserFormValues) => void | Promise<void>;
  submitLabel: string;
};

export function UserForm({
  defaultValues,
  mode,
  onSubmit,
  submitLabel,
}: UserFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<UserFormValues>({
    defaultValues,
    resolver: zodResolver(mode === "create" ? createUserSchema : updateUserSchema),
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  const selectedApprovalLevel = useWatch({
    control,
    name: "approvalLevel",
  });

  const approvalLevelOptions = useMemo(
    () => getAllowedApprovalLevels(selectedRole),
    [selectedRole],
  );

  useEffect(() => {
    const normalizedApprovalLevel = normalizeApprovalLevelForRole(
      selectedRole,
      selectedApprovalLevel,
    );

    if (normalizedApprovalLevel !== selectedApprovalLevel) {
      setValue("approvalLevel", normalizedApprovalLevel, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selectedApprovalLevel, selectedRole, setValue]);

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nome"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="E-mail"
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={mode === "create" ? "Senha" : "Nova senha"}
              type="password"
              error={Boolean(errors.password)}
              helperText={
                errors.password?.message ??
                (mode === "edit"
                  ? "Deixe em branco para manter a senha atual."
                  : undefined)
              }
              fullWidth
            />
          )}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.role)}>
                <InputLabel id="user-role-label">Perfil</InputLabel>
                <Select
                  {...field}
                  labelId="user-role-label"
                  label="Perfil"
                  onChange={(event) => {
                    const nextRole = event.target.value as typeof selectedRole;
                    field.onChange(nextRole);
                    setValue("approvalLevel", getDefaultApprovalLevel(nextRole), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  {USER_ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="approvalLevel"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.approvalLevel)}>
                <InputLabel id="user-approval-level-label">
                  Nível de aprovação
                </InputLabel>
                <Select
                  {...field}
                  labelId="user-approval-level-label"
                  label="Nível de aprovação"
                  disabled={approvalLevelOptions.length <= 1}
                >
                  {approvalLevelOptions.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.replace("LEVEL_", "Nível ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Stack>
      </Stack>

      <Button
        type="submit"
        variant="contained"
        startIcon={
          isSubmitting ? <CircularProgress color="inherit" size={18} /> : <SaveRoundedIcon />
        }
        disabled={isSubmitting}
        sx={{ alignSelf: "flex-end", borderRadius: 1, minWidth: 220 }}
      >
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </Stack>
  );
}
