import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/features/auth/utils/sessionCookies";
import { ensureTrustedOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrfErrorResponse = ensureTrustedOrigin(request);

  if (csrfErrorResponse) {
    return csrfErrorResponse;
  }

  const response = NextResponse.json({ data: { success: true } });
  clearSessionCookies(response.cookies);

  return response;
}
