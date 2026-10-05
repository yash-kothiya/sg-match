import "server-only";

import { CHAT_MAX_OUTPUT_TOKENS, CHAT_TIMEOUT_MS, EMBEDDING_DIMENSIONS } from "@/config/constants";
import { env, requireEnv } from "@/config/env";
import { parseModelList } from "@/lib/ai/script-config";
import { embedQuery, GeminiError, generateJson, type GeminiConfig } from "@/lib/ai/gemini";
import { RESPONSE_JSON_SCHEMA, SYSTEM_INSTRUCTION } from "@/lib/ai/prompt";

export { GeminiError };

/** Reads the key and model ids at call time, so a missing value fails with a clear message, not at build time. */
export function geminiConfig(): GeminiConfig {
  try {
    return {
      apiKey: requireEnv("GEMINI_API_KEY"),
      chatModel: requireEnv("GEMINI_CHAT_MODEL"),
      embeddingModel: requireEnv("GEMINI_EMBEDDING_MODEL"),
      chatFallbackModels: parseModelList(env.GEMINI_CHAT_FALLBACK_MODELS),
      dimensions: EMBEDDING_DIMENSIONS,
    };
  } catch (error) {
    throw new GeminiError("CONFIG", (error as Error).message);
  }
}

export const embedQuestion = (question: string) => embedQuery(geminiConfig(), question, CHAT_TIMEOUT_MS);

export const askModel = (userTurn: string) =>
  generateJson(
    geminiConfig(),
    { system: SYSTEM_INSTRUCTION, user: userTurn, schema: RESPONSE_JSON_SCHEMA, maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS },
    CHAT_TIMEOUT_MS,
  );
