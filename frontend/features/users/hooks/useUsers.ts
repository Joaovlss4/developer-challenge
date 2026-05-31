"use client";

import { useEffect, useMemo, useReducer } from "react";
import { ApiError } from "@/lib/api";
import { userService } from "@/features/users/services/userService";
import type {
  ManagedUser,
  UserSortDirection,
  UserSortField,
} from "@/features/users/types/user.types";
import { sortUsers } from "@/features/users/utils/userRules";

type UsersState = {
  error: string | null;
  errorStatus: number | null;
  isLoading: boolean;
  users: ManagedUser[];
};

type UsersAction =
  | { type: "start" }
  | { type: "success"; payload: ManagedUser[] }
  | { type: "failure"; payload: { error: string; status: number } };

const initialState: UsersState = {
  error: null,
  errorStatus: null,
  isLoading: true,
  users: [],
};

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "start":
      return initialState;
    case "success":
      return {
        error: null,
        errorStatus: null,
        isLoading: false,
        users: action.payload,
      };
    case "failure":
      return {
        error: action.payload.error,
        errorStatus: action.payload.status,
        isLoading: false,
        users: [],
      };
    default:
      return state;
  }
}

export function useUsers(
  enabled: boolean,
  {
    sortDirection,
    sortField,
  }: {
    sortDirection: UserSortDirection;
    sortField: UserSortField;
  },
) {
  const [state, dispatch] = useReducer(usersReducer, initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    dispatch({ type: "start" });

    userService
      .listUsers()
      .then((users) => {
        if (!isActive) {
          return;
        }

        dispatch({
          type: "success",
          payload: users,
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
                : "Não foi possível carregar os usuários.",
            status: error instanceof ApiError ? error.status : 500,
          },
        });
      });

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const sortedUsers = useMemo(
    () => sortUsers(state.users, sortField, sortDirection),
    [sortDirection, sortField, state.users],
  );

  return {
    ...state,
    users: sortedUsers,
  };
}
