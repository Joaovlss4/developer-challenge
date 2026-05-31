"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { requestService } from "@/features/requests/services/requestService";
import type { DashboardKpi } from "@/features/requests/types/request.types";

type DashboardSummaryState = {
  errorStatus: number | null;
  isLoading: boolean;
  error: string | null;
  kpis: DashboardKpi[];
  requestKey: string | null;
};

const initialState: DashboardSummaryState = {
  errorStatus: null,
  isLoading: true,
  error: null,
  kpis: [],
  requestKey: null,
};

export function useDashboardSummary(requestKey: string | null) {
  const [state, setState] = useState<DashboardSummaryState>(initialState);

  useEffect(() => {
    let isActive = true;

    if (!requestKey) {
      return () => {
        isActive = false;
      };
    }

    requestService
      .getDashboardKpis()
      .then((kpis) => {
        if (!isActive) {
          return;
        }

        setState({
          errorStatus: null,
          isLoading: false,
          error: null,
          kpis,
          requestKey,
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setState({
          errorStatus: error instanceof ApiError ? error.status : 500,
          isLoading: false,
          error:
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar os indicadores do dashboard.",
          kpis: [],
          requestKey,
        });
      });

    return () => {
      isActive = false;
    };
  }, [requestKey]);

  if (!requestKey) {
    return {
      isLoading: true,
      errorStatus: null,
      error: null,
      kpis: [],
    };
  }

  return {
    error: state.requestKey === requestKey ? state.error : null,
    errorStatus: state.requestKey === requestKey ? state.errorStatus : null,
    isLoading: state.requestKey !== requestKey,
    kpis: state.requestKey === requestKey ? state.kpis : [],
  };
}
