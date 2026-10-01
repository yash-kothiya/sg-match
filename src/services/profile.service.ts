import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { skills, userSkills, users, type User } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { OnboardingInput, Profile } from "@/schemas/profile";

export async function getProfile(userId: string): Promise<Profile> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new ApiError(404, "Profile not found");

  const userSkillRows = await db
    .select({ id: skills.id, name: skills.name, category: skills.category })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId))
    .orderBy(asc(skills.category), asc(skills.name));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    university: user.university,
    bio: user.bio,
    experienceLevel: user.experienceLevel,
    studyMode: user.studyMode,
    location: user.location,
    availability: user.availability,
    interests: user.interests,
    skills: userSkillRows,
  };
}

/**
 * Saves the study profile and replaces the user's skills in one transaction.
 * Used by both onboarding (`markOnboarded`) and the profile page (optional `name`).
 */
export async function saveProfile(
  userId: string,
  input: OnboardingInput & { name?: string },
  options: { markOnboarded?: boolean } = {},
): Promise<User> {
  // De-duplicate interests case-insensitively, keeping the first spelling.
  const seen = new Set<string>();
  const interests = input.interests.filter((interest) => {
    const key = interest.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const skillIds = [...new Set(input.skillIds)];
  if (skillIds.length > 0) {
    const found = await db.select({ id: skills.id }).from(skills).where(inArray(skills.id, skillIds));
    if (found.length !== skillIds.length) {
      throw new ApiError(400, "One or more skills no longer exist. Refresh and try again.", {
        skillIds: "Some of these skills are no longer available",
      });
    }
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(users)
      .set({
        ...(input.name ? { name: input.name } : {}),
        university: input.university,
        bio: input.bio || null,
        experienceLevel: input.experienceLevel,
        studyMode: input.studyMode,
        location: input.location || null,
        availability: input.availability,
        interests,
        ...(options.markOnboarded ? { onboardedAt: new Date() } : {}),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!row) throw new ApiError(404, "Profile not found");

    await tx.delete(userSkills).where(eq(userSkills.userId, userId));
    if (skillIds.length > 0) {
      await tx.insert(userSkills).values(skillIds.map((skillId) => ({ userId, skillId })));
    }

    return row;
  });
}
