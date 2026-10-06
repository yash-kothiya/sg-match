import "server-only";

import { CHAT_HISTORY_TURNS, CHAT_MAX_MESSAGES_PER_SESSION } from "@/config/constants";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError } from "@/lib/api/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Citation } from "./rag.service";

/*
 * Firestore layout (keyed by the Firebase uid, which is what firestore.rules compare against):
 *   users/{uid}/chatSessions/{sessionId}                 { title, createdAt, updatedAt, messageCount }
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

const messageDoc = (message: StoredMessage, at: Date) => ({
  role: message.role,
  text: message.text,
  citations: message.citations ?? [],
  grounded: message.grounded ?? null,
  error: message.error ?? null,
  at,
});

/**
 * Saves the user's question and returns the session id, creating the session on the first message.
 * One batched write (plus one read for an existing session); `messageCount` on the session doc replaces a count query.
 */
export async function saveQuestion(uid: string, sessionId: string | undefined, text: string): Promise<string> {
  const now = new Date();
  const batch = getAdminDb().batch();
  let ref;
  if (sessionId) {
    ref = sessions(uid).doc(sessionId);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "Conversation not found");
    // Sessions created before messageCount existed count as empty.
    if ((snapshot.get("messageCount") ?? 0) >= CHAT_MAX_MESSAGES_PER_SESSION) {
      throw new ApiError(409, "This conversation is full. Start a new one.");
    }
    batch.update(ref, { updatedAt: now, messageCount: FieldValue.increment(1) });
  } else {
    ref = sessions(uid).doc(); // id generated locally, so the session and its first message go in one write
    batch.set(ref, { title: titleFrom(text), createdAt: now, updatedAt: now, messageCount: 1 });
  }
  batch.set(ref.collection("messages").doc(), messageDoc({ role: "user", text }, now));
  await batch.commit();
  return ref.id;
}

/** Saves the assistant's reply (an answer, a refusal or an error) in one batched write. */
export async function saveAnswer(uid: string, sessionId: string, message: Omit<StoredMessage, "role">): Promise<void> {
  const ref = sessions(uid).doc(sessionId);
  const now = new Date();
  await getAdminDb()
    .batch()
    .set(ref.collection("messages").doc(), messageDoc({ role: "assistant", ...message }, now))
    .update(ref, { updatedAt: now, messageCount: FieldValue.increment(1) })
    .commit();
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
