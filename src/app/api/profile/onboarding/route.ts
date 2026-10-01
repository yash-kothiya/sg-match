import { handleRoute, parseJson } from "@/lib/api/errors";
import { requireUser, toAuthUser } from "@/services/auth.service";
import { saveProfile } from "@/services/profile.service";
import { onboardingSchema } from "@/schemas/profile";

export const POST = handleRoute(async (request) => {
  const current = await requireUser();
  const input = onboardingSchema.parse(await parseJson(request));

  const updated = await saveProfile(current.id, input, { markOnboarded: true });

  return Response.json({ user: toAuthUser(updated) });
});
