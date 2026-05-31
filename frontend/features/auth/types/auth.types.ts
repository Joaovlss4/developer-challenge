export type UserRole = "ADMIN" | "APROVADOR" | "SOLICITANTE";

export type ApprovalLevel = "LEVEL_0" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | null;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  approvalLevel: ApprovalLevel;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: AuthenticatedUser;
}

export interface AuthSession {
  user: AuthenticatedUser;
}

export interface ApiSuccessResponse<T> {
  data: T;
}
