import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { skills } from "@/db/schema";
import type { SkillOption } from "@/schemas/profile";

/** The full skill catalog, grouped-friendly order (category, then name). */
export async function listSkills(): Promise<SkillOption[]> {
  return db
    .select({ id: skills.id, name: skills.name, category: skills.category })
    .from(skills)
    .orderBy(asc(skills.category), asc(skills.name));
}
