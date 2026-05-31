import type {
  ApprovalLevel,
} from "@/features/auth/types/auth.types";
import type {
  PurchaseRequestStatus,
  RequestAction,
} from "@/features/requests/types/request.types";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatStatusLabel(status: PurchaseRequestStatus) {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "APPROVED":
      return "Aprovada";
    case "REJECTED":
      return "Rejeitada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
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

export function formatRequestActionLabel(action: RequestAction) {
  switch (action) {
    case "CREATED":
      return "Criada";
    case "APPROVED":
      return "Aprovada";
    case "REJECTED":
      return "Rejeitada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return action;
  }
}
