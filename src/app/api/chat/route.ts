import { CHAT_GLOBAL_RATE_LIMIT, CHAT_USER_RATE_LIMIT } from "@/config/constants";
import { after } from "next/server";
import { ApiError, handleRoute, parseJson } from "@/lib/api/errors";
import { chatRequestSchema, type ChatResponse } from "@/schemas/chat";
import { requireUser } from "@/services/auth.service";
import { recentQuestions, saveAnswer, saveQuestion } from "@/services/chat-history.service";
import { answerQuestion, ChatError, toChatError } from "@/services/rag.service";
import { checkChatLimits } from "@/services/rate-limit.service";

const errorResponse = (error: ChatError) =>
  Response.json({ error: { message: error.message, code: error.code } }, { status: error.status });

const isShortFollowUp = (message: string) => message.split(/\s+/).length <= 4;

/** Short follow-ups like "why?" mean nothing alone, so both retrieval and the model get the previous question too. */
const questionFor = (message: string, previous: string | undefined) =>
  previous ? `${message} (follow-up to: "${previous}")` : message;

export const POST = handleRoute(async (request) => {
  const user = await requireUser();
  const { sessionId: requestedSession, message } = chatRequestSchema.parse(await parseJson(request));

  const limited = await checkChatLimits(user.id, { user: CHAT_USER_RATE_LIMIT, global: CHAT_GLOBAL_RATE_LIMIT });
  if (limited === "user") return errorResponse(new ChatError("RATE_LIMITED", 429, "Slow down a little. Try again in a few seconds."));
  if (limited === "global") return errorResponse(new ChatError("RATE_LIMITED", 429, "The study guide is busy right now. Try again in a minute."));

  const uid = user.firebaseUid;

  // The only history read the answer waits for: short follow-ups need the previous question to retrieve well.
  let previous: string | undefined;
  if (requestedSession && isShortFollowUp(message)) {
    previous = (await recentQuestions(uid, requestedSession).catch(() => [])).at(-1);
  }

  // Save the question while the answer is worked out. Both settle to values, so neither can reject unhandled.
  // ponytail: a missing/full conversation is only reported after answering (one wasted model call in that rare case).
  const [saved, answered] = await Promise.all([
    saveQuestion(uid, requestedSession, message).then(
      (sessionId) => ({ sessionId }),
      (error: unknown) => ({ error }),
    ),
    answerQuestion(questionFor(message, previous)).then(
      (result) => ({ result }),
      (error: unknown) => ({ error: toChatError(error) }),
    ),
  ]);

  // History is best-effort: if Firestore isn't reachable the answer is still returned.
  let sessionId: string | null = null;
  if ("error" in saved) {
    // A missing or full conversation is the caller's problem; anything else is just "history unavailable".
    if (requestedSession && saved.error instanceof ApiError) throw saved.error;
    console.error("Chat history unavailable:", saved.error);
  } else {
    sessionId = saved.sessionId;
  }

  if (sessionId) {
    const savedSession = sessionId;
    const reply =
      "error" in answered
        ? { text: answered.error.message, error: answered.error.code }
        : { text: answered.result.answer, citations: answered.result.citations, grounded: answered.result.grounded };
    // The browser shows the answer from this response, so saving it doesn't need to delay it.
    after(() => saveAnswer(uid, savedSession, reply).catch((error) => console.error("Saving the answer failed:", error)));
  }

  if ("error" in answered) return errorResponse(answered.error);
  const body: ChatResponse = { sessionId: sessionId ?? "", historySaved: sessionId !== null, ...answered.result };
  return Response.json(body);
});
