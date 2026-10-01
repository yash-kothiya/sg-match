import { handleRoute, parseJson } from "@/lib/api/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import { signUpWithPassword } from "@/services/identity-toolkit.service";
import { createSession, ensureUserProfile } from "@/services/auth.service";
import { signUpRequestSchema } from "@/schemas/auth";

export const POST = handleRoute(async (request) => {
  const { name, email, password } = signUpRequestSchema.parse(await parseJson(request));

  const credential = await signUpWithPassword(email, password);
  await getAdminAuth().updateUser(credential.localId, { displayName: name });

  const user = await ensureUserProfile({
    firebaseUid: credential.localId,
    email: credential.email,
    name,
  });
  await createSession(credential.idToken);

  return Response.json({ user }, { status: 201 });
});
