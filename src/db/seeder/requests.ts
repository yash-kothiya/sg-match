import { inArray, sql } from "drizzle-orm";
import { createSeedDb } from "./_client";
import { seedId, skillIdLookup } from "./_helpers";
import { SEED_REQUESTS } from "./_data/requests";

/** Dataset A: study requests and their skills. Needs `skills` and `users` first. Idempotent. */
export async function seed() {
  const { db, schema, close } = createSeedDb();

  try {
    const idsFor = await skillIdLookup(db, schema, SEED_REQUESTS.flatMap((request) => request.skills));
    const requestIds = SEED_REQUESTS.map((request) => seedId("req", request.n));

    await db
      .insert(schema.studyRequests)
      .values(
        SEED_REQUESTS.map((request) => ({
          id: seedId("req", request.n),
          userId: seedId("usr", request.user),
          title: request.title,
          description: request.description,
          subject: request.subject,
          experienceLevel: request.level,
          studyMode: request.mode,
          location: request.location,
          availability: request.availability,
          interests: request.interests,
        })),
      )
      .onConflictDoUpdate({
        target: schema.studyRequests.id,
        set: {
          userId: sql`excluded.user_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          subject: sql`excluded.subject`,
          experienceLevel: sql`excluded.experience_level`,
          studyMode: sql`excluded.study_mode`,
          location: sql`excluded.location`,
          availability: sql`excluded.availability`,
          interests: sql`excluded.interests`,
        },
      });

    await db.delete(schema.studyRequestSkills).where(inArray(schema.studyRequestSkills.studyRequestId, requestIds));
    await db.insert(schema.studyRequestSkills).values(
      SEED_REQUESTS.flatMap((request) =>
        idsFor(request.skills).map((skillId) => ({ studyRequestId: seedId("req", request.n), skillId })),
      ),
    );

    console.log(`Seeded ${SEED_REQUESTS.length} study requests`);
  } finally {
    await close();
  }
}
