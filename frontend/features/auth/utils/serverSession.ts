import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authSessionSchema, authenticatedUserSchema } from "@/features/auth/schemas/session.schema";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import type {
  ApiSuccessResponse,
  AuthSession,
  AuthenticatedUser,
  UserRole,
} from "@/features/auth/types/auth.types";
import { backendRequest } from "@/lib/backend-api";
import { ApiError } from "@/lib/api";

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

export async function resolveServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_KEY)?.value;

  if (!token) {
    return null;
  }

  const user = await fetchAuthenticatedUser(token);
  return authSessionSchema.parse(createAuthSession(user));
}

export async function requireServerSession() {
  try {
    const session = await resolveServerSession();

    if (!session) {
      redirect("/login");
    }

    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }

    throw error;
  }
}

export async function requireServerSessionForRoles(roles: UserRole[]) {
  const session = await requireServerSession();

  if (!roles.includes(session.user.role)) {
    redirect("/");
  }

  return session;
}
