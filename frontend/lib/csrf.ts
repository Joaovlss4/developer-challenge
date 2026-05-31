import { NextResponse } from "next/server";

// Internal authenticated routes should reject cross-site mutations by validating
// Origin/Referer before trusting cookie-based authentication state.
function getRequestOrigin(request: Request) {
  return new URL(request.url).origin;
}

function isTrustedUrl(url: string, trustedOrigin: string) {
  try {
    return new URL(url).origin === trustedOrigin;
  } catch {
    return false;
  }
}

export function ensureTrustedOrigin(request: Request) {
  const trustedOrigin = getRequestOrigin(request);
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  if (originHeader && !isTrustedUrl(originHeader, trustedOrigin)) {
    return NextResponse.json(
      {
        message: "A origem da requisição não é confiável.",
      },
      { status: 403 },
    );
  }

  if (!originHeader && refererHeader && !isTrustedUrl(refererHeader, trustedOrigin)) {
    return NextResponse.json(
      {
        message: "A origem da requisição não é confiável.",
      },
      { status: 403 },
    );
  }

  return null;
}
