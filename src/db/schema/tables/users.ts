import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { experienceLevelEnum, studyModeEnum, userRoleEnum } from "../enums";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("usr")),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  university: text("university"),
  // Study profile collected during onboarding; used by the matching engine.
  experienceLevel: experienceLevelEnum("experience_level"),
  studyMode: studyModeEnum("study_mode"),
  location: text("location"),
  availability: text("availability").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  // Null until the user finishes the onboarding wizard.
  onboardedAt: timestamp("onboarded_at", { withTimezone: true, precision: 3 }),
  role: userRoleEnum("role").notNull().default("student"),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
