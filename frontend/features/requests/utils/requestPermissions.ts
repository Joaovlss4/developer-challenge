import type {
  ApprovalLevel,
  AuthenticatedUser,
} from "@/features/auth/types/auth.types";
import type { PurchaseRequestDetails, PurchaseRequestSummary } from "@/features/requests/types/request.types";

const CREATE_REQUEST_APPROVAL_LEVELS: ApprovalLevel[] = ["LEVEL_0", "LEVEL_3"];

export function canCreatePurchaseRequest(user: AuthenticatedUser) {
  return CREATE_REQUEST_APPROVAL_LEVELS.includes(user.approvalLevel);
}

function hasCompatibleApprovalLevel(
  user: AuthenticatedUser,
  requiredApprovalLevel: ApprovalLevel,
) {
  if (user.role === "ADMIN") {
    return true;
  }

  if (user.role !== "APROVADOR" || requiredApprovalLevel === null) {
    return false;
  }

  switch (requiredApprovalLevel) {
    case "LEVEL_1":
      return (
        user.approvalLevel === "LEVEL_1" || user.approvalLevel === "LEVEL_2"
      );
    case "LEVEL_2":
      return user.approvalLevel === "LEVEL_2";
    case "LEVEL_3":
      return false;
    case "LEVEL_0":
      return false;
    default:
      return false;
  }
}

type RequestLike = Pick<
  PurchaseRequestSummary | PurchaseRequestDetails,
  "status" | "requiredApprovalLevel" | "requester"
>;

export function canCancelPurchaseRequest(
  user: AuthenticatedUser,
  request: RequestLike,
) {
  if (request.status !== "PENDING") {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  return (
    user.role === "SOLICITANTE" && request.requester.id === user.id
  );
}

export function canReviewPurchaseRequest(
  user: AuthenticatedUser,
  request: RequestLike,
) {
  if (request.status !== "PENDING") {
    return false;
  }

  return hasCompatibleApprovalLevel(user, request.requiredApprovalLevel);
}

export function canManagePendingPurchaseRequest(
  user: AuthenticatedUser,
  request: RequestLike,
) {
  return (
    canCancelPurchaseRequest(user, request) ||
    canReviewPurchaseRequest(user, request)
  );
}
