import { z } from "zod";
import { DEFAULT_MATCH_LIMIT, MAX_MATCH_LIMIT } from "@/config/constants";
import type { Confidence, SignalScore } from "@/lib/matching/types";

export const matchesQuerySchema = z.object({
  requestId: z.string().trim().min(1, "Choose a study request"),
  limit: z.coerce.number().int().min(1).max(MAX_MATCH_LIMIT).default(DEFAULT_MATCH_LIMIT),
});

export type RequestSummary = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  mode: "online" | "in_person" | "hybrid";
  location: string | null;
  availability: string[];
  interests: string[];
  skills: string[];
  /** `profile` is built from the user's profile, `mine` is one they created, `sample` is shared demo data. */
  kind: "profile" | "mine" | "sample";
  ownerName: string | null;
};

export type GroupSummary = {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  level: "beginner" | "intermediate" | "advanced";
  mode: "online" | "in_person" | "hybrid";
  location: string | null;
  availability: string[];
  interests: string[];
  skills: string[];
  memberCount: number;
  maxMembers: number;
  spotsLeft: number;
  /** `pending` once the signed-in user has asked to join. */
  joinStatus: "none" | "pending";
};

export type MatchItem = {
  group: GroupSummary;
  /** 0 to 100. */
  score: number;
  confidence: Confidence;
  confidenceLabel: string;
  reasons: string[];
  caveats: string[];
  signals: SignalScore[];
};

export type MatchesResponse = {
  request: RequestSummary;
  matches: MatchItem[];
  /** How many groups were scored (after removing full and own groups). */
  considered: number;
  method: { key: string; label: string; weight: number; rule: string }[];
};
