import type { ApiSuccessResponse, ApprovalLevel, UserRole } from "@/features/auth/types/auth.types";

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  approvalLevel: ApprovalLevel;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  approvalLevel: ApprovalLevel;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  approvalLevel?: ApprovalLevel;
}

export type UsersListResponse = ApiSuccessResponse<ManagedUser[]>;
export type UserResponse = ApiSuccessResponse<ManagedUser>;

export type UserSortField = "id" | "name" | "email" | "role" | "approvalLevel";
export type UserSortDirection = "asc" | "desc";
