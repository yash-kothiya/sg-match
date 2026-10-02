import { handleRoute, parseJson } from "@/lib/api/errors";
import { studyRequestSchema } from "@/schemas/profile";
import { requireUser } from "@/services/auth.service";
import { listRequests } from "@/services/matches.service";
import { createRequest } from "@/services/requests.service";

export const GET = handleRoute(async () => {
  const user = await requireUser();
  return Response.json({ requests: await listRequests(user.id) });
});

export const POST = handleRoute(async (request) => {
  const user = await requireUser();
  const input = studyRequestSchema.parse(await parseJson(request));
  const id = await createRequest(user.id, input);
  return Response.json({ id }, { status: 201 });
});
