import { EMBEDDING_DIMENSIONS } from "@/config/constants";
import { env } from "@/config/env";
import type { GeminiConfig } from "./gemini";

/** "a, b ,c" -> ["a","b","c"]; ignores quotes and blanks. */
export const parseModelList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((model) => model.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

/** Config for scripts (seeder, ai:check, ai:eval). Throws a readable message listing what's missing. */
export function scriptGeminiConfig(): GeminiConfig {
  const missing = (["GEMINI_API_KEY", "GEMINI_CHAT_MODEL", "GEMINI_EMBEDDING_MODEL"] as const).filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing in .env: ${missing.join(", ")}. See docs/AI_IMPLEMENTATION.md, step 1.`);
  }
  return {
    apiKey: env.GEMINI_API_KEY!,
    chatModel: env.GEMINI_CHAT_MODEL!,
    embeddingModel: env.GEMINI_EMBEDDING_MODEL!,
    chatFallbackModels: parseModelList(env.GEMINI_CHAT_FALLBACK_MODELS),
    dimensions: EMBEDDING_DIMENSIONS,
  };
}
