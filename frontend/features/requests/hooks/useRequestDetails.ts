"use client";

import { useEffect, useReducer } from "react";
import { ApiError } from "@/lib/api";
import { requestService } from "@/features/requests/services/requestService";
import type { PurchaseRequestDetails } from "@/features/requests/types/request.types";

type RequestDetailsState = {
  error: string | null;
  errorStatus: number | null;
  isLoading: boolean;
  request: PurchaseRequestDetails | null;
};

type RequestDetailsAction =
  | { type: "start" }
  | { type: "success"; payload: PurchaseRequestDetails }
  | { type: "failure"; payload: { error: string; status: number } }
  | { type: "update"; payload: PurchaseRequestDetails };

const initialState: RequestDetailsState = {
  error: null,
  errorStatus: null,
  isLoading: true,
  request: null,
};

function requestDetailsReducer(
  state: RequestDetailsState,
  action: RequestDetailsAction,
): RequestDetailsState {
  switch (action.type) {
    case "start":
      return {
        error: null,
        errorStatus: null,
        isLoading: true,
        request: null,
      };
    case "success":
      return {
        error: null,
        errorStatus: null,
        isLoading: false,
        request: action.payload,
      };
    case "failure":
      return {
        error: action.payload.error,
        errorStatus: action.payload.status,
        isLoading: false,
        request: null,
      };
    case "update":
      return {
        ...state,
        error: null,
        errorStatus: null,
        request: action.payload,
      };
    default:
      return state;
  }
}

export function useRequestDetails(enabled: boolean, requestId: number) {
  const [state, dispatch] = useReducer(requestDetailsReducer, initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    dispatch({ type: "start" });

    requestService
      .getRequestById(requestId)
      .then((request) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "success",
          payload: request,
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
                : "Não foi possível carregar os detalhes da solicitação.",
            status: error instanceof ApiError ? error.status : 500,
          },
        });
      });

    return () => {
      isActive = false;
    };
  }, [enabled, requestId]);

  function updateRequest(request: PurchaseRequestDetails) {
    dispatch({
      type: "update",
      payload: request,
    });
  }

  return {
    ...state,
    updateRequest,
  };
}
