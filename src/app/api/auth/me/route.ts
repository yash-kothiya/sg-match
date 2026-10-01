import { handleRoute } from "@/lib/api/errors";
import { requireUser } from "@/lib/auth/session";

export const GET = handleRoute(async () => {
  const user = await requireUser();
  return Response.json({ user });
});
