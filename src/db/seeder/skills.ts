import { sql } from "drizzle-orm";
import { createSeedDb } from "./_client";

// Skill catalog shown in onboarding and used by the matching engine. Names are unique.
export const SKILLS: readonly { name: string; category: string }[] = [
  // Programming
  { name: "Python", category: "Programming" },
  { name: "JavaScript", category: "Programming" },
  { name: "TypeScript", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "C", category: "Programming" },
  { name: "Go", category: "Programming" },
  { name: "Rust", category: "Programming" },
  { name: "SQL", category: "Programming" },
  // Web
  { name: "React", category: "Web" },
  { name: "Next.js", category: "Web" },
  { name: "Node.js", category: "Web" },
  { name: "HTML & CSS", category: "Web" },
  { name: "REST APIs", category: "Web" },
  // Data and AI
  { name: "Data analysis", category: "Data and AI" },
  { name: "Machine learning", category: "Data and AI" },
  { name: "Deep learning", category: "Data and AI" },
  { name: "Statistics", category: "Data and AI" },
  { name: "Data visualization", category: "Data and AI" },
  // Computer science
  { name: "Algorithms", category: "Computer science" },
  { name: "Data structures", category: "Computer science" },
  { name: "Operating systems", category: "Computer science" },
  { name: "Databases", category: "Computer science" },
  { name: "Computer networks", category: "Computer science" },
  { name: "Software engineering", category: "Computer science" },
  { name: "Cybersecurity", category: "Computer science" },
  // Mathematics
  { name: "Calculus", category: "Mathematics" },
  { name: "Linear algebra", category: "Mathematics" },
  { name: "Discrete mathematics", category: "Mathematics" },
  { name: "Probability", category: "Mathematics" },
  // Science
  { name: "Physics", category: "Science" },
  { name: "Chemistry", category: "Science" },
  { name: "Biology", category: "Science" },
  // Business and writing
  { name: "Economics", category: "Business and writing" },
  { name: "Accounting", category: "Business and writing" },
  { name: "Academic writing", category: "Business and writing" },
  { name: "Public speaking", category: "Business and writing" },
];

/** Idempotent: re-running updates categories and never duplicates a skill. */
export async function seed() {
  const { db, schema, close } = createSeedDb();

  try {
    await db
      .insert(schema.skills)
      .values(SKILLS.map((skill) => ({ name: skill.name, category: skill.category })))
      .onConflictDoUpdate({
        target: schema.skills.name,
        set: { category: sql`excluded.category` },
      });
    console.log(`Seeded ${SKILLS.length} skills`);
  } finally {
    await close();
  }
}
