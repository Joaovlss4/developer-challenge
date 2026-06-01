import { apiRequest } from "@/lib/api";
import type {
  CreatePurchaseRequestPayload,
  DashboardKpi,
  PageResponse,
  PurchaseRequestPageResponse,
  PurchaseRequestDetails,
  RequestDecisionPayload,
  RequestHistoryEntry,
  RequestHistoryResponse,
  PurchaseRequestResponse,
  PurchaseRequestSummary,
  RequestSortDirection,
  RequestSortField,
  PurchaseRequestStatus,
} from "@/features/requests/types/request.types";

const DASHBOARD_STATUSES: Array<{
  label: string;
  status: PurchaseRequestStatus;
}> = [
  { label: "Pendentes", status: "PENDING" },
  { label: "Aprovadas", status: "APPROVED" },
  { label: "Rejeitadas", status: "REJECTED" },
  { label: "Canceladas", status: "CANCELLED" },
];

async function fetchStatusCount(status: PurchaseRequestStatus) {
  const searchParams = new URLSearchParams({
    page: "0",
    size: "1",
    status,
  });

  const response = await apiRequest<PurchaseRequestPageResponse>(
    `/api/requests?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return response.data.totalElements;
}

export const requestService = {
  async getDashboardKpis(): Promise<DashboardKpi[]> {
    const counts = await Promise.all(
      DASHBOARD_STATUSES.map(async ({ label, status }) => ({
        label,
        status,
        value: await fetchStatusCount(status),
      })),
    );

    return counts;
  },
  async listRequests({
    page,
    size,
    status,
    sortDirection,
    sortField,
    signal,
  }: {
    page: number;
    size: number;
    status?: PurchaseRequestStatus;
    sortDirection: RequestSortDirection;
    sortField: RequestSortField;
    signal?: AbortSignal;
  }): Promise<PageResponse<PurchaseRequestSummary>> {
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: `${sortField},${sortDirection}`,
    });

    if (status) {
      searchParams.set("status", status);
    }

    const response = await apiRequest<PurchaseRequestPageResponse>(
      `/api/requests?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal,
      },
    );

    return response.data;
  },
  async createRequest(payload: CreatePurchaseRequestPayload) {
    const response = await apiRequest<PurchaseRequestResponse>("/api/requests", {
      method: "POST",
      body: payload,
    });

    return response.data;
  },
  async getRequestById(id: number) {
    const response = await apiRequest<PurchaseRequestResponse>(`/api/requests/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    return response.data;
  },
  async getRequestHistory(id: number): Promise<RequestHistoryEntry[]> {
    const response = await apiRequest<RequestHistoryResponse>(
      `/api/requests/${id}/history`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    return [...response.data].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  },
  async cancelRequest(
    id: number,
    payload?: RequestDecisionPayload,
  ): Promise<PurchaseRequestDetails> {
    const response = await apiRequest<PurchaseRequestResponse>(
      `/api/requests/${id}/cancel`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },
  async approveRequest(
    id: number,
    payload?: RequestDecisionPayload,
  ): Promise<PurchaseRequestDetails> {
    const response = await apiRequest<PurchaseRequestResponse>(
      `/api/requests/${id}/approve`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },
  async rejectRequest(
    id: number,
    payload?: RequestDecisionPayload,
  ): Promise<PurchaseRequestDetails> {
    const response = await apiRequest<PurchaseRequestResponse>(
      `/api/requests/${id}/reject`,
      {
        method: "PATCH",
        body: payload,
      },
    );

    return response.data;
  },
};
