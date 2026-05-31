"use client";

import { Box, Container, Paper } from "@mui/material";
import { LoginForm } from "@/features/auth/components/LoginForm";
import type { AuthSession } from "@/features/auth/types/auth.types";

type LoginScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #fcfbff 0%, #f2efff 48%, #f8f6ff 100%)",
        py: { xs: 4, md: 8 },
      }}
    >
      <DecorativeShape
        sx={{
          top: -120,
          left: -110,
          width: 360,
          height: 280,
          transform: "rotate(-18deg)",
          bgcolor: "rgba(122, 92, 255, 0.12)",
        }}
      />
      <DecorativeShape
        sx={{
          top: 64,
          right: -120,
          width: 340,
          height: 260,
          transform: "rotate(24deg)",
          bgcolor: "rgba(96, 63, 198, 0.1)",
        }}
      />
      <DecorativeShape
        sx={{
          bottom: -120,
          right: "18%",
          width: 280,
          height: 220,
          transform: "rotate(-26deg)",
          bgcolor: "rgba(167, 139, 250, 0.18)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            minHeight: { xs: "calc(100vh - 64px)", md: "calc(100vh - 96px)" },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 520,
              p: { xs: 2, sm: 2.5, md: 3 },
              borderRadius: 8,
              border: "1px solid rgba(91, 58, 195, 0.12)",
              bgcolor: "rgba(40, 35, 77, 0.96)",
              boxShadow: "0 30px 80px rgba(55, 35, 122, 0.24)",
            }}
          >
            <Box
              sx={{
                borderRadius: 6,
                p: { xs: 2.5, md: 3.5 },
                bgcolor: "#2f2b57",
              }}
            >
              <LoginForm onAuthenticated={onAuthenticated} />
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

type DecorativeShapeProps = {
  sx: Record<string, unknown>;
};

function DecorativeShape({ sx }: DecorativeShapeProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        borderRadius: "36px",
        filter: "blur(2px)",
        ...sx,
      }}
    />
  );
}
