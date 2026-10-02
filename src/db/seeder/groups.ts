import { inArray, sql } from "drizzle-orm";
import { createSeedDb } from "./_client";
import { seedId, skillIdLookup } from "./_helpers";
import { SEED_GROUPS } from "./_data/groups";

/** Dataset B: study groups, their skills and member lists. Needs `skills` and `users` first. Idempotent. */
export async function seed() {
  const { db, schema, close } = createSeedDb();

  try {
    const idsFor = await skillIdLookup(db, schema, SEED_GROUPS.flatMap((group) => group.skills));
    const groupIds = SEED_GROUPS.map((group) => seedId("grp", group.n));

    await db
      .insert(schema.studyGroups)
      .values(
        SEED_GROUPS.map((group) => ({
          id: seedId("grp", group.n),
          ownerId: seedId("usr", group.owner),
          name: group.name,
          description: group.description,
          subject: group.subject,
          experienceLevel: group.level,
          studyMode: group.mode,
          location: group.location,
          availability: group.availability,
          interests: group.interests,
          maxMembers: group.maxMembers,
        })),
      )
      .onConflictDoUpdate({
        target: schema.studyGroups.id,
        set: {
          ownerId: sql`excluded.owner_id`,
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          subject: sql`excluded.subject`,
          experienceLevel: sql`excluded.experience_level`,
          studyMode: sql`excluded.study_mode`,
          location: sql`excluded.location`,
          availability: sql`excluded.availability`,
          interests: sql`excluded.interests`,
          maxMembers: sql`excluded.max_members`,
        },
      });

    await db.delete(schema.studyGroupSkills).where(inArray(schema.studyGroupSkills.studyGroupId, groupIds));
    await db.insert(schema.studyGroupSkills).values(
      SEED_GROUPS.flatMap((group) =>
        idsFor(group.skills).map((skillId) => ({ studyGroupId: seedId("grp", group.n), skillId })),
      ),
    );

    // The owner is an accepted member; so are the listed members.
    await db.delete(schema.groupMemberships).where(inArray(schema.groupMemberships.studyGroupId, groupIds));
    await db.insert(schema.groupMemberships).values(
      SEED_GROUPS.flatMap((group) => [
        {
          id: seedId("mem", `${group.n}_${group.owner}`),
          studyGroupId: seedId("grp", group.n),
          userId: seedId("usr", group.owner),
          role: "owner" as const,
          status: "accepted" as const,
        },
        ...group.members.map((userN) => ({
          id: seedId("mem", `${group.n}_${userN}`),
          studyGroupId: seedId("grp", group.n),
          userId: seedId("usr", userN),
          role: "member" as const,
          status: "accepted" as const,
        })),
      ]),
    );

    const full = SEED_GROUPS.filter((group) => group.members.length + 1 >= group.maxMembers).length;
    console.log(`Seeded ${SEED_GROUPS.length} study groups (${full} full)`);
  } finally {
    await close();
  }
}
