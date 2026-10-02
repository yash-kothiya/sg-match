import { handleRoute } from "@/lib/api/errors";
import { requireUser } from "@/services/auth.service";
import { cancelJoinRequest, requestToJoin } from "@/services/groups.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await requestToJoin(user.id, id);
  return Response.json({ status: "pending" });
});

export const DELETE = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await cancelJoinRequest(user.id, id);
  return Response.json({ status: "none" });
});
