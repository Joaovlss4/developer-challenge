import { CreateRequestPageClient } from "@/features/requests/components/CreateRequestPageClient";
import { requireServerSession } from "@/features/auth/utils/serverSession";

export default async function CreateRequestPage() {
  const session = await requireServerSession();

  return <CreateRequestPageClient initialSession={session} />;
}
