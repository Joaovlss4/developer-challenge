import { RequestsPageClient } from "@/features/requests/components/RequestsPageClient";
import { requireServerSession } from "@/features/auth/utils/serverSession";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const session = await requireServerSession();

  return (
    <RequestsPageClient
      createdSuccess={params.created === "1"}
      initialSession={session}
    />
  );
}
