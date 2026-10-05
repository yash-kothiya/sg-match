import { z } from "zod";
import { CHAT_MAX_MESSAGE_LENGTH } from "@/config/constants";

export const chatRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(128).optional(),
  message: z
    .string()
    .trim()
    .min(1, "Type a question")
    .max(CHAT_MAX_MESSAGE_LENGTH, `Keep it under ${CHAT_MAX_MESSAGE_LENGTH} characters`),
});

export type Citation = { documentTitle: string; heading: string; snippet: string; score: number };

export type ChatResponse = {
  sessionId: string;
  answer: string;
  /** false when the guide couldn't answer from its knowledge base. */
  grounded: boolean;
  citations: Citation[];
  /** false if the conversation couldn't be saved to Firestore (the answer is still valid). */
  historySaved: boolean;
};

/** What the browser reads from Firestore. */
export type ChatSessionItem = { id: string; title: string; updatedAt: Date | null };
export type ChatMessageItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations: Citation[];
  grounded: boolean | null;
  error: string | null;
};
