import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

export const appNavigationItems = [
  {
    icon: <DashboardRoundedIcon fontSize="small" />,
    href: "/",
    label: "Dashboard",
  },
  {
    icon: <ReceiptLongRoundedIcon fontSize="small" />,
    href: "/solicitacoes",
    label: "Solicitações",
  },
  {
    icon: <AssignmentRoundedIcon fontSize="small" />,
    href: "/aprovacoes",
    label: "Aprovações",
  },
  {
    icon: <SettingsRoundedIcon fontSize="small" />,
    href: "/configuracoes",
    label: "Configurações",
  },
] as const;
