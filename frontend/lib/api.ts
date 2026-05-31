import { getApiBaseUrl } from "@/lib/runtime-config";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      | "BAD_REQUEST"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "UNPROCESSABLE"
      | "UNKNOWN" = "UNKNOWN",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

type ErrorPayload = {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string }>;
};

function resolveRequestUrl(path: string) {
  if (path.startsWith("/api/")) {
    return path;
  }

  return `${getApiBaseUrl()}${path}`;
}

function getDefaultErrorMessage(status: number) {
  switch (status) {
    case 400:
      return "Verifique os dados informados e tente novamente.";
    case 401:
      return "Não foi possível validar sua autenticação.";
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

function getErrorCode(status: number): ApiError["code"] {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE";
    default:
      return "UNKNOWN";
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

export async function apiRequest<T>(
  path: string,
  { body, headers, token, ...init }: RequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resolveRequestUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      normalizeErrorMessage(response.status, payload as ErrorPayload | null),
      response.status,
      getErrorCode(response.status),
    );
  }

  return payload as T;
}
