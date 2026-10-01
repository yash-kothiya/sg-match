import { pgTable, text } from "drizzle-orm/pg-core";
import { users } from "./users";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { experienceLevelEnum, studyModeEnum } from "../enums";

export const studyRequests = pgTable("study_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("req")),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  experienceLevel: experienceLevelEnum("experience_level").notNull(),
  studyMode: studyModeEnum("study_mode").notNull(),
  location: text("location"),
  availability: text("availability").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  ...timestamps,
});

export type StudyRequest = typeof studyRequests.$inferSelect;
