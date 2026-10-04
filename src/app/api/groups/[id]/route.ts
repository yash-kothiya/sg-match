import { handleRoute, parseJson } from "@/lib/api/errors";
import { groupSchema } from "@/schemas/groups";
import { requireUser } from "@/services/auth.service";
import { deleteGroup, getGroup, updateGroup } from "@/services/groups.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return Response.json({ group: await getGroup(user.id, id) });
});

export const PATCH = handleRoute<Ctx>(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await updateGroup(user.id, id, groupSchema.parse(await parseJson(request)));
  return Response.json({ group: await getGroup(user.id, id) });
});

export const DELETE = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteGroup(user.id, id);
  return Response.json({ ok: true });
});
