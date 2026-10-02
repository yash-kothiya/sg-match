import { inArray, sql } from "drizzle-orm";
import { createSeedDb } from "./_client";
import { seedId, skillIdLookup } from "./_helpers";
import { SEED_USERS } from "./_data/users";

/** Fictional users that own the seeded requests and groups. Idempotent (upsert by id). */
export async function seed() {
  const { db, schema, close } = createSeedDb();

  try {
    const idsFor = await skillIdLookup(db, schema, SEED_USERS.flatMap((user) => user.skills));
    const userIds = SEED_USERS.map((user) => seedId("usr", user.n));

    await db
      .insert(schema.users)
      .values(
        SEED_USERS.map((user) => ({
          id: seedId("usr", user.n),
          firebaseUid: `seed_user_${String(user.n).padStart(2, "0")}`,
          email: `${user.name.toLowerCase().replace(/[^a-z]+/g, ".")}@seed.example.test`,
          name: user.name,
          bio: user.bio,
          university: user.university,
          experienceLevel: user.level,
          studyMode: user.mode,
          location: user.location,
          availability: user.availability,
          interests: user.interests,
          onboardedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: sql`excluded.name`,
          bio: sql`excluded.bio`,
          university: sql`excluded.university`,
          experienceLevel: sql`excluded.experience_level`,
          studyMode: sql`excluded.study_mode`,
          location: sql`excluded.location`,
          availability: sql`excluded.availability`,
          interests: sql`excluded.interests`,
        },
      });

    // Replace skills so edits to the data are reflected on re-run.
    await db.delete(schema.userSkills).where(inArray(schema.userSkills.userId, userIds));
    await db.insert(schema.userSkills).values(
      SEED_USERS.flatMap((user) =>
        idsFor(user.skills).map((skillId) => ({ userId: seedId("usr", user.n), skillId })),
      ),
    );

    console.log(`Seeded ${SEED_USERS.length} users`);
  } finally {
    await close();
  }
}
