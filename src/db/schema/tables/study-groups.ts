import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { experienceLevelEnum, studyModeEnum } from "../enums";

export const studyGroups = pgTable("study_groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("grp")),
  ownerId: text("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  experienceLevel: experienceLevelEnum("experience_level").notNull(),
  studyMode: studyModeEnum("study_mode").notNull(),
  location: text("location"),
  availability: text("availability").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  maxMembers: integer("max_members").notNull().default(6),
  ...timestamps,
});

export type StudyGroup = typeof studyGroups.$inferSelect;
