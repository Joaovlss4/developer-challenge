"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Backdrop,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import type { AuthSession } from "@/features/auth/types/auth.types";
import { useRequestDetails } from "@/features/requests/hooks/useRequestDetails";
import { useRequestHistory } from "@/features/requests/hooks/useRequestHistory";
import { requestDecisionSchema } from "@/features/requests/schemas/requestDecision.schema";
import { requestService } from "@/features/requests/services/requestService";
import type {
  PurchaseRequestDetails,
  RequestDecisionPayload,
} from "@/features/requests/types/request.types";
import {
  canCancelPurchaseRequest,
  canReviewPurchaseRequest,
} from "@/features/requests/utils/requestPermissions";
import {
  formatApprovalLevelLabel,
  formatCurrency,
  formatDate,
  formatRequestActionLabel,
  formatStatusLabel,
} from "@/features/requests/utils/requestFormatters";
import { ApiError } from "@/lib/api";

type ToastState = {
  message: string;
  severity: "success" | "error";
};

type PendingAction = "approve" | "cancel" | "reject" | null;

const ACTION_COPY: Record<
  Exclude<PendingAction, null>,
  {
    confirmLabel: string;
    description: string;
    successMessage: string;
    title: string;
  }
> = {
  approve: {
    confirmLabel: "Confirmar aprovação",
    description: "Essa ação marcará a solicitação como aprovada.",
    successMessage: "Solicitação aprovada com sucesso.",
    title: "Aprovar solicitação",
  },
  cancel: {
    confirmLabel: "Confirmar cancelamento",
    description: "Essa ação marcará a solicitação como cancelada.",
    successMessage: "Solicitação cancelada com sucesso.",
    title: "Cancelar solicitação",
  },
  reject: {
    confirmLabel: "Confirmar rejeição",
    description: "Essa ação marcará a solicitação como rejeitada.",
    successMessage: "Solicitação rejeitada com sucesso.",
    title: "Rejeitar solicitação",
  },
};

