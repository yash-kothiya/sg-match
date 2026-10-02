/** Pure data shapes for the matching engine. No framework or database imports. */

export type Level = "beginner" | "intermediate" | "advanced";
export type Mode = "online" | "in_person" | "hybrid";

export type MatchRequestInput = {
  id: string;
  /** Who made the request; used to avoid recommending their own groups. */
  userId: string | null;
  level: Level;
  mode: Mode;
  location: string | null;
  availability: string[];
  interests: string[];
  skills: string[];
};

export type MatchGroupInput = {
  id: string;
  name: string;
  ownerId: string | null;
  level: Level;
  mode: Mode;
  location: string | null;
  availability: string[];
  interests: string[];
  skills: string[];
  maxMembers: number;
  /** Accepted members, including the owner. */
  memberIds: string[];
};

export type SignalKey = "skills" | "interests" | "availability" | "level" | "mode" | "location";

export type SignalScore = {
  key: SignalKey;
  label: string;
  /** Maximum points this signal can contribute. */
  weight: number;
  /** 0 to 1: how well this signal matched. */
  ratio: number;
  /** weight * ratio. */
  points: number;
  /** Short factual summary, e.g. "2 of 3 skills". */
  detail: string;
};

export type Confidence = "excellent" | "strong" | "fair" | "weak";

export type MatchResult = {
  groupId: string;
  /** 0 to 100, one decimal. */
  score: number;
  confidence: Confidence;
  /** Two or three plain-English reasons, strongest first. */
  reasons: string[];
  /** Honest shortfalls worth knowing about, e.g. "Meets in person, but you prefer online". */
  caveats: string[];
  /** Per-signal breakdown, in weight order. */
  signals: SignalScore[];
};
