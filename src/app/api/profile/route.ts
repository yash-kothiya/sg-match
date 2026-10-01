import { handleRoute, parseJson } from "@/lib/api/errors";
import { requireUser } from "@/services/auth.service";
import { getProfile, saveProfile } from "@/services/profile.service";
import { profileSchema } from "@/schemas/profile";

export const GET = handleRoute(async () => {
  const user = await requireUser();
  return Response.json({ profile: await getProfile(user.id) });
});

export const PATCH = handleRoute(async (request) => {
  const user = await requireUser();
  const input = profileSchema.parse(await parseJson(request));

  await saveProfile(user.id, input);

  return Response.json({ profile: await getProfile(user.id) });
});
