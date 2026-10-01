import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    precision: 3,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    precision: 3,
  })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
};
