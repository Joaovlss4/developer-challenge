import { apiRequest } from "@/lib/api";
import type {
  DashboardKpi,
  PageResponse,
  PurchaseRequestPageResponse,
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
};
