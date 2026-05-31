import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import type { PurchaseRequestPageResponse } from "@/features/requests/types/request.types";
import { backendRequest } from "@/lib/backend-api";
import { ApiError } from "@/lib/api";

export async function GET(request: Request) {
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
    const { search } = new URL(request.url);
    const response = await backendRequest<PurchaseRequestPageResponse>(
      `/requests${search}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      const response = NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );

      if (error.status === 401) {
        clearSessionCookies(response.cookies);
      }

      return response;
    }

    return NextResponse.json(
      {
        message: "Não foi possível carregar as solicitações.",
      },
      { status: 500 },
    );
  }
}
