import "server-only";

import { FIREBASE_AUTH_ERRORS, IDENTITY_TOOLKIT_URL } from "@/config/constants";
import { requireEnv } from "@/config/env";
import { ApiError } from "@/lib/api/errors";

type PasswordAuthResponse = {
  idToken: string;
  localId: string;
  email: string;
};

async function call(
  endpoint: "accounts:signUp" | "accounts:signInWithPassword",
  email: string,
  password: string,
): Promise<PasswordAuthResponse> {
  const response = await fetch(`${IDENTITY_TOOLKIT_URL}/${endpoint}?key=${requireEnv("FIREBASE_WEB_API_KEY")}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    cache: "no-store",
  });

  if (response.ok) return (await response.json()) as PasswordAuthResponse;

  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  // Codes can carry a suffix, e.g. "WEAK_PASSWORD : Password should be at least 6 characters".
  const code = body?.error?.message?.split(" ")[0] ?? "";
  const mapped = FIREBASE_AUTH_ERRORS[code];

  if (mapped) {
    throw new ApiError(
      mapped.status,
      mapped.message,
      mapped.field ? { [mapped.field]: mapped.message } : undefined,
    );
  }

  console.error("Firebase Identity Toolkit error:", code || response.status);
  throw new ApiError(502, "Authentication service is unavailable. Please try again.");
}

export const signUpWithPassword = (email: string, password: string) =>
  call("accounts:signUp", email, password);

export const signInWithPassword = (email: string, password: string) =>
  call("accounts:signInWithPassword", email, password);
