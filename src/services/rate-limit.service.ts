import "server-only";

import { sql } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";

const MINUTE_MS = 60_000;

/**
 * Per-user and global per-minute counters (the global cap protects the shared free-tier quota), in one round
 * trip. The global counter only moves when the user is within their own limit, so one user spamming can't use
 * up everyone's quota. Counters live in Postgres because serverless instances don't share memory.
 */
export async function checkChatLimits(userId: string, limits: { user: number; global: number }) {
  const minute = Math.floor(Date.now() / MINUTE_MS);
  const [row] = await db.execute<{ user_count: number; global_count: number | null }>(sql`
    with u as (
      insert into ai_usage (key, count) values (${`user:${userId}:${minute}`}, 1)
      on conflict (key) do update set count = ai_usage.count + 1, updated_at = now()
      returning count
    ), g as (
      insert into ai_usage (key, count) select ${`global:${minute}`}, 1 from u where u.count <= ${limits.user}
      on conflict (key) do update set count = ai_usage.count + 1, updated_at = now()
      returning count
    )
    select (select count from u) as user_count, (select count from g) as global_count
  `);

  // Old counters are never read again; clearing them doesn't need to delay the reply.
  after(() => db.execute(sql`delete from ai_usage where updated_at < now() - interval '1 hour'`));

  if (row.user_count > limits.user) return "user" as const;
  if ((row.global_count ?? 0) > limits.global) return "global" as const;
  return null;
}
