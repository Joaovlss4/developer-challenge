import { RequestDetailsPageClient } from "@/features/requests/components/RequestDetailsPageClient";
import { requireServerSession } from "@/features/auth/utils/serverSession";

export default async function RequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireServerSession();

  return <RequestDetailsPageClient initialSession={session} requestId={Number(id)} />;
}
