import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import type { UserRole } from "@/features/auth/types/auth.types";

export const appNavigationItems = [
  {
    icon: <DashboardRoundedIcon fontSize="small" />,
    href: "/",
    label: "Dashboard",
    roles: ["ADMIN", "APROVADOR", "SOLICITANTE"] as UserRole[],
  },
  {
    icon: <ReceiptLongRoundedIcon fontSize="small" />,
    href: "/solicitacoes",
    label: "Solicitações",
    roles: ["ADMIN", "APROVADOR", "SOLICITANTE"] as UserRole[],
  },
  {
    icon: <GroupRoundedIcon fontSize="small" />,
    href: "/usuarios",
    label: "Usuários",
    roles: ["ADMIN"] as UserRole[],
  },
] as const;
