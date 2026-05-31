import { z } from "zod";

export const authenticatedUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "APROVADOR", "SOLICITANTE"]),
  approvalLevel: z
    .enum(["LEVEL_0", "LEVEL_1", "LEVEL_2", "LEVEL_3"])
    .nullable(),
});

export const authSessionSchema = z.object({
  user: authenticatedUserSchema,
});

export type AuthSessionInput = z.infer<typeof authSessionSchema>;
