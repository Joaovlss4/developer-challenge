import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import { updateUserPayloadSchema } from "@/features/users/schemas/user.schema";
import type {
  UpdateUserPayload,
  UserResponse,
  UsersListResponse,
} from "@/features/users/types/user.types";
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

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    const response = await backendRequest<UsersListResponse>("/users", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const user = response.data.find((entry) => entry.id === Number(id));

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: user });
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
      { message: "Não foi possível carregar o usuário." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrfErrorResponse = ensureTrustedOrigin(request);

  if (csrfErrorResponse) {
    return csrfErrorResponse;
  }

  const token = await getSessionToken();

  if (!token) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  let payload: UpdateUserPayload;

  try {
    payload = updateUserPayloadSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "O corpo da requisição é inválido." },
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
      { message: "Não foi possível validar os dados do usuário." },
      { status: 400 },
    );
  }

  try {
    const response = await backendRequest<UserResponse>(`/users/${id}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
      { message: "Não foi possível atualizar o usuário." },
      { status: 500 },
    );
  }
}
