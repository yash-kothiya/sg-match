import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { MAX_REQUESTS_PER_USER } from "@/config/constants";
import { db } from "@/db";
import { skills, studyRequests, studyRequestSkills } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import type { StudyRequestInput } from "@/schemas/profile";
import { refreshRequestScores } from "./matches.service";

/** Creates a study request owned by the user. Returns its id. */
export async function createRequest(userId: string, input: StudyRequestInput): Promise<string> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(studyRequests)
    .where(eq(studyRequests.userId, userId));
  if (total >= MAX_REQUESTS_PER_USER) {
    throw new ApiError(409, `You can keep up to ${MAX_REQUESTS_PER_USER} requests. Delete one to add another.`);
  }

  const skillIds = [...new Set(input.skillIds)];
  if (skillIds.length > 0) {
    const found = await db.select({ id: skills.id }).from(skills).where(inArray(skills.id, skillIds));
    if (found.length !== skillIds.length) {
      throw new ApiError(400, "One or more skills no longer exist. Refresh and try again.", {
        skillIds: "Some of these skills are no longer available",
      });
    }
  }

  const seen = new Set<string>();
  const interests = input.interests.filter((interest) => {
    const key = interest.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(studyRequests)
      .values({
        userId,
        title: input.title,
        subject: input.subject,
        description: input.description || null,
        experienceLevel: input.experienceLevel,
        studyMode: input.studyMode,
        location: input.location || null,
        availability: input.availability,
        interests,
      })
      .returning({ id: studyRequests.id });

    if (skillIds.length > 0) {
      await tx.insert(studyRequestSkills).values(skillIds.map((skillId) => ({ studyRequestId: row.id, skillId })));
    }
    return row.id;
  });

  // Score the new request against every group now, so its matches are ready to read.
  // If this fails the request still exists; the Matches page scores it on first view.
  await refreshRequestScores(id).catch((error) => console.error("Scoring new request failed:", error));
  return id;
}

/** Deletes one of the user's own requests. Other people's (and sample) requests can't be deleted. */
export async function deleteRequest(userId: string, requestId: string): Promise<void> {
  const deleted = await db
    .delete(studyRequests)
    .where(and(eq(studyRequests.id, requestId), eq(studyRequests.userId, userId)))
    .returning({ id: studyRequests.id });
  if (deleted.length === 0) throw new ApiError(404, "Study request not found");
}
