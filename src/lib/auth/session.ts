import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/config/constants";
import { env } from "@/config/env";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { AuthUser } from "@/schemas/auth";

/** Exchanges a fresh Firebase ID token for an httpOnly session cookie. */
export async function createSession(idToken: string) {
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  (await cookies()).set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Creates the SQL profile on first login; returns the existing one otherwise. */
export async function ensureUserProfile(input: {
  firebaseUid: string;
  email: string;
  name: string;
}): Promise<AuthUser> {
  await db.insert(users).values(input).onConflictDoNothing({ target: users.firebaseUid });

  const [user] = await db.select().from(users).where(eq(users.firebaseUid, input.firebaseUid));
  if (!user) throw new ApiError(500, "Could not load user profile");

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Verifies the session cookie and returns the SQL user, or null if signed out. Memoized per request. */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
    if (!user) return null;

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
});

/** For route handlers: throws 401 unless the caller is authenticated. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "You must be signed in");
  return user;
}
