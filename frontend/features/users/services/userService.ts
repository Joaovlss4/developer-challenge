import { apiRequest } from "@/lib/api";
import type {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserResponse,
  UsersListResponse,
} from "@/features/users/types/user.types";

export const userService = {
  async listUsers(): Promise<ManagedUser[]> {
    const response = await apiRequest<UsersListResponse>("/api/users", {
      method: "GET",
      cache: "no-store",
    });

    return response.data;
  },
  async getUserById(id: number): Promise<ManagedUser> {
    const response = await apiRequest<UserResponse>(`/api/users/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    return response.data;
  },
  async createUser(payload: CreateUserPayload): Promise<ManagedUser> {
    const response = await apiRequest<UserResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    return response.data;
  },
  async updateUser(id: number, payload: UpdateUserPayload): Promise<ManagedUser> {
    const response = await apiRequest<UserResponse>(`/api/users/${id}`, {
      method: "PATCH",
      body: payload,
    });

    return response.data;
  },
};
