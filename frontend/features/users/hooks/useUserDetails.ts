"use client";

import { useEffect, useReducer } from "react";
import { ApiError } from "@/lib/api";
import { userService } from "@/features/users/services/userService";
import type { ManagedUser } from "@/features/users/types/user.types";

type UserDetailsState = {
  error: string | null;
  errorStatus: number | null;
  isLoading: boolean;
  user: ManagedUser | null;
};

type UserDetailsAction =
  | { type: "start" }
  | { type: "success"; payload: ManagedUser }
  | { type: "failure"; payload: { error: string; status: number } };

const initialState: UserDetailsState = {
  error: null,
  errorStatus: null,
  isLoading: true,
  user: null,
};

function userDetailsReducer(
  state: UserDetailsState,
  action: UserDetailsAction,
): UserDetailsState {
  switch (action.type) {
    case "start":
      return initialState;
    case "success":
      return {
        error: null,
        errorStatus: null,
        isLoading: false,
        user: action.payload,
      };
    case "failure":
      return {
        error: action.payload.error,
        errorStatus: action.payload.status,
        isLoading: false,
        user: null,
      };
    default:
      return state;
  }
}

export function useUserDetails(enabled: boolean, userId: number) {
  const [state, dispatch] = useReducer(userDetailsReducer, initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    dispatch({ type: "start" });

    userService
      .getUserById(userId)
      .then((user) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "success",
          payload: user,
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
                : "Não foi possível carregar o usuário.",
            status: error instanceof ApiError ? error.status : 500,
          },
        });
      });

    return () => {
      isActive = false;
    };
  }, [enabled, userId]);

  return state;
}
