/** App-wide constants. No secrets here (see env.ts), and safe to import from client or server. */

export const APP_NAME = "SG Match";

export const ROUTES = {
  home: "/",
  auth: "/auth",
  signIn: "/auth?mode=sign-in",
  signUp: "/auth?mode=sign-up",
} as const;

// Sidebar navigation. `href: null` marks a feature that isn't built yet (shown disabled).
export const APP_NAV = [
  { key: "dashboard", title: "Dashboard", href: ROUTES.home },
  { key: "matches", title: "Matches", href: null },
  { key: "groups", title: "Study groups", href: null },
  { key: "guide", title: "Study guide", href: null },
] as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
export const API_TIMEOUT_MS = 30_000;

export const API_ENDPOINTS = {
  auth: {
    me: "/auth/me",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    signOut: "/auth/sign-out",
  },
} as const;

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE = "Network error. Check your connection and try again.";
export const TIMEOUT_ERROR_MESSAGE = "The request timed out. Please try again.";

export const QUERY_STALE_TIME_MS = 60_000;
export const QUERY_MAX_RETRIES = 2;


export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export const SIGN_IN_SERVER_FIELDS = ["email", "password"] as const;
export const SIGN_UP_SERVER_FIELDS = ["name", "email", "password"] as const;

export const IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1";

export const FIREBASE_AUTH_ERRORS: Record<
  string,
  { status: number; message: string; field?: string }
> = {
  EMAIL_EXISTS: {
    status: 409,
    message: "An account with this email already exists",
    field: "email",
  },
  INVALID_LOGIN_CREDENTIALS: { status: 401, message: "Incorrect email or password" },
  INVALID_PASSWORD: { status: 401, message: "Incorrect email or password" },
  EMAIL_NOT_FOUND: { status: 401, message: "Incorrect email or password" },
  USER_DISABLED: { status: 403, message: "This account has been disabled" },
  TOO_MANY_ATTEMPTS_TRY_LATER: {
    status: 429,
    message: "Too many attempts. Please try again later",
  },
  WEAK_PASSWORD: {
    status: 400,
    message: "Password is too weak",
    field: "password",
  },
};
