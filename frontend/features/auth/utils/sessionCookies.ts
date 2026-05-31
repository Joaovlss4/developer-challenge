import { SESSION_COOKIE_KEY } from "@/features/auth/constants/session";

const COOKIE_MAX_AGE_SECONDS = 60 * 60;

type SessionCookieOptions = {
  httpOnly: boolean;
  maxAge: number;
  path: string;
  sameSite: "strict";
  secure: boolean;
};

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isProductionEnvironment(),
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  };
}

export function getExpiredSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isProductionEnvironment(),
    maxAge: 0,
    path: "/",
  };
}

export function clearSessionCookies(
  cookieStore: {
    set: (name: string, value: string, options: SessionCookieOptions) => void;
  },
) {
  const expiredOptions = getExpiredSessionCookieOptions();
  cookieStore.set(SESSION_COOKIE_KEY, "", expiredOptions);
}
