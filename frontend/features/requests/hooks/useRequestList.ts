"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { requestService } from "@/features/requests/services/requestService";
import type {
  PageResponse,
  PurchaseRequestSummary,
  RequestSortDirection,
  RequestSortField,
  PurchaseRequestStatus,
} from "@/features/requests/types/request.types";

type UseRequestListState = {
  error: string | null;
  errorStatus: number | null;
  requestKey: string | null;
  page: PageResponse<PurchaseRequestSummary> | null;
};

const initialState: UseRequestListState = {
  error: null,
  errorStatus: null,
  requestKey: null,
  page: null,
};

export function useRequestList(
  isEnabled: boolean,
  params: {
    page: number;
    size: number;
    status?: PurchaseRequestStatus;
    sortDirection: RequestSortDirection;
    sortField: RequestSortField;
  },
) {
  const [state, setState] = useState<UseRequestListState>(initialState);
  const requestKey = JSON.stringify({
    page: params.page,
    size: params.size,
    status: params.status ?? null,
    sortDirection: params.sortDirection,
    sortField: params.sortField,
  });

  useEffect(() => {
    const controller = new AbortController();

    if (!isEnabled) {
      return () => {
        controller.abort();
      };
    }

    requestService
      .listRequests({
        page: params.page,
        size: params.size,
        status: params.status,
        sortDirection: params.sortDirection,
        sortField: params.sortField,
        signal: controller.signal,
      })
      .then((page) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          error: null,
          errorStatus: null,
          requestKey,
          page,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          error:
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar as solicitações.",
          errorStatus: error instanceof ApiError ? error.status : 500,
          requestKey,
          page: null,
        });
      });

    return () => {
      controller.abort();
    };
  }, [
    isEnabled,
    params.page,
    params.size,
    params.sortDirection,
    params.sortField,
    params.status,
    requestKey,
  ]);

  if (!isEnabled) {
    return {
      error: null,
      errorStatus: null,
      isLoading: true,
      page: null,
    };
  }

  return {
    error: state.requestKey === requestKey ? state.error : null,
    errorStatus: state.requestKey === requestKey ? state.errorStatus : null,
    isLoading: state.requestKey !== requestKey,
    page: state.requestKey === requestKey ? state.page : null,
  };
}
