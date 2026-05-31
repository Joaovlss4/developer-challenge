import type { ApiSuccessResponse } from "@/features/auth/types/auth.types";
import type { ApprovalLevel } from "@/features/auth/types/auth.types";

export type PurchaseRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface PurchaseRequestSummary {
  id: number;
  title: string;
  amount: number;
  category: string;
  status: PurchaseRequestStatus;
  requiredApprovalLevel: ApprovalLevel;
  requester: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type PurchaseRequestPageResponse = ApiSuccessResponse<
  PageResponse<PurchaseRequestSummary>
>;

export interface DashboardKpi {
  label: string;
  status: PurchaseRequestStatus;
  value: number;
}

export type RequestStatusFilter = PurchaseRequestStatus | "ALL";

export type RequestSortField =
  | "id"
  | "title"
  | "category"
  | "amount"
  | "createdAt"
  | "status";

export type RequestSortDirection = "asc" | "desc";
