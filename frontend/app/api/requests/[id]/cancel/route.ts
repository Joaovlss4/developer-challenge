import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import type { PurchaseRequestResponse } from "@/features/requests/types/request.types";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const untrustedOriginResponse = ensureTrustedOrigin(request);

  if (untrustedOriginResponse) {
    return untrustedOriginResponse;
  }

  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    const response = await backendRequest<PurchaseRequestResponse>(
      `/requests/${id}/cancel`,
      {
        method: "PATCH",
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
        message: "Não foi possível cancelar a solicitação.",
      },
      { status: 500 },
    );
  }
}
