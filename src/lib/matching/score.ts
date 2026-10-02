import { AVAILABILITY_OPTIONS, EXPERIENCE_LEVELS, STUDY_MODES } from "@/config/constants";
import {
  ADJACENT_LEVEL_RATIO,
  CONFIDENCE_THRESHOLDS,
  HYBRID_MODE_RATIO,
  MATCH_WEIGHTS,
  MAX_REASONS,
  MIN_REASONS,
  SIGNAL_LABELS,
} from "./weights";
import type {
  Confidence,
  Level,
  MatchGroupInput,
  MatchRequestInput,
  MatchResult,
  SignalKey,
  SignalScore,
} from "./types";

const norm = (value: string) => value.trim().toLowerCase();
const labelOf = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;
const list = (items: string[]) => items.join(", ");

/** Items of `a` (original spelling) that also appear in `b`, ignoring case. */
function intersect(a: string[], b: string[]): string[] {
  const other = new Set(b.map(norm));
  const seen = new Set<string>();
  return a.filter((item) => {
    const key = norm(item);
    if (!other.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const unique = (items: string[]) => new Set(items.map(norm)).size;

/** Share of `a` that is also in `b`. 0 when `a` is empty. */
function coverage(a: string[], b: string[]): number {
  const total = unique(a);
  return total === 0 ? 0 : intersect(a, b).length / total;
}

function jaccard(a: string[], b: string[]): number {
  const shared = intersect(a, b).length;
  const union = new Set([...a.map(norm), ...b.map(norm)]).size;
  return union === 0 ? 0 : shared / union;
}

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

type Evaluated = SignalScore & {
  /** Why this helped, phrased for the user. Null when the signal contributed nothing worth saying. */
  reason: string | null;
  /** Why this fell short; used only to reach the minimum number of reasons. */
  note: string;
};

function evaluate(request: MatchRequestInput, group: MatchGroupInput): Evaluated[] {
  const make = (
    key: SignalKey,
    ratio: number,
    detail: string,
    reason: string | null,
    note: string,
  ): Evaluated => ({
    key,
    label: SIGNAL_LABELS[key],
    weight: MATCH_WEIGHTS[key],
    ratio,
    points: MATCH_WEIGHTS[key] * ratio,
    detail,
    reason,
    note,
  });

  // Skills
  const sharedSkills = intersect(request.skills, group.skills);
  const skillTotal = unique(request.skills);
  const skills = make(
    "skills",
    coverage(request.skills, group.skills),
    `${sharedSkills.length} of ${skillTotal} skills`,
    sharedSkills.length > 0
      ? `Covers ${sharedSkills.length} of your ${skillTotal} skills: ${list(sharedSkills)}`
      : null,
    "None of your listed skills are covered yet",
  );

  // Interests
  const sharedInterests = intersect(request.interests, group.interests);
  const interests = make(
    "interests",
    jaccard(request.interests, group.interests),
    `${sharedInterests.length} shared topic${sharedInterests.length === 1 ? "" : "s"}`,
    sharedInterests.length > 0
      ? `Shares ${sharedInterests.length === 1 ? "your interest" : `${sharedInterests.length} of your interests`} in ${list(sharedInterests)}`
      : null,
    "No topics in common",
  );

  // Availability
  const sharedSlots = intersect(request.availability, group.availability);
  const slotTotal = unique(request.availability);
  const availability = make(
    "availability",
    coverage(request.availability, group.availability),
    `${sharedSlots.length} of ${slotTotal} time slots`,
    sharedSlots.length > 0
      ? `Meets ${sharedSlots.length === slotTotal ? "at all" : `in ${sharedSlots.length} of`} your free times: ${list(
          sharedSlots.map((slot) => labelOf(AVAILABILITY_OPTIONS, slot).toLowerCase()),
        )}`
      : null,
    "Meets at different times from when you're free",
  );

  // Experience level
  const levelGap = Math.abs(LEVEL_RANK[request.level] - LEVEL_RANK[group.level]);
  const levelRatio = levelGap === 0 ? 1 : levelGap === 1 ? ADJACENT_LEVEL_RATIO : 0;
  const requestLevel = labelOf(EXPERIENCE_LEVELS, request.level).toLowerCase();
  const groupLevel = labelOf(EXPERIENCE_LEVELS, group.level).toLowerCase();
  const level = make(
    "level",
    levelRatio,
    levelGap === 0 ? "same level" : levelGap === 1 ? "one level apart" : "two levels apart",
    levelGap === 0
      ? `Pitched at your level (${requestLevel})`
      : levelGap === 1
        ? `One level from yours (${groupLevel}, you're ${requestLevel})`
        : null,
    `Pitched at ${groupLevel}, while you're ${requestLevel}`,
  );

  // Study mode
  const modeRatio =
    request.mode === group.mode ? 1 : request.mode === "hybrid" || group.mode === "hybrid" ? HYBRID_MODE_RATIO : 0;
  const groupMode = labelOf(STUDY_MODES, group.mode).toLowerCase();
  const requestMode = labelOf(STUDY_MODES, request.mode).toLowerCase();
  const mode = make(
    "mode",
    modeRatio,
    request.mode === group.mode ? "same mode" : modeRatio > 0 ? "compatible mode" : "different mode",
    request.mode === group.mode
      ? `Meets ${groupMode}, as you prefer`
      : modeRatio > 0
        ? `Its ${groupMode} format works with your ${requestMode} preference`
        : null,
    `Meets ${groupMode}, but you prefer ${requestMode}`,
  );

  // Location: irrelevant when either side is fully online, otherwise a shared city
  const online = request.mode === "online" || group.mode === "online";
  const sameCity = Boolean(request.location && group.location && norm(request.location) === norm(group.location));
  const location = make(
    "location",
    online || sameCity ? 1 : 0,
    online ? "not a factor" : sameCity ? "same city" : "different city",
    !online && sameCity ? `Based in ${group.location}, like you` : null,
    `Based in ${group.location ?? "an unspecified place"}, not near ${request.location ?? "you"}`,
  );

  return [skills, interests, availability, level, mode, location];
}

export function confidenceFor(score: number): { confidence: Confidence; label: string } {
  const band = CONFIDENCE_THRESHOLDS.find((entry) => score >= entry.min)!;
  return { confidence: band.confidence, label: band.label };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Scores one group for one request. Pure and deterministic. */
export function scoreGroup(request: MatchRequestInput, group: MatchGroupInput): MatchResult {
  const evaluated = evaluate(request, group);
  const score = round1(evaluated.reduce((sum, signal) => sum + signal.points, 0));

  // Reasons: the signals that helped most, strongest first. If fewer than the minimum helped,
  // top up with the most informative shortfalls so the result is never unexplained.
  const helpful = evaluated
    .filter((signal) => signal.reason !== null && signal.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((signal) => signal.reason!);
  const reasons = helpful.slice(0, MAX_REASONS);
  if (reasons.length < MIN_REASONS) {
    const shortfalls = evaluated
      .filter((signal) => signal.ratio < 1)
      .sort((a, b) => b.weight - b.points - (a.weight - a.points))
      .map((signal) => signal.note);
    for (const note of shortfalls) {
      if (reasons.length >= MIN_REASONS) break;
      reasons.push(note);
    }
  }

  // A high score can still hide a real mismatch (e.g. in person vs online), so say so.
  const caveats = evaluated
    .filter((signal) => signal.ratio === 0 && signal.weight >= 10 && !reasons.includes(signal.note))
    .map((signal) => signal.note);

  return {
    groupId: group.id,
    score,
    confidence: confidenceFor(score).confidence,
    reasons,
    caveats,
    signals: evaluated.map((signal) => ({
      key: signal.key,
      label: signal.label,
      weight: signal.weight,
      ratio: Math.round(signal.ratio * 1000) / 1000,
      points: round1(signal.points),
      detail: signal.detail,
    })),
  };
}

/** Groups that make sense to recommend: not full, not the requester's own, not already joined. */
export function isEligible(request: MatchRequestInput, group: MatchGroupInput): boolean {
  if (group.memberIds.length >= group.maxMembers) return false;
  if (request.userId && (group.ownerId === request.userId || group.memberIds.includes(request.userId))) return false;
  return true;
}

export type RankOptions = { limit?: number };

/**
 * Ranks eligible groups for a request, best first. Ties are broken the same way every time
 * (skills, then topics, then name, then id) so identical inputs always give identical output.
 */
export function rankGroups(
  request: MatchRequestInput,
  groups: MatchGroupInput[],
  { limit = 5 }: RankOptions = {},
): MatchResult[] {
  const skillsRatio = (result: MatchResult) => result.signals.find((s) => s.key === "skills")!.ratio;
  const interestsRatio = (result: MatchResult) => result.signals.find((s) => s.key === "interests")!.ratio;
  const names = new Map(groups.map((group) => [group.id, group.name]));

  return groups
    .filter((group) => isEligible(request, group))
    .map((group) => scoreGroup(request, group))
    .sort(
      (a, b) =>
        b.score - a.score ||
        skillsRatio(b) - skillsRatio(a) ||
        interestsRatio(b) - interestsRatio(a) ||
        (names.get(a.groupId) ?? "").localeCompare(names.get(b.groupId) ?? "") ||
        a.groupId.localeCompare(b.groupId),
    )
    .slice(0, limit);
}

