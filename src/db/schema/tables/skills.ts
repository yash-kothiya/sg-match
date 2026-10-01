import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { studyGroups } from "./study-groups";
import { studyRequests } from "./study-requests";
import { users } from "./users";

export const skills = pgTable("skills", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("skl")),
  name: text("name").notNull().unique(),
  category: text("category"),
  ...timestamps,
});

export const studyRequestSkills = pgTable(
  "study_request_skills",
  {
    studyRequestId: text("study_request_id")
      .notNull()
      .references(() => studyRequests.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.studyRequestId, t.skillId] }),
    index("study_request_skills_skill_idx").on(t.skillId),
  ]
);

export const studyGroupSkills = pgTable(
  "study_group_skills",
  {
    studyGroupId: text("study_group_id")
      .notNull()
      .references(() => studyGroups.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.studyGroupId, t.skillId] }),
    index("study_group_skills_skill_idx").on(t.skillId),
  ]
);

export const userSkills = pgTable(
  "user_skills",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skillId] }),
    index("user_skills_skill_idx").on(t.skillId),
  ]
);

export type Skill = typeof skills.$inferSelect;
