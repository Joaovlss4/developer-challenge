import type { ApprovalLevel, UserRole } from "@/features/auth/types/auth.types";
import type { ManagedUser } from "@/features/users/types/user.types";

export type FormApprovalLevel = Exclude<ApprovalLevel, null>;

export const USER_ROLE_OPTIONS: Array<{ label: string; value: UserRole }> = [
  { label: "Administrador", value: "ADMIN" },
  { label: "Aprovador", value: "APROVADOR" },
  { label: "Solicitante", value: "SOLICITANTE" },
];

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

export function getAllowedApprovalLevels(role: UserRole): FormApprovalLevel[] {
  switch (role) {
    case "ADMIN":
      return ["LEVEL_3"];
    case "APROVADOR":
      return ["LEVEL_1", "LEVEL_2"];
    case "SOLICITANTE":
      return ["LEVEL_0"];
    default:
      return [];
  }
}

export function getDefaultApprovalLevel(role: UserRole): FormApprovalLevel {
  switch (role) {
    case "ADMIN":
      return "LEVEL_3";
    case "APROVADOR":
      return "LEVEL_1";
    case "SOLICITANTE":
      return "LEVEL_0";
    default:
      return "LEVEL_0";
  }
}

export function normalizeApprovalLevelForRole(
  role: UserRole,
  approvalLevel: ApprovalLevel,
): FormApprovalLevel {
  const allowedLevels = getAllowedApprovalLevels(role);

  if (approvalLevel !== null && allowedLevels.includes(approvalLevel)) {
    return approvalLevel;
  }

  return getDefaultApprovalLevel(role);
}

export function formatUserRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "APROVADOR":
      return "Aprovador";
    case "SOLICITANTE":
      return "Solicitante";
    default:
      return role;
  }
}

export function formatApprovalLevelLabel(level: ApprovalLevel) {
  switch (level) {
    case "LEVEL_0":
      return "Nível 0";
    case "LEVEL_1":
      return "Nível 1";
    case "LEVEL_2":
      return "Nível 2";
    case "LEVEL_3":
      return "Nível 3";
    default:
      return "Não definido";
  }
}

export function sortUsers(
  users: ManagedUser[],
  sortField: "id" | "name" | "email" | "role" | "approvalLevel",
  sortDirection: "asc" | "desc",
) {
  const sortedUsers = [...users].sort((left, right) => {
    const leftValue = left[sortField] ?? "";
    const rightValue = right[sortField] ?? "";

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }

    return String(leftValue).localeCompare(String(rightValue), "pt-BR", {
      sensitivity: "base",
    });
  });

  return sortDirection === "asc" ? sortedUsers : sortedUsers.reverse();
}
