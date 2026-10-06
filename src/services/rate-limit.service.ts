import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";

const MINUTE_MS = 60_000;

/**
 * Per-user and global per-minute counters (the global cap protects the shared free-tier quota), bumped in one
 * round trip. Counters live in Postgres because serverless instances don't share memory, so an in-memory
 * limiter wouldn't hold.
 */
export async function checkChatLimits(userId: string, limits: { user: number; global: number }) {
  const minute = Math.floor(Date.now() / MINUTE_MS);
  const userKey = `user:${userId}:${minute}`;
  const rows = await db
    .insert(aiUsage)
    .values([{ key: userKey, count: 1 }, { key: `global:${minute}`, count: 1 }])
    .onConflictDoUpdate({ target: aiUsage.key, set: { count: sql`${aiUsage.count} + 1`, updatedAt: sql`now()` } })
    .returning({ key: aiUsage.key, count: aiUsage.count });

  const userCount = rows.find((row) => row.key === userKey)?.count ?? 0;
  const globalCount = rows.find((row) => row.key !== userKey)?.count ?? 0;
  if (userCount > limits.user) return "user" as const;
  if (globalCount > limits.global) return "global" as const;
  return null;
}
