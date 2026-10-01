import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

const globalForDatabase = globalThis as typeof globalThis & {
	postgresClient?: ReturnType<typeof postgres>;
};

const client = globalForDatabase.postgresClient ?? postgres(env.DATABASE_URL);

if (env.NODE_ENV !== "production") {
	globalForDatabase.postgresClient = client;
}

export const db = drizzle(client, { schema });

export type DB = typeof db;
