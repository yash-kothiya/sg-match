import { CHAT_GLOBAL_RATE_LIMIT, CHAT_USER_RATE_LIMIT } from "@/config/constants";
import { handleRoute, parseJson } from "@/lib/api/errors";
import { chatRequestSchema, type ChatResponse } from "@/schemas/chat";
import { getFirebaseUid, requireUser } from "@/services/auth.service";
import { addMessage, assertRoomForMessage, ensureSession, recentQuestions } from "@/services/chat-history.service";
import { answerQuestion, ChatError, toChatError } from "@/services/rag.service";
import { checkChatLimits } from "@/services/rate-limit.service";

const errorResponse = (error: ChatError) =>
  Response.json({ error: { message: error.message, code: error.code } }, { status: error.status });

/** Short follow-ups like "why?" retrieve badly alone, so search with the previous question as well. */
const retrievalQueryFor = (message: string, previous: string | undefined) =>
  previous && message.split(/\s+/).length <= 4 ? `${previous} ${message}` : message;

export const POST = handleRoute(async (request) => {
  const user = await requireUser();
  const { sessionId: requestedSession, message } = chatRequestSchema.parse(await parseJson(request));

  const limited = await checkChatLimits(user.id, { user: CHAT_USER_RATE_LIMIT, global: CHAT_GLOBAL_RATE_LIMIT });
  if (limited === "user") return errorResponse(new ChatError("RATE_LIMITED", 429, "Slow down a little. Try again in a few seconds."));
  if (limited === "global") return errorResponse(new ChatError("RATE_LIMITED", 429, "The study guide is busy right now. Try again in a minute."));

  // History is saved on a best-effort basis: if Firestore isn't reachable the answer is still returned.
  let uid: string | null = null;
  let sessionId = requestedSession ?? "";
  let previous: string | undefined;
  let historySaved = true;
  try {
    uid = await getFirebaseUid(user.id);
    sessionId = await ensureSession(uid, requestedSession, message);
    await assertRoomForMessage(uid, sessionId);
    previous = (await recentQuestions(uid, sessionId)).at(-1);
    await addMessage(uid, sessionId, { role: "user", text: message }); // saved first, so a failure never loses the question
  } catch (error) {
    // A missing or full conversation is the caller's problem; anything else is just "history unavailable".
    if (requestedSession && error instanceof Error && "status" in error) throw error;
    console.error("Chat history unavailable:", error);
    historySaved = false;
    uid = null;
  }

  let result;
  try {
    result = await answerQuestion(message, retrievalQueryFor(message, previous));
  } catch (error) {
    const chatError = toChatError(error);
    if (uid) {
      await addMessage(uid, sessionId, { role: "assistant", text: chatError.message, error: chatError.code }).catch(() => undefined);
    }
    return errorResponse(chatError);
  }

  if (uid) {
    try {
      await addMessage(uid, sessionId, { role: "assistant", text: result.answer, citations: result.citations, grounded: result.grounded });
    } catch (error) {
      console.error("Saving the answer failed:", error);
      historySaved = false;
    }
  }

  const body: ChatResponse = { sessionId, historySaved, ...result };
  return Response.json(body);
});
