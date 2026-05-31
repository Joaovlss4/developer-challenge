import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@/features/users/schemas/user.schema";
import type { UserResponse } from "@/features/users/types/user.types";
import { backendRequest } from "@/lib/backend-api";
import { ensureTrustedOrigin } from "@/lib/csrf";
import { ApiError } from "@/lib/api";

async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_KEY)?.value;
}

function createUnauthorizedResponse() {
  const response = NextResponse.json(
    {
      message: "Sua sessão expirou. Faça login novamente.",
    },
    { status: 401 },
  );
  clearSessionCookies(response.cookies);

  return response;
}

export async function POST(request: Request) {
  const csrfErrorResponse = ensureTrustedOrigin(request);

  if (csrfErrorResponse) {
    return csrfErrorResponse;
  }

  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  let payload: CreateUserFormValues;

  try {
    payload = createUserSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "O corpo da requisição é inválido." },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Verifique os dados informados e tente novamente." },
        { status: 400 },
      );
    }

    throw error;
  }

  try {
    const response = await backendRequest<UserResponse>("/auth/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const response = NextResponse.json(
        { message: error.message },
        { status: error.status },
      );

      if (error.status === 401) {
        clearSessionCookies(response.cookies);
      }

      return response;
    }

    return NextResponse.json(
      { message: "Não foi possível criar o usuário." },
      { status: 500 },
    );
  }
}
