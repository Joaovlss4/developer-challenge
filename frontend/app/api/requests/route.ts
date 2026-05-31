import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { createRequestSchema } from "@/features/requests/schemas/createRequest.schema";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import type {
  CreatePurchaseRequestPayload,
  PurchaseRequestPageResponse,
  PurchaseRequestResponse,
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

export async function GET(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
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

export async function POST(request: Request) {
  const untrustedOriginResponse = ensureTrustedOrigin(request);

  if (untrustedOriginResponse) {
    return untrustedOriginResponse;
  }

  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  let payload: CreatePurchaseRequestPayload;

  try {
    payload = createRequestSchema.parse(await request.json());
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
          message: error.issues[0]?.message ?? "Verifique os dados informados e tente novamente.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Não foi possível validar os dados da solicitação.",
      },
      { status: 400 },
    );
  }

  try {
    const response = await backendRequest<PurchaseRequestResponse>("/requests", {
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
        message: "Não foi possível criar a solicitação.",
      },
      { status: 500 },
    );
  }
}
