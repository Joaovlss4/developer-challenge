import { z } from "zod";

function parseAmount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return NaN;
  }

  return Number(digitsOnly) / 100;
}

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título da solicitação.")
    .max(160, "O título deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descrição da solicitação.")
    .max(5000, "A descrição deve ter no máximo 5000 caracteres."),
  amount: z.preprocess(
    parseAmount,
    z
      .number({ error: "Informe um valor válido." })
      .positive("O valor deve ser maior que zero.")
      .max(9999999999.99, "O valor informado é muito alto."),
  ),
  category: z
    .string()
    .trim()
    .min(1, "Informe a categoria da solicitação.")
    .max(80, "A categoria deve ter no máximo 80 caracteres."),
});

export type CreateRequestFormInput = z.input<typeof createRequestSchema>;
export type CreateRequestFormValues = z.infer<typeof createRequestSchema>;
