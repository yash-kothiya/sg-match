import { handleRoute } from "@/lib/api/errors";
import { matchesQuerySchema } from "@/schemas/matching";
import { requireUser } from "@/services/auth.service";
import { getMatches } from "@/services/matches.service";

export const GET = handleRoute(async (request) => {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const { requestId, limit } = matchesQuerySchema.parse({
    requestId: searchParams.get("requestId") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  });

  return Response.json(await getMatches(user.id, requestId, limit));
});
