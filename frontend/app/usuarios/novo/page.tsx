import { CreateUserPageClient } from "@/features/users/components/CreateUserPageClient";
import { requireServerSessionForRoles } from "@/features/auth/utils/serverSession";

export default async function CreateUserPage() {
  const session = await requireServerSessionForRoles(["ADMIN"]);

  return <CreateUserPageClient initialSession={session} />;
}
