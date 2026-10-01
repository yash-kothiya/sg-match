import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "../schema";

/**
 * Connection for seeders. `@/db` can't be used here because it is `server-only`, which
 * throws outside Next.js. Call `close()` when the seeder finishes.
 */
export function createSeedDb() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });
  return { db, schema, close: () => client.end() };
}
