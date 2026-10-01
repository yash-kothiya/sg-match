import { handleRoute } from "@/lib/api/errors";
import { requireUser } from "@/services/auth.service";
import { listSkills } from "@/services/skills.service";

export const GET = handleRoute(async () => {
  await requireUser();
  return Response.json({ skills: await listSkills() });
});
