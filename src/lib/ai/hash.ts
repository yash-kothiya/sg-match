import { createHash } from "node:crypto";

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** Identity of an embedded chunk. Changing the text, model or dimensions changes it, so the chunk is re-embedded. */
export const chunkHash = (input: { heading: string; content: string; model: string; dimensions: number }) =>
  sha256(`${input.model}|${input.dimensions}|${input.heading}\n${input.content}`);

/** Lower-case, trim and collapse whitespace so "How  do I?" and "how do i?" share a cache entry. */
export const normalizeQuestion = (question: string) => question.trim().toLowerCase().replace(/\s+/g, " ");

export const queryHash = (question: string, model: string, dimensions: number) =>
  sha256(`${model}|${dimensions}|${normalizeQuestion(question)}`);
