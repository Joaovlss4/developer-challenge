"use client";

import { useEffect, useReducer } from "react";
import { ApiError } from "@/lib/api";
import { requestService } from "@/features/requests/services/requestService";
import type { RequestHistoryEntry } from "@/features/requests/types/request.types";

type RequestHistoryState = {
  error: string | null;
  errorStatus: number | null;
  history: RequestHistoryEntry[];
  isLoading: boolean;
};

type RequestHistoryAction =
  | { type: "start" }
  | { type: "success"; payload: RequestHistoryEntry[] }
  | { type: "failure"; payload: { error: string; status: number } };

const initialState: RequestHistoryState = {
  error: null,
  errorStatus: null,
  history: [],
  isLoading: true,
};

function requestHistoryReducer(
  state: RequestHistoryState,
  action: RequestHistoryAction,
): RequestHistoryState {
  switch (action.type) {
    case "start":
      return {
        error: null,
        errorStatus: null,
        history: [],
        isLoading: true,
      };
    case "success":
      return {
        error: null,
        errorStatus: null,
        history: action.payload,
        isLoading: false,
      };
    case "failure":
      return {
        error: action.payload.error,
        errorStatus: action.payload.status,
        history: [],
        isLoading: false,
      };
    default:
      return state;
  }
}

export function useRequestHistory(enabled: boolean, requestId: number) {
  const [state, dispatch] = useReducer(requestHistoryReducer, initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    dispatch({ type: "start" });

    requestService
      .getRequestHistory(requestId)
      .then((history) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "success",
          payload: history,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "failure",
          payload: {
            error:
              error instanceof ApiError
                ? error.message
                : "Não foi possível carregar o histórico da solicitação.",
            status: error instanceof ApiError ? error.status : 500,
          },
        });
      });

    return () => {
      isActive = false;
    };
  }, [enabled, requestId]);

  return state;
}
