import { apiRequest } from "@/lib/api";
import type {
  ApiSuccessResponse,
  AuthSession,
  LoginRequest,
} from "@/features/auth/types/auth.types";

export const authService = {
  async login(payload: LoginRequest) {
    const response = await apiRequest<ApiSuccessResponse<AuthSession>>(
      "/api/auth/login",
      {
        method: "POST",
        body: payload,
      },
    );

    return response.data;
  },
  async getSession() {
    const response = await apiRequest<ApiSuccessResponse<AuthSession>>(
      "/api/auth/session",
      {
        method: "GET",
        cache: "no-store",
      },
    );

    return response.data;
  },
  async logout() {
    await apiRequest<{ data: { success: boolean } }>("/api/auth/logout", {
      method: "POST",
    });
  },
};
