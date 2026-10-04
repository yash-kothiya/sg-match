import { handleRoute, parseJson } from "@/lib/api/errors";
import { groupSchema, groupsQuerySchema } from "@/schemas/groups";
import { requireUser } from "@/services/auth.service";
import { createGroup, listGroups } from "@/services/groups.service";

export const GET = handleRoute(async (request) => {
  const user = await requireUser();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = groupsQuerySchema.parse(params);
  return Response.json({ groups: await listGroups(user.id, query) });
});

export const POST = handleRoute(async (request) => {
  const user = await requireUser();
  const input = groupSchema.parse(await parseJson(request));
  return Response.json({ id: await createGroup(user.id, input) }, { status: 201 });
});
