import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { authSessionSchema } from "@/features/auth/schemas/session.schema";
import type { ApiSuccessResponse, AuthSession } from "@/features/auth/types/auth.types";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import { createAuthSession, fetchAuthenticatedUser } from "@/features/auth/utils/serverSession";
import { ApiError } from "@/lib/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_KEY)?.value;

  if (!token) {
    const response = NextResponse.json(
      {
        message: "Sua sessão expirou. Faça login novamente.",
      },
      { status: 401 },
    );
    clearSessionCookies(response.cookies);

    return response;
  }

  try {
    const user = await fetchAuthenticatedUser(token);
    const session: AuthSession = authSessionSchema.parse(createAuthSession(user));

    return NextResponse.json<ApiSuccessResponse<AuthSession>>({
      data: session,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const response = NextResponse.json(
        {
          message: "Sua sessão expirou. Faça login novamente.",
        },
        { status: 401 },
      );
      clearSessionCookies(response.cookies);

      return response;
    }

    const response = NextResponse.json(
      {
        message: "Não foi possível validar a sessão atual. Tente novamente.",
      },
      { status: 503 },
    );

    return response;
  }
}
