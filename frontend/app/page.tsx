import { DashboardPageClient } from "@/features/dashboard/components/DashboardPageClient";
import { requireServerSession } from "@/features/auth/utils/serverSession";

export default async function Home() {
  const session = await requireServerSession();

  return <DashboardPageClient initialSession={session} />;
}
