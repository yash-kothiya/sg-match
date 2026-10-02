import type { Confidence, SignalKey } from "./types";

/**
 * The whole scoring model in one place. Weights sum to 100, so a group's score is simply
 * the points it earns. Change a weight here and the README, the UI explainer and the tests
 * (which assert the sum) all follow.
 */
export const MATCH_WEIGHTS: Record<SignalKey, number> = {
  skills: 35,
  interests: 20,
  availability: 15,
  level: 10,
  mode: 10,
  location: 10,
};

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  skills: "Skills",
  interests: "Topics",
  availability: "Availability",
  level: "Experience level",
  mode: "Study mode",
  location: "Location",
};

/** Plain-language description of each signal, shown in "How scoring works". */
export const SIGNAL_RULES: Record<SignalKey, string> = {
  skills: "The share of the skills you listed that the group covers.",
  interests: "How much your topics and the group's topics overlap (Jaccard similarity).",
  availability: "The share of your free time slots the group also meets in.",
  level: "Full marks for the same level, half marks for one level apart.",
  mode: "Full marks for the same mode. Hybrid works with either, at 70%.",
  location: "Full marks when either side is online-only, otherwise when you share a city.",
};

/** Hybrid is compatible with online and in-person, but not as good as an exact match. */
export const HYBRID_MODE_RATIO = 0.7;
/** One level apart is a partial match; two apart (beginner vs advanced) is none. */
export const ADJACENT_LEVEL_RATIO = 0.5;

export const MAX_REASONS = 3;
export const MIN_REASONS = 2;

export const CONFIDENCE_THRESHOLDS: { min: number; confidence: Confidence; label: string }[] = [
  { min: 80, confidence: "excellent", label: "Excellent match" },
  { min: 60, confidence: "strong", label: "Strong match" },
  { min: 40, confidence: "fair", label: "Fair match" },
  { min: 0, confidence: "weak", label: "Weak match" },
];
