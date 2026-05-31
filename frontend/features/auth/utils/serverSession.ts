import { authenticatedUserSchema } from "@/features/auth/schemas/session.schema";
import type {
  ApiSuccessResponse,
  AuthSession,
  AuthenticatedUser,
} from "@/features/auth/types/auth.types";
import { backendRequest } from "@/lib/backend-api";

export function createAuthSession(user: AuthenticatedUser): AuthSession {
  return { user };
}

export async function fetchAuthenticatedUser(token: string) {
  const response = await backendRequest<ApiSuccessResponse<AuthenticatedUser>>(
    "/auth/me",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return authenticatedUserSchema.parse(response.data);
}
