import "server-only";

import { and, asc, eq, inArray, like, or, sql } from "drizzle-orm";
import { SAMPLE_USER_ID_PREFIX } from "@/config/constants";
import { db } from "@/db";
import {
  groupMemberships,
  requestMatches,
  skills,
  studyGroups,
  studyGroupSkills,
  studyRequests,
  studyRequestSkills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { confidenceFor, isEligible, scoreGroup, sortResults } from "@/lib/matching/score";
import type { MatchGroupInput, MatchRequestInput, MatchResult } from "@/lib/matching/types";
import { MATCH_WEIGHTS, SIGNAL_LABELS, SIGNAL_RULES } from "@/lib/matching/weights";
import type { GroupSummary, MatchesResponse, RequestSummary } from "@/schemas/matching";

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
    topScore: null,
  }));

  // The user's own requests first, then the shared samples.
  return summaries.sort((a, b) => Number(b.kind === "mine") - Number(a.kind === "mine"));
}

/** The user's own requests first, then the shared sample requests, each with its best stored score. */
export async function listRequests(userId: string): Promise<RequestSummary[]> {
  const [stored, groups] = await Promise.all([visibleRequests(userId), loadGroups()]);
  const candidates = groups.map(toCandidate);

  // Best stored score per request, among groups that are still valid recommendations.
  const ids = stored.map((request) => request.id);
  const rows = ids.length
    ? await db
        .select({ requestId: requestMatches.studyRequestId, groupId: requestMatches.studyGroupId, score: requestMatches.score })
        .from(requestMatches)
        .where(inArray(requestMatches.studyRequestId, ids))
    : [];
  const rowsByRequest = new Map<string, typeof rows>();
  for (const row of rows) rowsByRequest.set(row.requestId, [...(rowsByRequest.get(row.requestId) ?? []), row]);

  // The user's own requests that were never scored (made before scores were stored) get scored now.
  const unscored = stored.filter((request) => request.kind === "mine" && !rowsByRequest.has(request.id));
  for (const request of unscored) await refreshRequestScores(request.id).catch(() => undefined);
  if (unscored.length > 0) {
    const fresh = await db
      .select({ requestId: requestMatches.studyRequestId, groupId: requestMatches.studyGroupId, score: requestMatches.score })
      .from(requestMatches)
      .where(inArray(requestMatches.studyRequestId, unscored.map((request) => request.id)));
    for (const row of fresh) rowsByRequest.set(row.requestId, [...(rowsByRequest.get(row.requestId) ?? []), row]);
  }

  const eligible = (request: RequestSummary, groupId: string, ownerOfRequest: string | null) => {
    const group = candidates.find((candidate) => candidate.id === groupId);
    return group ? isEligible({ ...toRequestInput(request, ownerOfRequest), id: request.id }, group) : false;
  };

  return stored.map((request) => {
    const owner = request.kind === "mine" ? userId : null;
    const best = (rowsByRequest.get(request.id) ?? [])
      .filter((row) => eligible(request, row.groupId, owner))
      .reduce<number | null>((top, row) => (top === null || row.score > top ? row.score : top), null);
    return { ...request, topScore: best };
  });
}

const toRequestInput = (request: RequestSummary, userId: string | null): MatchRequestInput => ({
  id: request.id,
  userId,
  level: request.level,
  mode: request.mode,
  location: request.location,
  availability: request.availability,
  interests: request.interests,
  skills: request.skills,
});

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

type LoadedGroup = Awaited<ReturnType<typeof loadGroups>>[number];

const toCandidate = ({ row, skills: groupSkills, memberIds }: LoadedGroup): MatchGroupInput => ({
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
});

/* ---------- Stored scores ---------- */

const toRow = (requestId: string, result: MatchResult) => ({
  studyRequestId: requestId,
  studyGroupId: result.groupId,
  score: result.score,
  confidence: result.confidence,
  reasons: result.reasons,
  caveats: result.caveats,
  signals: result.signals,
  computedAt: new Date(),
});

async function saveRows(rows: ReturnType<typeof toRow>[]) {
  if (rows.length === 0) return;
  await db
    .insert(requestMatches)
    .values(rows)
    .onConflictDoUpdate({
      target: [requestMatches.studyRequestId, requestMatches.studyGroupId],
      set: {
        score: sql`excluded.score`,
        confidence: sql`excluded.confidence`,
        reasons: sql`excluded.reasons`,
        caveats: sql`excluded.caveats`,
        signals: sql`excluded.signals`,
        computedAt: sql`excluded.computed_at`,
      },
    });
}

