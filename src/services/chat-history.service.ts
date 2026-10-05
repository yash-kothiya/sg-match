import "server-only";

import { CHAT_HISTORY_TURNS, CHAT_MAX_MESSAGES_PER_SESSION } from "@/config/constants";
import { ApiError } from "@/lib/api/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Citation } from "./rag.service";

/*
 * Firestore layout (keyed by the Firebase uid, which is what firestore.rules compare against):
 *   users/{uid}/chatSessions/{sessionId}                 { title, createdAt, updatedAt }
 *   users/{uid}/chatSessions/{sessionId}/messages/{id}   { role, text, citations, grounded, error?, at }
 * Only the server writes. The browser reads its own history directly (see firestore.rules).
 */

export type StoredMessage = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  grounded?: boolean;
  error?: string;
};

const sessions = (uid: string) => getAdminDb().collection("users").doc(uid).collection("chatSessions");

const titleFrom = (message: string) => (message.length > 60 ? `${message.slice(0, 57).trimEnd()}…` : message);

/** Returns the session id, creating the session on the first message. */
export async function ensureSession(uid: string, sessionId: string | undefined, firstMessage: string): Promise<string> {
  if (sessionId) {
    const snapshot = await sessions(uid).doc(sessionId).get();
    if (!snapshot.exists) throw new ApiError(404, "Conversation not found");
    return sessionId;
  }
  const now = new Date();
  const ref = await sessions(uid).add({ title: titleFrom(firstMessage), createdAt: now, updatedAt: now });
  return ref.id;
}

export async function addMessage(uid: string, sessionId: string, message: StoredMessage): Promise<void> {
  const session = sessions(uid).doc(sessionId);
  const now = new Date();
  await session.collection("messages").add({
    role: message.role,
    text: message.text,
    citations: message.citations ?? [],
    grounded: message.grounded ?? null,
    error: message.error ?? null,
    at: now,
  });
  await session.update({ updatedAt: now });
}

export async function assertRoomForMessage(uid: string, sessionId: string): Promise<void> {
  const count = await sessions(uid).doc(sessionId).collection("messages").count().get();
  if (count.data().count >= CHAT_MAX_MESSAGES_PER_SESSION) {
    throw new ApiError(409, "This conversation is full. Start a new one.");
  }
}

/** The most recent user questions in a session (oldest first), for resolving short follow-ups. */
export async function recentQuestions(uid: string, sessionId: string): Promise<string[]> {
  const snapshot = await sessions(uid)
    .doc(sessionId)
    .collection("messages")
    .orderBy("at", "desc")
    .limit(CHAT_HISTORY_TURNS * 2)
    .get();
  return snapshot.docs
    .map((doc) => doc.data() as { role: string; text: string })
    .filter((message) => message.role === "user")
    .map((message) => message.text)
    .reverse();
}

export async function deleteSession(uid: string, sessionId: string): Promise<void> {
  const ref = sessions(uid).doc(sessionId);
  if (!(await ref.get()).exists) throw new ApiError(404, "Conversation not found");
  await getAdminDb().recursiveDelete(ref); // removes the messages subcollection too
}
