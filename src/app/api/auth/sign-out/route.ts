import { handleRoute } from "@/lib/api/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/config/constants";
import { clearSession } from "@/lib/auth/session";
import { cookies } from "next/headers";

export const POST = handleRoute(async () => {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;

  if (sessionCookie) {
    // Revoke refresh tokens so the cookie can't be replayed after sign-out.
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
      await getAdminAuth().revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie already invalid/expired — nothing to revoke.
    }
  }

  await clearSession();
  return Response.json({ ok: true });
});
