import { handleRoute } from "@/lib/api/errors";
import { requireUser } from "@/services/auth.service";
import { deleteSession } from "@/services/chat-history.service";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handleRoute<Ctx>(async (_request, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteSession(user.firebaseUid, id);
  return Response.json({ ok: true });
});
