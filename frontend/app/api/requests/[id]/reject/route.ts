import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { requestDecisionSchema } from "@/features/requests/schemas/requestDecision.schema";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import type {
  PurchaseRequestResponse,
  RequestDecisionPayload,
} from "@/features/requests/types/request.types";
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
  let payload: RequestDecisionPayload | undefined;

  try {
    const rawPayload = await request.json();
    payload = requestDecisionSchema.parse(rawPayload);
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
          message:
            error.issues[0]?.message ??
            "Verifique os dados informados e tente novamente.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const response = await backendRequest<PurchaseRequestResponse>(
      `/requests/${id}/reject`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload ?? {}),
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
        message: "Não foi possível rejeitar a solicitação.",
      },
      { status: 500 },
    );
  }
}
