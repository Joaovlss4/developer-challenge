import { EditUserPageClient } from "@/features/users/components/EditUserPageClient";
import { requireServerSessionForRoles } from "@/features/auth/utils/serverSession";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireServerSessionForRoles(["ADMIN"]);

  return <EditUserPageClient initialSession={session} userId={Number(id)} />;
}
