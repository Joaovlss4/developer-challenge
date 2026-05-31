"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStoredSession } from "@/features/auth/hooks/useStoredSession";

export function useAuthenticatedSession() {
  const sessionState = useStoredSession();
  const router = useRouter();

  useEffect(() => {
    if (sessionState.status === "anonymous") {
      router.replace("/login");
    }
  }, [router, sessionState.status]);

  return sessionState;
}

export function FullPageLoading({ message }: { message: string }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}

export function FullPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 480 }}>
        <Alert severity="error">{message}</Alert>
        <Button variant="contained" onClick={onRetry} sx={{ alignSelf: "center" }}>
          Tentar novamente
        </Button>
      </Stack>
    </Box>
  );
}
