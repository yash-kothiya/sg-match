import "server-only";

import { eq, sql } from "drizzle-orm";
import { after } from "next/server";
import {
  EMBEDDING_DIMENSIONS,
  RAG_MAX_CHUNKS,
  RAG_MIN_SIMILARITY,
  RAG_TOP_K,
  REFUSAL_TEXT,
} from "@/config/constants";
import { requireEnv } from "@/config/env";
import { db } from "@/db";
import { aiQueryCache, kbChunks } from "@/db/schema";
import { queryHash } from "@/lib/ai/hash";
import { buildUserTurn, ModelOutputError, parseModelOutput } from "@/lib/ai/prompt";
import { askModel, embedQuestion, GeminiError } from "./gemini.service";

export type Citation = { documentTitle: string; heading: string; snippet: string; score: number };
export type Answer = { answer: string; grounded: boolean; citations: Citation[] };

export type ChatErrorCode = "RATE_LIMITED" | "QUOTA_EXCEEDED" | "LLM_UNAVAILABLE" | "TIMEOUT" | "KB_EMPTY";

/** A failure the UI knows how to explain. `status` is the HTTP status to return. */
export class ChatError extends Error {
  constructor(
    public code: ChatErrorCode,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Turns anything that goes wrong while calling Gemini into an error the user can understand. */
export function toChatError(error: unknown): ChatError {
  if (error instanceof ChatError) return error;
  if (error instanceof GeminiError) {
    if (error.code === "QUOTA_EXCEEDED") return new ChatError("QUOTA_EXCEEDED", 503, "The study guide is busy right now. Try again in a minute.");
    if (error.code === "TIMEOUT") return new ChatError("TIMEOUT", 504, "The study guide took too long to answer. Try again.");
    console.error("Gemini error:", error.code, error.message);
    return new ChatError("LLM_UNAVAILABLE", 503, "The study guide is unavailable right now. Your question wasn't lost.");
  }
  if (error instanceof ModelOutputError) return new ChatError("LLM_UNAVAILABLE", 503, "The study guide is unavailable right now. Your question wasn't lost.");
  console.error("Unexpected chat error:", error);
  return new ChatError("LLM_UNAVAILABLE", 503, "The study guide is unavailable right now. Your question wasn't lost.");
}

const vectorLiteral = (vector: number[]) => `[${vector.join(",")}]`;

/** The question's embedding, from the cache when we've seen it before. */
async function questionEmbedding(question: string): Promise<number[]> {
  const model = requireEnv("GEMINI_EMBEDDING_MODEL");
  const hash = queryHash(question, model, EMBEDDING_DIMENSIONS);

  const [cached] = await db.select({ embedding: aiQueryCache.embedding }).from(aiQueryCache).where(eq(aiQueryCache.queryHash, hash));
  if (cached) return cached.embedding;

  const embedding = await embedQuestion(question);
  // Caching doesn't need to delay the answer.
  after(() => db.insert(aiQueryCache).values({ queryHash: hash, embeddingModel: model, embedding }).onConflictDoNothing());
  return embedding;
}

type Retrieved = { documentTitle: string; heading: string; content: string; similarity: number };

/** The closest chunks by cosine similarity (1 = identical direction), best first. */
async function retrieve(question: string): Promise<Retrieved[]> {
  const model = requireEnv("GEMINI_EMBEDDING_MODEL");
  const embedding = await questionEmbedding(question);
  const literal = vectorLiteral(embedding);

  const rows = await db.execute<{ title: string; heading: string; content: string; similarity: number }>(sql`
    select d.title, c.heading, c.content, 1 - (c.embedding <=> ${literal}::vector) as similarity
    from ${kbChunks} c
    join kb_documents d on d.id = c.document_id
    where c.embedding_model = ${model}
    order by c.embedding <=> ${literal}::vector
    limit ${RAG_TOP_K}
  `);

  return rows.map((row) => ({
    documentTitle: row.title,
    heading: row.heading,
    content: row.content,
    similarity: Number(row.similarity),
  }));
}

const refusal = (): Answer => ({ answer: REFUSAL_TEXT, grounded: false, citations: [] });

/**
 * Retrieves, then (only if something relevant was found) asks the model, and checks its reply.
 * Refusals never reach the model, which keeps quota use down and rules out invented answers.
 */
export async function answerQuestion(question: string): Promise<Answer> {
  let found: Retrieved[];
  try {
    found = await retrieve(question);
  } catch (error) {
    throw toChatError(error);
  }
  if (found.length === 0) {
    throw new ChatError("KB_EMPTY", 503, "The study guide isn't set up yet.");
  }

  const relevant = found.filter((chunk) => chunk.similarity >= RAG_MIN_SIMILARITY).slice(0, RAG_MAX_CHUNKS);
  if (relevant.length === 0) return refusal();

  const turn = buildUserTurn(question, relevant);
  let output;
  try {
    // One retry if the model's reply isn't valid JSON for our schema.
    for (let attempt = 0; ; attempt++) {
      try {
        output = parseModelOutput(await askModel(turn), relevant.length);
        break;
      } catch (error) {
        if (error instanceof ModelOutputError && attempt === 0) continue;
        throw error;
      }
    }
  } catch (error) {
    throw toChatError(error);
  }

  if (!output.grounded || output.sources.length === 0) return refusal();

  // Citations come from the passages we actually sent, never from text the model wrote.
  return {
    answer: output.answer,
    grounded: true,
    citations: output.sources.map((n) => {
      const chunk = relevant[n - 1];
      return {
        documentTitle: chunk.documentTitle,
        heading: chunk.heading,
        snippet: chunk.content.length > 220 ? `${chunk.content.slice(0, 220).trimEnd()}…` : chunk.content,
        score: Math.round(chunk.similarity * 100) / 100,
      };
    }),
  };
}

/** Used by the evaluation script: what retrieval alone returns for a question. */
export const retrieveForEval = retrieve;
