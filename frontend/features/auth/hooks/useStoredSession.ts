"use client";

import { useCallback, useEffect, useMemo, useReducer, useTransition } from "react";
import { ApiError } from "@/lib/api";
import { authService } from "@/features/auth/services/authService";
import type { AuthSession } from "@/features/auth/types/auth.types";

type SessionStatus = "checking" | "anonymous" | "authenticated" | "error";

type SessionState = {
  error: string | null;
  errorStatus: number | null;
  session: AuthSession | null;
  status: SessionStatus;
};

type SessionAction =
  | {
      type: "hydrate";
      payload: SessionState;
    }
  | {
      type: "persist";
      payload: AuthSession;
    }
  | {
      type: "clear";
    };

const initialState: SessionState = {
  error: null,
  errorStatus: null,
  session: null,
  status: "checking",
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "persist":
      return {
        error: null,
        errorStatus: null,
        session: action.payload,
        status: "authenticated",
      };
    case "clear":
      return {
        error: null,
        errorStatus: null,
        session: null,
        status: "anonymous",
      };
    default:
      return state;
  }
}

export function useStoredSession() {
  const [{ error, errorStatus, session, status }, dispatch] = useReducer(
    sessionReducer,
    initialState,
  );
  const [isPending, startTransition] = useTransition();

  const retrySession = useCallback(() => {
    let isActive = true;

    dispatch({
      type: "hydrate",
      payload: initialState,
    });

    authService
      .getSession()
      .then((storedSession) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "hydrate",
          payload: {
            error: null,
            errorStatus: null,
            session: storedSession,
            status: "authenticated",
          },
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          dispatch({
            type: "hydrate",
            payload: {
              error: null,
              errorStatus: 401,
              session: null,
              status: "anonymous",
            },
          });
          return;
        }

        dispatch({
          type: "hydrate",
          payload: {
            error:
              error instanceof ApiError
                ? error.message
                : "Não foi possível validar sua sessão agora. Tente novamente.",
            errorStatus: error instanceof ApiError ? error.status : 500,
            session: null,
            status: "error",
          },
        });
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => retrySession(), [retrySession]);

  const isAuthenticated = useMemo(
    () => status === "authenticated" && session !== null,
    [session, status],
  );

  function persistSession(nextSession: AuthSession) {
    startTransition(() => {
      dispatch({
        type: "persist",
        payload: nextSession,
      });
    });
  }

  function clearSession() {
    startTransition(() => {
      dispatch({
        type: "clear",
      });
    });

    void authService.logout().catch(() => {
      // Best effort logout to avoid leaving stale UI state on screen.
    });
  }

  return {
    error,
    errorStatus,
    session,
    status,
    isPending,
    isAuthenticated,
    retrySession,
    persistSession,
    clearSession,
  };
}
