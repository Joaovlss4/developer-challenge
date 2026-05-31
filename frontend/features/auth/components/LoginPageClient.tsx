"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { useStoredSession } from "@/features/auth/hooks/useStoredSession";

export function LoginPageClient() {
  const { isAuthenticated, persistSession, status } = useStoredSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router, status]);

  if (status === "authenticated" && isAuthenticated) {
    return null;
  }

  return <LoginScreen onAuthenticated={persistSession} />;
}
