import { handleRoute, parseJson } from "@/lib/api/errors";
import { memberDecisionSchema } from "@/schemas/groups";
import { requireUser } from "@/services/auth.service";
import { decideRequest, removeMember } from "@/services/groups.service";

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** Owner accepts or rejects a pending join request. */
export const PATCH = handleRoute<Ctx>(async (request, { params }) => {
  const owner = await requireUser();
  const { id, userId } = await params;
  const { status } = memberDecisionSchema.parse(await parseJson(request));
  await decideRequest(owner.id, id, userId, status);
  return Response.json({ ok: true });
});

/** Owner removes a member. */
export const DELETE = handleRoute<Ctx>(async (_request, { params }) => {
  const owner = await requireUser();
  const { id, userId } = await params;
  await removeMember(owner.id, id, userId);
  return Response.json({ ok: true });
});
