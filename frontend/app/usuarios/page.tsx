import { UsersPageClient } from "@/features/users/components/UsersPageClient";
import { requireServerSessionForRoles } from "@/features/auth/utils/serverSession";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const session = await requireServerSessionForRoles(["ADMIN"]);

  return (
    <UsersPageClient
      createdSuccess={params.created === "1"}
      initialSession={session}
      updatedSuccess={params.updated === "1"}
    />
  );
}