export function RequestDetailsPageClient({
  initialSession,
  requestId,
}: {
  initialSession?: AuthSession | null;
  requestId: number;
}) {
  const router = useRouter();
  const {
    clearSession,
    dismissLogoutError,
    error: sessionError,
    isAuthenticated,
    isLoggingOut,
    logoutError,
    logout,
    retrySession,
    session,
    status,
  } = useAuthenticatedSession(initialSession);
  const {
    error,
    errorStatus,
    isLoading,
    request,
    updateRequest,
  } = useRequestDetails(status === "authenticated" && isAuthenticated, requestId);
  const {
    error: historyError,
    errorStatus: historyErrorStatus,
    history,
    isLoading: isHistoryLoading,
  } = useRequestHistory(status === "authenticated" && isAuthenticated, requestId);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionComment, setActionComment] = useState("");
  const [actionCommentError, setActionCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && errorStatus === 401) {
      clearSession();
    }
  }, [clearSession, errorStatus, status]);

  const availableActions = useMemo(() => {
    if (!session || !request || request.status !== "PENDING") {
      return {
        canApprove: false,
        canCancel: false,
        canReject: false,
      };
    }

    const canReview = canReviewPurchaseRequest(session.user, request);

    return {
      canApprove: canReview,
      canCancel: canCancelPurchaseRequest(session.user, request),
      canReject: canReview,
    };
  }, [request, session]);

  if (!Number.isFinite(requestId)) {
    return (
      <FullPageError
        message="Solicitação inválida."
        onRetry={() => router.replace("/solicitacoes")}
      />
    );
  }

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando solicitação..." />;
  }

  async function handleConfirmAction(action: Exclude<PendingAction, null>) {
    const parsedPayload = requestDecisionSchema.safeParse({
      comment: actionComment,
    });

    if (!parsedPayload.success) {
      setActionCommentError(
        parsedPayload.error.issues[0]?.message ??
          "Verifique o comentário informado.",
      );
      return;
    }

    setIsSubmittingAction(true);
    await performAction(action, parsedPayload.data);
    setIsSubmittingAction(false);
  }

  async function performAction(
    action: Exclude<PendingAction, null>,
    payload: RequestDecisionPayload,
  ) {
    try {
      let updatedRequest: PurchaseRequestDetails;

      switch (action) {
        case "approve":
          updatedRequest = await requestService.approveRequest(requestId, payload);
          break;
        case "cancel":
          updatedRequest = await requestService.cancelRequest(requestId, payload);
          break;
        case "reject":
          updatedRequest = await requestService.rejectRequest(requestId, payload);
          break;
      }

      updateRequest(updatedRequest);
      setPendingAction(null);
      setActionComment("");
      setActionCommentError(null);
      setToast({
        message: ACTION_COPY[action].successMessage,
        severity: "success",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível concluir essa ação. Tente novamente.";

      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return;
      }

      setToast({
        message,
        severity: "error",
      });
    }
  }

  return (
    <>
      <AppShell
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
        onDismissLogoutError={dismissLogoutError}
        onLogout={logout}
        subtitle="Consulte o status atual da solicitação e execute ações permitidas pelo seu perfil."
        title="Detalhes da solicitação"
        user={session.user}
      >
        {error && !request ? (
          <Alert severity={errorStatus === 404 ? "warning" : "error"}>
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              p: 4,
              border: "1px solid rgba(122, 92, 255, 0.16)",
            }}
          >
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <CircularProgress />
              <Typography color="text.secondary">
                Carregando detalhes da solicitação...
              </Typography>
            </Stack>
          </Paper>
        ) : request ? (
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 1,
                p: { xs: 2, md: 3 },
                border: "1px solid rgba(122, 92, 255, 0.16)",
                boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                >
                  <Stack spacing={1}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      #{request.id} {request.title}
                    </Typography>
                    <Chip
                      label={formatStatusLabel(request.status)}
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        borderRadius: 1,
                        fontWeight: 700,
                        bgcolor: "primary.light",
                        color: "primary.dark",
                      }}
                    />
                  </Stack>

                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={() => router.push("/solicitacoes")}
                    sx={{ borderRadius: 1 }}
                  >
                    Voltar para solicitações
                  </Button>
                </Stack>

                <Divider />

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <DetailBlock
                    label="Solicitante"
                    value={`${request.requester.name} (${request.requester.email})`}
                  />
                  <DetailBlock
                    label="Categoria"
                    value={request.category}
                  />
                  <DetailBlock
                    label="Valor"
                    value={formatCurrency(request.amount)}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <DetailBlock
                    label="Nível de aprovação exigido"
                    value={formatApprovalLevelLabel(request.requiredApprovalLevel)}
                  />
                  <DetailBlock
                    label="Criada em"
                    value={formatDate(request.createdAt)}
                  />
                  <DetailBlock
                    label="Atualizada em"
                    value={formatDate(request.updatedAt)}
                  />
                </Stack>

                {request.resolvedAt ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    <DetailBlock
                      label="Resolvida em"
                      value={formatDate(request.resolvedAt)}
                    />
                    <DetailBlock
                      label="Resolvida por"
                      value={
                        request.resolvedBy
                          ? `${request.resolvedBy.name} (${request.resolvedBy.email})`
                          : "Não informado"
                      }
                    />
                  </Stack>
                ) : null}

                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>Descrição</Typography>
                  <Typography color="text.secondary">{request.description}</Typography>
                </Stack>
              </Stack>
            </Paper>

            {request.status === "PENDING" &&
            (availableActions.canApprove ||
              availableActions.canCancel ||
              availableActions.canReject) ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  p: { xs: 2, md: 3 },
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                  boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
                }}
              >
                <Stack spacing={2}>
                  <Typography sx={{ fontWeight: 800 }}>Ações disponíveis</Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ flexWrap: "wrap" }}
                  >
                    {availableActions.canApprove ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={
                          isSubmittingAction && pendingAction === "approve" ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            <CheckCircleRoundedIcon />
                          )
                        }
                        onClick={() => {
                          setPendingAction("approve");
                          setActionComment("");
                          setActionCommentError(null);
                        }}
                        disabled={isSubmittingAction || pendingAction !== null}
                        sx={{ borderRadius: 1 }}
                      >
                        {isSubmittingAction && pendingAction === "approve"
                          ? "Aprovando..."
                          : "Aprovar"}
                      </Button>
                    ) : null}

                    {availableActions.canReject ? (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={
                          isSubmittingAction && pendingAction === "reject" ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            <CloseRoundedIcon />
                          )
                        }
                        onClick={() => {
                          setPendingAction("reject");
                          setActionComment("");
                          setActionCommentError(null);
                        }}
                        disabled={isSubmittingAction || pendingAction !== null}
                        sx={{ borderRadius: 1 }}
                      >
                        {isSubmittingAction && pendingAction === "reject"
                          ? "Rejeitando..."
                          : "Rejeitar"}
                      </Button>
                    ) : null}

                    {availableActions.canCancel ? (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={
                          isSubmittingAction && pendingAction === "cancel" ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : (
                            <BlockRoundedIcon />
                          )
                        }
                        onClick={() => {
                          setPendingAction("cancel");
                          setActionComment("");
                          setActionCommentError(null);
                        }}
                        disabled={isSubmittingAction || pendingAction !== null}
                        sx={{ borderRadius: 1 }}
                      >
                        {isSubmittingAction && pendingAction === "cancel"
                          ? "Cancelando..."
                          : "Cancelar"}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            ) : null}

            <Paper
              elevation={0}
              sx={{
                borderRadius: 1,
                p: { xs: 2, md: 3 },
                border: "1px solid rgba(122, 92, 255, 0.16)",
                boxShadow: "0 8px 24px rgba(62, 39, 125, 0.06)",
              }}
            >
              <Stack spacing={2}>
                <Typography sx={{ fontWeight: 800 }}>
                  Histórico de alterações
                </Typography>

                {historyError ? (
                  <Alert severity={historyErrorStatus === 404 ? "warning" : "error"}>
                    {historyError}
                  </Alert>
                ) : null}

                {isHistoryLoading ? (
                  <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                    <CircularProgress size={24} />
                    <Typography color="text.secondary">
                      Carregando histórico...
                    </Typography>
                  </Stack>
                ) : history.length > 0 ? (
                  <TableContainer>
                    <Table sx={{ minWidth: 760 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Ação</TableCell>
                          <TableCell>De</TableCell>
                          <TableCell>Para</TableCell>
                          <TableCell>Responsável</TableCell>
                          <TableCell>Comentário</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.map((entry) => (
                          <TableRow key={entry.id} hover>
                            <TableCell>{formatDate(entry.createdAt)}</TableCell>
                            <TableCell>{formatRequestActionLabel(entry.action)}</TableCell>
                            <TableCell>
                              {entry.fromStatus
                                ? formatStatusLabel(entry.fromStatus)
                                : "Sem status anterior"}
                            </TableCell>
                            <TableCell>
                              {entry.toStatus
                                ? formatStatusLabel(entry.toStatus)
                                : "Sem status final"}
                            </TableCell>
                            <TableCell>{entry.actor.name}</TableCell>
                            <TableCell>
                              {entry.comment?.trim() || "Sem comentário"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    Nenhum evento de histórico foi encontrado para esta solicitação.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </AppShell>

      <Dialog
        open={pendingAction !== null}
        onClose={
          isSubmittingAction
            ? undefined
            : () => {
                setPendingAction(null);
                setActionComment("");
                setActionCommentError(null);
              }
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {pendingAction ? ACTION_COPY[pendingAction].title : ""}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {pendingAction ? ACTION_COPY[pendingAction].description : ""}
            </Typography>
            <TextField
              label="Comentário"
              placeholder="Adicione um comentário para esta ação"
              value={actionComment}
              onChange={(event) => {
                setActionComment(event.target.value);
                if (actionCommentError) {
                  setActionCommentError(null);
                }
              }}
              error={Boolean(actionCommentError)}
              helperText={actionCommentError ?? "Opcional. Máximo de 2000 caracteres."}
              multiline
              minRows={3}
              fullWidth
              disabled={isSubmittingAction}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setPendingAction(null);
              setActionComment("");
              setActionCommentError(null);
            }}
            disabled={isSubmittingAction}
            sx={{ borderRadius: 1 }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={() => pendingAction && handleConfirmAction(pendingAction)}
            disabled={isSubmittingAction || pendingAction === null}
            sx={{ borderRadius: 1 }}
          >
            {isSubmittingAction && pendingAction ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CircularProgress color="inherit" size={18} />
                <span>Processando...</span>
              </Stack>
            ) : pendingAction ? (
              ACTION_COPY[pendingAction].confirmLabel
            ) : null}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>

      <Backdrop
        open={isSubmittingAction}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 2,
          bgcolor: "rgba(29, 23, 62, 0.72)",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ color: "common.white", fontWeight: 700 }}>
          Processando ação...
        </Typography>
      </Backdrop>
    </>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5} sx={{ flex: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}
