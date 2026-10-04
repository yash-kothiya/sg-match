import { index, jsonb, pgTable, primaryKey, real, text, timestamp } from "drizzle-orm/pg-core";
import type { SignalScore } from "@/lib/matching/types";
import { studyGroups } from "./study-groups";
import { studyRequests } from "./study-requests";

/**
 * The stored result of scoring one study request against one study group. Written when a
 * request is created (against every group) and refreshed when a group is created or edited,
 * so the Matches page can read scores instead of recomputing them. Whether a group is still
 * a valid recommendation (full, already yours) is decided when reading, because that changes
 * without the score changing.
 */
export const requestMatches = pgTable(
  "request_matches",
  {
    studyRequestId: text("study_request_id")
      .notNull()
      .references(() => studyRequests.id, { onDelete: "cascade" }),
    studyGroupId: text("study_group_id")
      .notNull()
      .references(() => studyGroups.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    confidence: text("confidence").$type<"excellent" | "strong" | "fair" | "weak">().notNull(),
    reasons: text("reasons").array().notNull().default([]),
    caveats: text("caveats").array().notNull().default([]),
    signals: jsonb("signals").$type<SignalScore[]>().notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true, precision: 3 }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.studyRequestId, t.studyGroupId] }),
    index("request_matches_group_idx").on(t.studyGroupId),
    index("request_matches_request_score_idx").on(t.studyRequestId, t.score),
  ],
);

export type RequestMatch = typeof requestMatches.$inferSelect;
