"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FirstPageRoundedIcon from "@mui/icons-material/FirstPageRounded";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import LastPageRoundedIcon from "@mui/icons-material/LastPageRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Select,
  Skeleton,
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
  FormControl,
  InputLabel,
  MenuItem,
  useTheme,
} from "@mui/material";
import type { MouseEvent } from "react";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/features/app-shell/components/AppShell";
import {
  FullPageError,
  FullPageLoading,
  useAuthenticatedSession,
} from "@/features/app-shell/hooks/useAuthenticatedSession";
import { useRequestList } from "@/features/requests/hooks/useRequestList";
import type {
  RequestStatusFilter,
  RequestSortDirection,
  RequestSortField,
  PurchaseRequestStatus,
  PurchaseRequestSummary,
} from "@/features/requests/types/request.types";

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_SORT_FIELD: RequestSortField = "createdAt";
const DEFAULT_SORT_DIRECTION: RequestSortDirection = "desc";
const STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: RequestStatusFilter;
}> = [
  { label: "Todos os status", value: "ALL" },
  { label: "Pendente", value: "PENDING" },
  { label: "Aprovada", value: "APPROVED" },
  { label: "Rejeitada", value: "REJECTED" },
  { label: "Cancelada", value: "CANCELLED" },
];

const SORTABLE_COLUMNS: Array<{
  field: RequestSortField;
  label: string;
  align?: "left" | "right";
}> = [
  { field: "id", label: "ID" },
  { field: "title", label: "Título" },
  { field: "status", label: "Status" },
  { field: "category", label: "Categoria" },
  { field: "amount", label: "Valor" },
  { field: "createdAt", label: "Criada em" },
];

export function RequestsPageClient() {
  const {
    clearSession,
    error: sessionError,
    isPending,
    isAuthenticated,
    retrySession,
    session,
    status,
  } =
    useAuthenticatedSession();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("ALL");
  const [sortField, setSortField] = useState<RequestSortField>(DEFAULT_SORT_FIELD);
  const [sortDirection, setSortDirection] =
    useState<RequestSortDirection>(DEFAULT_SORT_DIRECTION);

  const requestStatus = useMemo(
    () => (statusFilter === "ALL" ? undefined : statusFilter),
    [statusFilter],
  );

  const { error, errorStatus, isLoading, page: responsePage } = useRequestList(
    status === "authenticated" && isAuthenticated,
    {
      page,
      size: rowsPerPage,
      status: requestStatus,
      sortDirection,
      sortField,
    },
  );

  useEffect(() => {
    if (status === "authenticated" && errorStatus === 401) {
      clearSession();
    }
  }, [clearSession, errorStatus, status]);

  if (status === "error") {
    return (
      <FullPageError
        message={sessionError ?? "Não foi possível validar sua sessão agora."}
        onRetry={retrySession}
      />
    );
  }

  if (status === "checking" || !isAuthenticated || !session) {
    return <FullPageLoading message="Carregando solicitações..." />;
  }

  return (
    <AppShell
      isLoggingOut={isPending}
      onLogout={clearSession}
      subtitle="Lista organizada das solicitações retornadas pelo backend conforme as permissões do usuário autenticado."
      title="Solicitações"
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
            sx={{
              justifyContent: "space-between",
              alignItems: { sm: "center" },
            }}
          >
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 800 }}>
                {responsePage?.totalElements ?? 0} solicitações encontradas
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <FormControl
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 210 } }}
              >
                <InputLabel id="request-status-filter-label">
                  Filtrar por status
                </InputLabel>
                <Select
                  labelId="request-status-filter-label"
                  value={statusFilter}
                  label="Filtrar por status"
                  startAdornment={<FilterListRoundedIcon fontSize="small" />}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as RequestStatusFilter);
                    setPage(0);
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled
                sx={{
                  borderRadius: 1,
                  alignSelf: { xs: "stretch", sm: "auto" },
                }}
              >
                Criar solicitação
              </Button>
            </Stack>
          </Stack>

          {error && errorStatus !== 401 ? (
            <Alert severity="error">{error}</Alert>
          ) : null}

          {isLoading ? (
            <RequestsTableSkeleton />
          ) : responsePage && responsePage.content.length > 0 ? (
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
                          align={column.align}
                          sortDirection={
                            sortField === column.field ? sortDirection : false
                          }
                        >
                          <TableSortLabel
                            active={sortField === column.field}
                            direction={
                              sortField === column.field ? sortDirection : "asc"
                            }
                            onClick={() => {
                              const isSameField = sortField === column.field;
                              setSortField(column.field);
                              setSortDirection(
                                isSameField && sortDirection === "asc"
                                  ? "desc"
                                  : "asc",
                              );
                              setPage(0);
                            }}
                          >
                            {column.label}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                      <TableCell>Solicitante</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responsePage.content.map((request) => (
                      <RequestTableRow key={request.id} request={request} />
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        count={responsePage.totalElements}
                        page={responsePage.page}
                        rowsPerPage={responsePage.size}
                        onPageChange={(_, nextPage) => {
                          setPage(nextPage);
                        }}
                        onRowsPerPageChange={(event) => {
                          setRowsPerPage(Number(event.target.value));
                          setPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50]}
                        labelRowsPerPage="Itens por página:"
                        colSpan={7}
                        ActionsComponent={TablePaginationActions}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
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
              <Stack spacing={1.5} sx={{ alignItems: "center" }}>
                <ReceiptLongRoundedIcon color="disabled" />
                <Typography sx={{ fontWeight: 700 }}>
                  Nenhuma solicitação encontrada
                </Typography>
                <Typography color="text.secondary">
                  Quando houver registros disponíveis para o seu usuário, eles
                  aparecerão aqui.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
    </AppShell>
  );
}

function RequestTableRow({ request }: { request: PurchaseRequestSummary }) {
  return (
    <TableRow hover>
      <TableCell>{request.id}</TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 700 }}>{request.title}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={formatStatusLabel(request.status)}
          size="small"
          sx={{
            borderRadius: 1,
            fontWeight: 700,
            bgcolor: "primary.light",
            color: "primary.dark",
          }}
        />
      </TableCell>
      <TableCell>{request.category}</TableCell>
      <TableCell>{formatCurrency(request.amount)}</TableCell>
      <TableCell>{formatDate(request.createdAt)}</TableCell>
      <TableCell>{request.requester.name}</TableCell>
    </TableRow>
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
        {theme.direction === "rtl" ? (
          <LastPageRoundedIcon />
        ) : (
          <FirstPageRoundedIcon />
        )}
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
        {theme.direction === "rtl" ? (
          <FirstPageRoundedIcon />
        ) : (
          <LastPageRoundedIcon />
        )}
      </IconButton>
    </Stack>
  );
}

function RequestsTableSkeleton() {
  return (
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
              <TableCell>ID</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Solicitante</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Criada em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: DEFAULT_ROWS_PER_PAGE }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton variant="text" width={cellIndex === 0 ? "80%" : "60%"} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(status: PurchaseRequestStatus) {
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
