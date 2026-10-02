import "server-only";

import { and, asc, eq, inArray, like, or } from "drizzle-orm";
import { PROFILE_REQUEST_ID, SAMPLE_USER_ID_PREFIX } from "@/config/constants";
import { db } from "@/db";
import {
  groupMemberships,
  skills,
  studyGroups,
  studyGroupSkills,
  studyRequests,
  studyRequestSkills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { confidenceFor, isEligible, rankGroups } from "@/lib/matching/score";
import type { MatchGroupInput, MatchRequestInput } from "@/lib/matching/types";
import { MATCH_WEIGHTS, SIGNAL_LABELS, SIGNAL_RULES } from "@/lib/matching/weights";
import type { GroupSummary, MatchesResponse, RequestSummary } from "@/schemas/matching";
import { getProfile } from "./profile.service";

/** Names of the skills attached to each id, e.g. requests -> ["Python", "SQL"]. */
async function requestSkillNames(requestIds: string[]) {
  const byRequest = new Map<string, string[]>();
  if (requestIds.length === 0) return byRequest;

  const rows = await db
    .select({ requestId: studyRequestSkills.studyRequestId, name: skills.name })
    .from(studyRequestSkills)
    .innerJoin(skills, eq(studyRequestSkills.skillId, skills.id))
    .where(inArray(studyRequestSkills.studyRequestId, requestIds))
    .orderBy(asc(skills.name));
  for (const row of rows) byRequest.set(row.requestId, [...(byRequest.get(row.requestId) ?? []), row.name]);
  return byRequest;
}

async function visibleRequests(userId: string, onlyId?: string) {
  const owned = or(eq(studyRequests.userId, userId), like(studyRequests.userId, `${SAMPLE_USER_ID_PREFIX}%`));
  const rows = await db
    .select({ request: studyRequests, ownerName: users.name })
    .from(studyRequests)
    .leftJoin(users, eq(studyRequests.userId, users.id))
    .where(onlyId ? and(owned, eq(studyRequests.id, onlyId)) : owned)
    .orderBy(asc(studyRequests.createdAt), asc(studyRequests.id));

  const skillNames = await requestSkillNames(rows.map((row) => row.request.id));

  const summaries: RequestSummary[] = rows.map(({ request, ownerName }) => ({
    id: request.id,
    title: request.title,
    subject: request.subject,
    description: request.description,
    level: request.experienceLevel,
    mode: request.studyMode,
    location: request.location,
    availability: request.availability,
    interests: request.interests,
    skills: skillNames.get(request.id) ?? [],
    kind: request.userId === userId ? ("mine" as const) : ("sample" as const),
    ownerName,
  }));

  // The user's own requests first, then the shared samples.
  return summaries.sort((a, b) => Number(b.kind === "mine") - Number(a.kind === "mine"));
}

/** The built-in request that matches groups to the user's own profile. Not stored in the database. */
async function profileRequest(userId: string): Promise<RequestSummary> {
  const profile = await getProfile(userId);
  return {
    id: PROFILE_REQUEST_ID,
    title: "Based on my profile",
    subject: "Everything I study",
    description: "Uses your skills, topics, free times and preferences from your profile.",
    level: profile.experienceLevel ?? "intermediate",
    mode: profile.studyMode ?? "online",
    location: profile.location,
    availability: profile.availability,
    interests: profile.interests,
    skills: profile.skills.map((skill) => skill.name),
    kind: "profile",
    ownerName: profile.name,
  };
}

/** The profile request first, then the user's own requests, then the shared sample requests. */
export async function listRequests(userId: string): Promise<RequestSummary[]> {
  const [profile, stored] = await Promise.all([profileRequest(userId), visibleRequests(userId)]);
  return [profile, ...stored];
}

async function loadGroups() {
  const groupRows = await db.select().from(studyGroups).orderBy(asc(studyGroups.name));
  const groupIds = groupRows.map((group) => group.id);
  if (groupIds.length === 0) return [];

  const [skillRows, memberRows] = await Promise.all([
    db
      .select({ groupId: studyGroupSkills.studyGroupId, name: skills.name })
      .from(studyGroupSkills)
      .innerJoin(skills, eq(studyGroupSkills.skillId, skills.id))
      .where(inArray(studyGroupSkills.studyGroupId, groupIds))
      .orderBy(asc(skills.name)),
    db
      .select({ groupId: groupMemberships.studyGroupId, userId: groupMemberships.userId })
      .from(groupMemberships)
      .where(and(inArray(groupMemberships.studyGroupId, groupIds), eq(groupMemberships.status, "accepted"))),
  ]);

  const skillsByGroup = new Map<string, string[]>();
  for (const row of skillRows) skillsByGroup.set(row.groupId, [...(skillsByGroup.get(row.groupId) ?? []), row.name]);
  const membersByGroup = new Map<string, string[]>();
  for (const row of memberRows) membersByGroup.set(row.groupId, [...(membersByGroup.get(row.groupId) ?? []), row.userId]);

  return groupRows.map((group) => ({
    row: group,
    skills: skillsByGroup.get(group.id) ?? [],
    memberIds: membersByGroup.get(group.id) ?? [],
  }));
}

/** Ranks the study groups for one study request and explains each result. */
export async function getMatches(userId: string, requestId: string, limit: number): Promise<MatchesResponse> {
  let request: RequestSummary | undefined;
  let requesterId: string | null = userId;
  if (requestId === PROFILE_REQUEST_ID) {
    request = await profileRequest(userId);
  } else {
    [request] = await visibleRequests(userId, requestId);
    if (!request) throw new ApiError(404, "Study request not found");
    const [row] = await db.select({ userId: studyRequests.userId }).from(studyRequests).where(eq(studyRequests.id, requestId));
    requesterId = row?.userId ?? null;
  }
  if (!request) throw new ApiError(404, "Study request not found");

  const [groups, pending] = await Promise.all([
    loadGroups(),
    db
      .select({ groupId: groupMemberships.studyGroupId })
      .from(groupMemberships)
      .where(and(eq(groupMemberships.userId, userId), eq(groupMemberships.status, "pending"))),
  ]);
  const pendingIds = new Set(pending.map((row) => row.groupId));

  const input: MatchRequestInput = {
    id: request.id,
    userId: requesterId,
    level: request.level,
    mode: request.mode,
    location: request.location,
    availability: request.availability,
    interests: request.interests,
    skills: request.skills,
  };
  const candidates: MatchGroupInput[] = groups.map(({ row, skills: groupSkills, memberIds }) => ({
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    level: row.experienceLevel,
    mode: row.studyMode,
    location: row.location,
    availability: row.availability,
    interests: row.interests,
    skills: groupSkills,
    maxMembers: row.maxMembers,
    memberIds,
  }));

  const results = rankGroups(input, candidates, { limit });
  const byId = new Map(groups.map((entry) => [entry.row.id, entry]));

  const matches = results.map((result) => {
    const { row, skills: groupSkills, memberIds } = byId.get(result.groupId)!;
    const group: GroupSummary = {
      id: row.id,
      name: row.name,
      subject: row.subject,
      description: row.description,
      level: row.experienceLevel,
      mode: row.studyMode,
      location: row.location,
      availability: row.availability,
      interests: row.interests,
      skills: groupSkills,
      memberCount: memberIds.length,
      maxMembers: row.maxMembers,
      spotsLeft: Math.max(row.maxMembers - memberIds.length, 0),
      joinStatus: pendingIds.has(row.id) ? ("pending" as const) : ("none" as const),
    };
    return {
      group,
      score: result.score,
      confidence: result.confidence,
      confidenceLabel: confidenceFor(result.score).label,
      reasons: result.reasons,
      caveats: result.caveats,
      signals: result.signals,
    };
  });

  return {
    request,
    matches,
    considered: candidates.filter((group) => isEligible(input, group)).length,
    method: (Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).map((key) => ({
      key,
      label: SIGNAL_LABELS[key],
      weight: MATCH_WEIGHTS[key],
      rule: SIGNAL_RULES[key],
    })),
  };
}
