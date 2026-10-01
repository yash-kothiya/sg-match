import { handleRoute, parseJson } from "@/lib/api/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import { signInWithPassword } from "@/services/identity-toolkit.service";
import { createSession, ensureUserProfile } from "@/services/auth.service";
import { signInSchema } from "@/schemas/auth";

export const POST = handleRoute(async (request) => {
  const { email, password } = signInSchema.parse(await parseJson(request));

  const credential = await signInWithPassword(email, password);
  const firebaseUser = await getAdminAuth().getUser(credential.localId);

  const user = await ensureUserProfile({
    firebaseUid: credential.localId,
    email: credential.email,
    name: firebaseUser.displayName ?? credential.email.split("@")[0],
  });
  await createSession(credential.idToken);

  return Response.json({ user });
});
