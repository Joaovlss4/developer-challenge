const API_BASE_URL_ENV_KEY = "NEXT_PUBLIC_API_URL";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      `${API_BASE_URL_ENV_KEY} is not configured. Define it before starting the frontend.`,
    );
  }

  return normalizeBaseUrl(baseUrl);
}
