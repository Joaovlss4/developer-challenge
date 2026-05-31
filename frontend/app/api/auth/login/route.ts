import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  authSessionSchema,
  authenticatedUserSchema,
} from "@/features/auth/schemas/session.schema";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import type {
  ApiSuccessResponse,
  AuthResponse,
  AuthSession,
} from "@/features/auth/types/auth.types";
import {
  clearSessionCookies,
  getSessionCookieOptions,
} from "@/features/auth/utils/sessionCookies";
import { createAuthSession } from "@/features/auth/utils/serverSession";
import { backendRequest } from "@/lib/backend-api";
import { ApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const response = await backendRequest<ApiSuccessResponse<AuthResponse>>(
      "/auth/login",
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const user = authenticatedUserSchema.parse(response.data.user);
    const session: AuthSession = authSessionSchema.parse(createAuthSession(user));
    const cookieOptions = getSessionCookieOptions();
    const nextResponse = NextResponse.json<ApiSuccessResponse<AuthSession>>({
      data: session,
    });

    nextResponse.cookies.set(
      SESSION_COOKIE_KEY,
      response.data.token,
      cookieOptions,
    );

    return nextResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          message: "O corpo da requisição é inválido.",
        },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Verifique os dados informados e tente novamente.",
        },
        { status: 400 },
      );
    }

    if (error instanceof ApiError) {
      if (error.status === 401) {
        const nextResponse = NextResponse.json(
          {
            message: "E-mail ou senha inválidos.",
          },
          { status: 401 },
        );
        clearSessionCookies(nextResponse.cookies);

        return nextResponse;
      }

      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    const nextResponse = NextResponse.json(
      {
        message: "Não foi possível autenticar. Tente novamente.",
      },
      { status: 500 },
    );
    clearSessionCookies(nextResponse.cookies);

    return nextResponse;
  }
}
