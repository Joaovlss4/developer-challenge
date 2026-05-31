import { z } from "zod";

const roleSchema = z.enum(["ADMIN", "APROVADOR", "SOLICITANTE"]);
const approvalLevelSchema = z.enum(["LEVEL_0", "LEVEL_1", "LEVEL_2", "LEVEL_3"]);

function validateRoleApprovalLevel(
  role: "ADMIN" | "APROVADOR" | "SOLICITANTE",
  approvalLevel: "LEVEL_0" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3",
) {
  if (role === "SOLICITANTE" && approvalLevel !== "LEVEL_0") {
    return false;
  }

  if (role === "APROVADOR" && approvalLevel !== "LEVEL_1" && approvalLevel !== "LEVEL_2") {
    return false;
  }

  if (role === "ADMIN" && approvalLevel !== "LEVEL_3") {
    return false;
  }

  return true;
}

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do usuário.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail do usuário.")
      .email("Informe um e-mail válido.")
      .max(160, "O e-mail deve ter no máximo 160 caracteres."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres."),
    role: roleSchema,
    approvalLevel: approvalLevelSchema,
  })
  .superRefine((values, context) => {
    if (!validateRoleApprovalLevel(values.role, values.approvalLevel)) {
      context.addIssue({
        code: "custom",
        message: "O nível de aprovação não é compatível com o perfil selecionado.",
        path: ["approvalLevel"],
      });
    }
  });

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do usuário.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail do usuário.")
      .email("Informe um e-mail válido.")
      .max(160, "O e-mail deve ter no máximo 160 caracteres."),
    password: z
      .string()
      .trim()
      .max(72, "A senha deve ter no máximo 72 caracteres.")
      .refine(
        (value) => value.length === 0 || value.length >= 8,
        "A senha deve ter pelo menos 8 caracteres.",
      ),
    role: roleSchema,
    approvalLevel: approvalLevelSchema,
  })
  .superRefine((values, context) => {
    if (!validateRoleApprovalLevel(values.role, values.approvalLevel)) {
      context.addIssue({
        code: "custom",
        message: "O nível de aprovação não é compatível com o perfil selecionado.",
        path: ["approvalLevel"],
      });
    }
  });

export const updateUserPayloadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do usuário.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail do usuário.")
      .email("Informe um e-mail válido.")
      .max(160, "O e-mail deve ter no máximo 160 caracteres."),
    password: z
      .string()
      .trim()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres.")
      .optional(),
    role: roleSchema,
    approvalLevel: approvalLevelSchema,
  })
  .superRefine((values, context) => {
    if (!validateRoleApprovalLevel(values.role, values.approvalLevel)) {
      context.addIssue({
        code: "custom",
        message: "O nível de aprovação não é compatível com o perfil selecionado.",
        path: ["approvalLevel"],
      });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