/** Scores a request against every group and stores the results. Run when a request is created. */
export async function refreshRequestScores(requestId: string): Promise<number> {
  const [row] = await db.select().from(studyRequests).where(eq(studyRequests.id, requestId));
  if (!row) return 0;
  const skillNames = await requestSkillNames([requestId]);

  const input: MatchRequestInput = {
    id: row.id,
    userId: row.userId,
    level: row.experienceLevel,
    mode: row.studyMode,
    location: row.location,
    availability: row.availability,
    interests: row.interests,
    skills: skillNames.get(requestId) ?? [],
  };
  const groups = (await loadGroups()).map(toCandidate);
  const rows = groups.map((group) => toRow(requestId, scoreGroup(input, group)));

  await db.transaction(async (tx) => {
    await tx.delete(requestMatches).where(eq(requestMatches.studyRequestId, requestId));
    if (rows.length > 0) await tx.insert(requestMatches).values(rows);
  });
  return rows.length;
}

/** Scores one group against every stored request. Run when a group is created or edited. */
export async function refreshGroupScores(groupId: string): Promise<number> {
  const groups = await loadGroups();
  const loaded = groups.find((entry) => entry.row.id === groupId);
  if (!loaded) return 0;
  const candidate = toCandidate(loaded);

  const requestRows = await db.select().from(studyRequests);
  const skillNames = await requestSkillNames(requestRows.map((request) => request.id));

  const rows = requestRows.map((request) =>
    toRow(
      request.id,
      scoreGroup(
        {
          id: request.id,
          userId: request.userId,
          level: request.experienceLevel,
          mode: request.studyMode,
          location: request.location,
          availability: request.availability,
          interests: request.interests,
          skills: skillNames.get(request.id) ?? [],
        },
        candidate,
      ),
    ),
  );
  await saveRows(rows);
  return rows.length;
}

/** Ranks the study groups for one study request and explains each result. */
export async function getMatches(userId: string, requestId: string, limit: number): Promise<MatchesResponse> {
  const [request] = await visibleRequests(userId, requestId);
  if (!request) throw new ApiError(404, "Study request not found");
  const [owner] = await db.select({ userId: studyRequests.userId }).from(studyRequests).where(eq(studyRequests.id, requestId));
  const requesterId = owner?.userId ?? null;

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
  const candidates = groups.map(toCandidate);
  const byGroupUpdated = new Map(groups.map((entry) => [entry.row.id, entry.row.updatedAt]));

  // Read the stored scores. Anything missing, or older than the group's last edit, is rescored now and saved.
  const stored = await db.select().from(requestMatches).where(eq(requestMatches.studyRequestId, requestId));
  const storedByGroup = new Map(stored.map((row) => [row.studyGroupId, row]));
  const healed: ReturnType<typeof toRow>[] = [];
  const all: MatchResult[] = [];
  let newest = 0;

  for (const candidate of candidates.filter((group) => isEligible(input, group))) {
    const row = storedByGroup.get(candidate.id);
    const editedAt = byGroupUpdated.get(candidate.id)?.getTime() ?? 0;
    if (row && row.computedAt.getTime() >= editedAt) {
      newest = Math.max(newest, row.computedAt.getTime());
      all.push({
        groupId: row.studyGroupId,
        score: row.score,
        confidence: row.confidence,
        reasons: row.reasons,
        caveats: row.caveats,
        signals: row.signals,
      });
    } else {
      const fresh = scoreGroup(input, candidate);
      healed.push(toRow(requestId, fresh));
      newest = Math.max(newest, Date.now());
      all.push(fresh);
    }
  }
  if (healed.length > 0) await saveRows(healed);

  const results = sortResults(all, new Map(candidates.map((group) => [group.id, group.name]))).slice(0, limit);
  const scoredAt = newest > 0 ? new Date(newest).toISOString() : null;

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
    scoredAt,
    method: (Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).map((key) => ({
      key,
      label: SIGNAL_LABELS[key],
      weight: MATCH_WEIGHTS[key],
      rule: SIGNAL_RULES[key],
    })),
  };
}
