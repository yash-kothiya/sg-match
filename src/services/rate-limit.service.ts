import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";

const MINUTE_MS = 60_000;

/** Adds one to a per-minute counter and says whether the caller is still within `limit`. */
async function hit(scope: string, limit: number): Promise<boolean> {
  const key = `${scope}:${Math.floor(Date.now() / MINUTE_MS)}`;
  const [row] = await db
    .insert(aiUsage)
    .values({ key, count: 1 })
    .onConflictDoUpdate({ target: aiUsage.key, set: { count: sql`${aiUsage.count} + 1`, updatedAt: sql`now()` } })
    .returning({ count: aiUsage.count });
  return row.count <= limit;
}

/**
 * Per-user first, then the global cap that protects the shared free-tier quota. Counters live in
 * Postgres because serverless instances don't share memory, so an in-memory limiter wouldn't hold.
 */
export async function checkChatLimits(userId: string, limits: { user: number; global: number }) {
  if (!(await hit(`user:${userId}`, limits.user))) return "user" as const;
  if (!(await hit("global", limits.global))) return "global" as const;
  return null;
}
