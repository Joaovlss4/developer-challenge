"use client";

import { useCallback, useEffect, useMemo, useReducer, useState, useTransition } from "react";
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

function createInitialState(initialSession?: AuthSession | null): SessionState {
  if (!initialSession) {
    return initialState;
  }

  return {
    error: null,
    errorStatus: null,
    session: initialSession,
    status: "authenticated",
  };
}

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

export function useStoredSession(initialSession?: AuthSession | null) {
  const [{ error, errorStatus, session, status }, dispatch] = useReducer(
    sessionReducer,
    initialSession,
    createInitialState,
  );
  const [isPending, startTransition] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const retrySession = useCallback(() => {
    let isActive = true;
    setLogoutError(null);

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

  useEffect(() => {
    if (initialSession) {
      return;
    }

    let isActive = true;

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
  }, [initialSession]);

  const isAuthenticated = useMemo(
    () => status === "authenticated" && session !== null,
    [session, status],
  );

  function persistSession(nextSession: AuthSession) {
    setLogoutError(null);

    startTransition(() => {
      dispatch({
        type: "persist",
        payload: nextSession,
      });
    });
  }

  function clearSession() {
    setLogoutError(null);

    startTransition(() => {
      dispatch({
        type: "clear",
      });
    });

    void authService.logout().catch((error: unknown) => {
      setLogoutError(
        error instanceof ApiError
          ? error.message
          : "Sua sessão local foi encerrada, mas não foi possível finalizar o logout no servidor.",
      );
    });
  }

  function dismissLogoutError() {
    setLogoutError(null);
  }

  return {
    error,
    errorStatus,
    session,
    status,
    logoutError,
    isPending,
    isAuthenticated,
    retrySession,
    persistSession,
    clearSession,
    dismissLogoutError,
  };
}
