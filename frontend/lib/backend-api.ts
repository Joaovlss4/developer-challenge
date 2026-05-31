import { ApiError } from "@/lib/api";

type ErrorPayload = {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

function getDefaultErrorMessage(status: number) {
  switch (status) {
    case 400:
      return "Verifique os dados informados e tente novamente.";
    case 401:
      return "Sua sessão expirou. Faça login novamente.";
    case 403:
      return "Você não tem permissão para executar esta ação.";
    case 404:
      return "Recurso não encontrado.";
    case 409:
      return "O recurso já existe ou entrou em conflito.";
    case 422:
      return "A ação solicitada não é permitida no estado atual.";
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
}

function normalizeErrorMessage(status: number, payload: ErrorPayload | null) {
  const validationMessage = payload?.errors?.find(Boolean)?.message;

  return (
    validationMessage ??
    payload?.message ??
    payload?.error ??
    getDefaultErrorMessage(status)
  );
}

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      normalizeErrorMessage(response.status, payload as ErrorPayload | null),
      response.status,
    );
  }

  return payload as T;
}
