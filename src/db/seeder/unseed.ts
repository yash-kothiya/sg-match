import { like } from "drizzle-orm";
import { createSeedDb } from "./_client";
import { SEED_PREFIX } from "./_helpers";

/**
 * Removes the seeded users, groups and requests (matched by their `*_seed_*` ids). Memberships
 * and join rows go with them via cascades. Skills are left alone. `bun run db:seed unseed`.
 */
export async function seed() {
  const { db, schema, close } = createSeedDb();

  try {
    await db.delete(schema.studyRequests).where(like(schema.studyRequests.id, `req_${SEED_PREFIX}_%`));
    await db.delete(schema.studyGroups).where(like(schema.studyGroups.id, `grp_${SEED_PREFIX}_%`));
    await db.delete(schema.users).where(like(schema.users.id, `usr_${SEED_PREFIX}_%`));
    console.log("Removed seeded users, groups and requests");
  } finally {
    await close();
  }
}
