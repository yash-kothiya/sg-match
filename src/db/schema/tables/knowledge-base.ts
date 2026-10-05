import { index, integer, pgTable, primaryKey, text, timestamp, unique, vector } from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from "@/config/constants";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";

/** One markdown file in `src/kb`. */
export const kbDocuments = pgTable("kb_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("kbd")),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  ...timestamps,
});

/** One embedded passage (normally one section of a document). */
export const kbChunks = pgTable(
  "kb_chunks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("kbc")),
    documentId: text("document_id")
      .notNull()
      .references(() => kbDocuments.id, { onDelete: "cascade" }),
    heading: text("heading").notNull(),
    content: text("content").notNull(),
    position: integer("position").notNull(),
    tokenCount: integer("token_count").notNull(),
    /** sha-256 of heading + content + embedding model + dimensions: unchanged chunks are never re-embedded. */
    contentHash: text("content_hash").notNull(),
    embeddingModel: text("embedding_model").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  },
  (t) => [
    unique("kb_chunks_document_hash_uq").on(t.documentId, t.contentHash),
    index("kb_chunks_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

/** Embeddings of questions we've already seen, so repeated or suggested questions cost no embedding call. */
export const aiQueryCache = pgTable("ai_query_cache", {
  queryHash: text("query_hash").primaryKey(),
  embeddingModel: text("embedding_model").notNull(),
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
});

/** Per-minute counters for rate limiting. Postgres-backed because serverless instances don't share memory. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    key: text("key").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.key] })],
);

export type KbChunk = typeof kbChunks.$inferSelect;
