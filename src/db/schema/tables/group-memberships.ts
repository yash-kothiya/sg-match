import { pgTable, text, unique } from "drizzle-orm/pg-core";

import { users } from "./users";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { groupRoleEnum, membershipStatusEnum } from "../enums";
import { studyGroups } from "./study-groups";

export const groupMemberships = pgTable(
  "group_memberships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("mem")),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studyGroupId: text("study_group_id")
      .notNull()
      .references(() => studyGroups.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("pending"),
    role: groupRoleEnum("role").notNull().default("member"),
    ...timestamps,
  },
  (t) => [unique("group_memberships_user_group_uq").on(t.userId, t.studyGroupId)]
);

export type GroupMembership = typeof groupMemberships.$inferSelect;
