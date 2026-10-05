import { requireEnv } from "@/config/env";
import { handleRoute } from "@/lib/api/errors";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getFirebaseUid, requireUser } from "@/services/auth.service";

/**
 * Lets the signed-in browser sign in to Firebase too, so it can READ its own chat history straight from
 * Firestore (where firestore.rules protect it). The browser never gets write access to those paths.
 * The web API key is public by design (it only identifies the project), so it's safe to return here.
 */
export const GET = handleRoute(async () => {
  const user = await requireUser();
  const uid = await getFirebaseUid(user.id);
  const projectId = requireEnv("FIREBASE_PROJECT_ID");

  return Response.json({
    uid,
    token: await getAdminAuth().createCustomToken(uid),
    config: {
      apiKey: requireEnv("FIREBASE_WEB_API_KEY"),
      projectId,
      authDomain: `${projectId}.firebaseapp.com`,
    },
  });
});
