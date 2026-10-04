import { handleRoute } from "@/lib/api/errors";
import { requireUser } from "@/services/auth.service";
import { leaveGroup } from "@/services/groups.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await leaveGroup(user.id, id);
  return Response.json({ ok: true });
});
