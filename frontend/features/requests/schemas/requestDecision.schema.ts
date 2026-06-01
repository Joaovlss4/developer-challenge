import { z } from "zod";

export const requestDecisionSchema = z.object({
  comment: z
    .string()
    .trim()
    .max(2000, "O comentário deve ter no máximo 2000 caracteres.")
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      return value;
    }),
});

export type RequestDecisionPayloadInput = z.input<typeof requestDecisionSchema>;
export type RequestDecisionPayloadValues = z.infer<typeof requestDecisionSchema>;
