"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useTheme,
} from "@mui/material";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import type { AuthSession } from "@/features/auth/types/auth.types";
import { useUsers } from "@/features/users/hooks/useUsers";
import type {
  UserSortDirection,
  UserSortField,
} from "@/features/users/types/user.types";
import {
  canManageUsers,
  formatApprovalLevelLabel,
  formatUserRoleLabel,
} from "@/features/users/utils/userRules";

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_SORT_FIELD: UserSortField = "id";
const DEFAULT_SORT_DIRECTION: UserSortDirection = "asc";

const SORTABLE_COLUMNS: Array<{ field: UserSortField; label: string }> = [
  { field: "id", label: "ID" },
  { field: "name", label: "Nome" },
  { field: "email", label: "E-mail" },
  { field: "role", label: "Perfil" },
  { field: "approvalLevel", label: "Nível" },
];

export function UsersPageClient({
  createdSuccess = false,
  initialSession,
  updatedSuccess = false,
}: {
  createdSuccess?: boolean;
  initialSession?: AuthSession | null;
  updatedSuccess?: boolean;
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [sortField, setSortField] = useState<UserSortField>(DEFAULT_SORT_FIELD);
  const [sortDirection, setSortDirection] =
    useState<UserSortDirection>(DEFAULT_SORT_DIRECTION);
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);
  const [navigatingUserId, setNavigatingUserId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(
    createdSuccess ? "Usuário criado com sucesso." : updatedSuccess ? "Usuário atualizado com sucesso." : null,
  );

  const { error, errorStatus, isLoading, users } = useUsers(
    status === "authenticated" && isAuthenticated && !!session && canManageUsers(session.user.role),
    {
      sortDirection,
      sortField,
    },
  );

  useEffect(() => {
    if (status === "authenticated" && errorStatus === 401) {
      clearSession();
    }
  }, [clearSession, errorStatus, status]);

  useEffect(() => {
    if (!createdSuccess && !updatedSuccess) {
      return;
    }

    router.replace("/usuarios", { scroll: false });
  }, [createdSuccess, router, updatedSuccess]);

  const paginatedUsers = useMemo(
    () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [page, rowsPerPage, users],
  );

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando usuários..." />;
  }

  if (!canManageUsers(session.user.role)) {
    return (
      <FullPageError
        message="Você não tem permissão para acessar a gestão de usuários."
        onRetry={() => router.replace("/")}
      />
    );
  }

  return (
    <>
      <AppShell
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
        onDismissLogoutError={dismissLogoutError}
        onLogout={logout}
        subtitle="Gestão administrativa de usuários, perfis e níveis de aprovação."
        title="Usuários"
        user={session.user}
      >
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
              <Typography sx={{ fontWeight: 800 }}>
                {users.length} usuários encontrados
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => router.push("/usuarios/novo")}
                disabled={isNavigatingToEdit}
                sx={{ borderRadius: 1 }}
              >
                Criar usuário
              </Button>
            </Stack>

            {error && errorStatus !== 401 ? <Alert severity="error">{error}</Alert> : null}

            {!isLoading && users.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                  overflow: "hidden",
                }}
              >
                <TableContainer>
                  <Table sx={{ minWidth: 860 }}>
                    <TableHead>
                      <TableRow>
                        {SORTABLE_COLUMNS.map((column) => (
                          <TableCell
                            key={column.field}
                            sortDirection={sortField === column.field ? sortDirection : false}
                          >
                            <TableSortLabel
                              active={sortField === column.field}
                              direction={sortField === column.field ? sortDirection : "asc"}
                              onClick={() => {
                                const isSameField = sortField === column.field;
                                setSortField(column.field);
                                setSortDirection(
                                  isSameField && sortDirection === "asc" ? "desc" : "asc",
                                );
                                setPage(0);
                              }}
                            >
                              {column.label}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{formatUserRoleLabel(user.role)}</TableCell>
                          <TableCell>{formatApprovalLevelLabel(user.approvalLevel)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              aria-label="Editar usuário"
                              disabled={isNavigatingToEdit}
                              onClick={() => {
                                setNavigatingUserId(user.id);
                                setIsNavigatingToEdit(true);
                                router.push(`/usuarios/${user.id}/editar`);
                              }}
                            >
                              {isNavigatingToEdit && navigatingUserId === user.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <EditRoundedIcon />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TablePagination
                          count={users.length}
                          page={page}
                          rowsPerPage={rowsPerPage}
                          onPageChange={(_, nextPage) => setPage(nextPage)}
                          onRowsPerPageChange={(event) => {
                            setRowsPerPage(Number(event.target.value));
                            setPage(0);
                          }}
                          rowsPerPageOptions={[10, 25, 50]}
                          labelRowsPerPage="Itens por página:"
                          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                          colSpan={6}
                          ActionsComponent={TablePaginationActions}
                        />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              </Paper>
            ) : isLoading ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  p: 4,
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                }}
              >
                <Stack spacing={2} sx={{ alignItems: "center" }}>
                  <Typography color="text.secondary">Carregando usuários...</Typography>
                </Stack>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 1,
                  p: 4,
                  border: "1px solid rgba(122, 92, 255, 0.16)",
                  textAlign: "center",
                }}
              >
                <Typography color="text.secondary">
                  Nenhum usuário encontrado.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Paper>
      </AppShell>

      <Snackbar
        open={toastMessage !== null}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      <Backdrop
        open={isNavigatingToEdit}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 2,
          bgcolor: "rgba(29, 23, 62, 0.48)",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ color: "common.white", fontWeight: 700 }}>
          Abrindo edição do usuário...
        </Typography>
      </Backdrop>
    </>
  );
}

type TablePaginationActionsProps = {
  count: number;
  onPageChange: (event: MouseEvent<HTMLButtonElement>, page: number) => void;
  page: number;
  rowsPerPage: number;
};

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, onPageChange, page, rowsPerPage } = props;
  const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);

  return (
    <Stack direction="row" spacing={0.5} sx={{ ml: 2 }}>
      <IconButton
        onClick={(event) => onPageChange(event, 0)}
        disabled={page === 0}
        aria-label="Primeira página"
      >
        {theme.direction === "rtl" ? <LastPageRoundedIcon /> : <FirstPageRoundedIcon />}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, page - 1)}
        disabled={page === 0}
        aria-label="Página anterior"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRightRoundedIcon />
        ) : (
          <KeyboardArrowLeftRoundedIcon />
        )}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, page + 1)}
        disabled={page >= lastPage}
        aria-label="Próxima página"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeftRoundedIcon />
        ) : (
          <KeyboardArrowRightRoundedIcon />
        )}
      </IconButton>
      <IconButton
        onClick={(event) => onPageChange(event, lastPage)}
        disabled={page >= lastPage}
        aria-label="Última página"
      >
        {theme.direction === "rtl" ? <FirstPageRoundedIcon /> : <LastPageRoundedIcon />}
      </IconButton>
    </Stack>
  );
}
