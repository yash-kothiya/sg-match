import { inArray } from "drizzle-orm";
import type { createSeedDb } from "./_client";

type SeedDb = ReturnType<typeof createSeedDb>;

/** Deterministic ids so every seeder can be re-run (upsert) and `unseed` can find its rows. */
export const SEED_PREFIX = "seed";
export const seedId = (prefix: "usr" | "grp" | "req" | "mem", key: number | string) =>
  `${prefix}_${SEED_PREFIX}_${typeof key === "number" ? String(key).padStart(2, "0") : key}`;

export type Level = "beginner" | "intermediate" | "advanced";
export type Mode = "online" | "in_person" | "hybrid";
export type Slot =
  | "weekday_morning"
  | "weekday_afternoon"
  | "weekday_evening"
  | "weekend_morning"
  | "weekend_afternoon"
  | "weekend_evening";

/** Maps skill names to ids; throws a readable error if the skills seeder hasn't run or a name is wrong. */
export async function skillIdLookup(db: SeedDb["db"], schema: SeedDb["schema"], names: readonly string[]) {
  const unique = [...new Set(names)];
  const rows = await db
    .select({ id: schema.skills.id, name: schema.skills.name })
    .from(schema.skills)
    .where(inArray(schema.skills.name, unique));
  const byName = new Map(rows.map((row) => [row.name, row.id]));

  const missing = unique.filter((name) => !byName.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Unknown skill(s): ${missing.join(", ")}. Run \`bun run db:seed skills\` first, and check the spelling against src/db/seeder/skills.ts.`,
    );
  }

  return (list: readonly string[]) => list.map((name) => byName.get(name)!);
}
