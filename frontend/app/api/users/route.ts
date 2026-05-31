import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import type { UsersListResponse } from "@/features/users/types/user.types";
import { backendRequest } from "@/lib/backend-api";
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

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  try {
    const response = await backendRequest<UsersListResponse>("/users", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response);
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
      { message: "Não foi possível carregar os usuários." },
      { status: 500 },
    );
  }
}
