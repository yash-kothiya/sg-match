import { pgEnum } from "drizzle-orm/pg-core";

export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const studyModeEnum = pgEnum("study_mode", [
  "online",
  "in_person",
  "hybrid",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
]);

// App-wide role of a user.
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);

// Role of a user inside a single study group.
export const groupRoleEnum = pgEnum("group_role", ["owner", "member"]);
