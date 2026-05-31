import { LoginPageClient } from "@/features/auth/components/LoginPageClient";
import { resolveServerSession } from "@/features/auth/utils/serverSession";
import { ApiError } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  try {
    const session = await resolveServerSession();

    if (session) {
      redirect("/");
    }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  return <LoginPageClient />;
}
