import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { EMBEDDING_DIMENSIONS } from "@/config/constants";
import { chunkDocument, embeddingText, parseDocument } from "@/lib/ai/chunker";
import { embedDocuments, GeminiError } from "@/lib/ai/gemini";
import { chunkHash } from "@/lib/ai/hash";
import { scriptGeminiConfig } from "@/lib/ai/script-config";
import { createSeedDb } from "./_client";

const KB_DIR = path.resolve(process.cwd(), "src", "kb");
const BATCH_SIZE = 5;
const PAUSE_BETWEEN_BATCHES_MS = 1500; // stay well inside the free-tier requests-per-minute limit

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loads src/kb/*.md into Postgres. Idempotent and resumable: a chunk is embedded only if its
 * hash (text + model + dimensions) isn't stored yet, and chunks that no longer exist are removed
 * at the end. If the API quota runs out half-way, run it again to finish the rest.
 */
export async function seed() {
  const config = scriptGeminiConfig();
  const files = readdirSync(KB_DIR).filter((file) => file.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No knowledge-base files found in ${KB_DIR}`);

  const { db, schema, close } = createSeedDb();
  let embedded = 0;
  let skipped = 0;
  let totalChunks = 0;

  try {
    for (const file of files) {
      const doc = parseDocument(readFileSync(path.join(KB_DIR, file), "utf8"));
      const chunks = chunkDocument(doc).map((chunk) => ({
        ...chunk,
        hash: chunkHash({ heading: chunk.heading, content: chunk.content, model: config.embeddingModel, dimensions: EMBEDDING_DIMENSIONS }),
      }));
      totalChunks += chunks.length;

      const [document] = await db
        .insert(schema.kbDocuments)
        .values({ slug: doc.slug, title: doc.title })
        .onConflictDoUpdate({ target: schema.kbDocuments.slug, set: { title: doc.title } })
        .returning({ id: schema.kbDocuments.id });

      const stored = await db
        .select({ hash: schema.kbChunks.contentHash })
        .from(schema.kbChunks)
        .where(eq(schema.kbChunks.documentId, document.id));
      const have = new Set(stored.map((row) => row.hash));

      // Keep positions and headings current for chunks we already have.
      for (const chunk of chunks.filter((c) => have.has(c.hash))) {
        await db
          .update(schema.kbChunks)
          .set({ position: chunk.position, heading: chunk.heading, tokenCount: chunk.tokenCount })
          .where(and(eq(schema.kbChunks.documentId, document.id), eq(schema.kbChunks.contentHash, chunk.hash)));
        skipped += 1;
      }

      const todo = chunks.filter((chunk) => !have.has(chunk.hash));
      for (let i = 0; i < todo.length; i += BATCH_SIZE) {
        const batch = todo.slice(i, i + BATCH_SIZE);
        const vectors = await embedDocuments(config, batch.map((chunk) => ({ title: doc.title, text: embeddingText(doc.title, chunk) })));
        await db.insert(schema.kbChunks).values(
          batch.map((chunk, index) => ({
            documentId: document.id,
            heading: chunk.heading,
            content: chunk.content,
            position: chunk.position,
            tokenCount: chunk.tokenCount,
            contentHash: chunk.hash,
            embeddingModel: config.embeddingModel,
            embedding: vectors[index],
          })),
        ).onConflictDoUpdate({
          target: [schema.kbChunks.documentId, schema.kbChunks.contentHash],
          set: { embedding: sql`excluded.embedding`, position: sql`excluded.position` },
        });
        embedded += batch.length;
        if (i + BATCH_SIZE < todo.length) await sleep(PAUSE_BETWEEN_BATCHES_MS);
      }

      // Remove chunks whose text is gone, but only after the new ones are safely stored.
      await db
        .delete(schema.kbChunks)
        .where(and(eq(schema.kbChunks.documentId, document.id), notInArray(schema.kbChunks.contentHash, chunks.map((c) => c.hash))));
      console.log(`  ${doc.slug}: ${chunks.length} chunks`);
    }

    // Documents whose file was removed.
    const slugs = files.map((file) => parseDocument(readFileSync(path.join(KB_DIR, file), "utf8")).slug);
    await db.delete(schema.kbDocuments).where(notInArray(schema.kbDocuments.slug, slugs));

    console.log(`Knowledge base: ${files.length} documents, ${totalChunks} chunks (${embedded} embedded now, ${skipped} unchanged)`);
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error(`Stopped by the Gemini API (${error.code}): ${error.message}\nRun the same command again to continue from where it stopped.`);
    }
    throw error;
  } finally {
    await close();
  }
}
