import { pgTable, text } from "drizzle-orm/pg-core";
import { generateId } from "@/db/helper/id-generator";
import { timestamps } from "@/db/helper/timestamps-helper";
import { userRoleEnum } from "../enums";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("usr")),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  university: text("university"),
  role: userRoleEnum("role").notNull().default("student"),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
