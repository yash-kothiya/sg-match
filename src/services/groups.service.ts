import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { MAX_OWNED_GROUPS } from "@/config/constants";
import { db } from "@/db";
import { groupMemberships, skills, studyGroups, studyGroupSkills, userSkills, users } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { refreshGroupScores } from "./matches.service";
import type { GroupCardData, GroupDetail, GroupInput, GroupsQuery, MyStatus } from "@/schemas/groups";

type GroupRow = typeof studyGroups.$inferSelect;
type Membership = typeof groupMemberships.$inferSelect;

/* ---------- Loading ---------- */

async function skillsByGroup(groupIds: string[]) {
  const map = new Map<string, { id: string; name: string }[]>();
  if (groupIds.length === 0) return map;
  const rows = await db
    .select({ groupId: studyGroupSkills.studyGroupId, id: skills.id, name: skills.name })
    .from(studyGroupSkills)
    .innerJoin(skills, eq(studyGroupSkills.skillId, skills.id))
    .where(inArray(studyGroupSkills.studyGroupId, groupIds))
    .orderBy(asc(skills.name));
  for (const row of rows) map.set(row.groupId, [...(map.get(row.groupId) ?? []), { id: row.id, name: row.name }]);
  return map;
}

async function membershipsByGroup(groupIds: string[]) {
  const map = new Map<string, Membership[]>();
  if (groupIds.length === 0) return map;
  const rows = await db.select().from(groupMemberships).where(inArray(groupMemberships.studyGroupId, groupIds));
  for (const row of rows) map.set(row.studyGroupId, [...(map.get(row.studyGroupId) ?? []), row]);
  return map;
}

function statusFor(userId: string, group: GroupRow, memberships: Membership[]): MyStatus {
  if (group.ownerId === userId) return "owner";
  const mine = memberships.find((m) => m.userId === userId);
  if (mine?.status === "accepted") return "member";
  if (mine?.status === "pending") return "pending";
  if (mine?.status === "rejected") return "rejected";
  return "none";
}

function toCard(
  userId: string,
  group: GroupRow,
  groupSkills: { name: string }[],
  memberships: Membership[],
): GroupCardData {
  const accepted = memberships.filter((m) => m.status === "accepted");
  const memberCount = Math.max(accepted.length, group.ownerId ? 1 : 0);
  return {
    id: group.id,
    name: group.name,
    subject: group.subject,
    description: group.description,
    level: group.experienceLevel,
    mode: group.studyMode,
    location: group.location,
    skills: groupSkills.map((skill) => skill.name),
    memberCount,
    maxMembers: group.maxMembers,
    spotsLeft: Math.max(group.maxMembers - memberCount, 0),
    myStatus: statusFor(userId, group, memberships),
    pendingCount: group.ownerId === userId ? memberships.filter((m) => m.status === "pending").length : 0,
  };
}

/** Groups for one of the three tabs: explore (everything), mine (owned or joined), requests (asked to join). */
export async function listGroups(userId: string, query: GroupsQuery): Promise<GroupCardData[]> {
  const needle = query.q ? `%${query.q.replace(/[%_]/g, "")}%` : null;

  const filters = [
    query.mode ? eq(studyGroups.studyMode, query.mode) : undefined,
    query.level ? eq(studyGroups.experienceLevel, query.level) : undefined,
    needle
      ? or(
          ilike(studyGroups.name, needle),
          ilike(studyGroups.subject, needle),
          sql`exists (select 1 from ${studyGroupSkills} gs join ${skills} s on s.id = gs.skill_id where gs.study_group_id = ${studyGroups.id} and s.name ilike ${needle})`,
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(studyGroups)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(studyGroups.createdAt), asc(studyGroups.name));

  const ids = rows.map((row) => row.id);
  const [skillMap, memberMap] = await Promise.all([skillsByGroup(ids), membershipsByGroup(ids)]);

  let cards = rows.map((row) => toCard(userId, row, skillMap.get(row.id) ?? [], memberMap.get(row.id) ?? []));

  if (query.scope === "mine") cards = cards.filter((c) => c.myStatus === "owner" || c.myStatus === "member");
  else if (query.scope === "requests") cards = cards.filter((c) => c.myStatus === "pending" || c.myStatus === "rejected");
  if (query.open) cards = cards.filter((c) => c.spotsLeft > 0);

  return cards;
}

export async function getGroup(userId: string, groupId: string): Promise<GroupDetail> {
  const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId));
  if (!group) throw new ApiError(404, "Study group not found");

  const [skillMap, memberMap] = await Promise.all([skillsByGroup([groupId]), membershipsByGroup([groupId])]);
  const groupSkills = skillMap.get(groupId) ?? [];
  const memberships = memberMap.get(groupId) ?? [];
  const card = toCard(userId, group, groupSkills, memberships);

  const people = await db
    .select({ id: users.id, name: users.name, university: users.university, bio: users.bio })
    .from(users)
    .where(inArray(users.id, [...new Set([...memberships.map((m) => m.userId), ...(group.ownerId ? [group.ownerId] : [])])]));
  const person = new Map(people.map((p) => [p.id, p]));

  const memberIds = new Set(
    memberships.filter((m) => m.status === "accepted").map((m) => m.userId),
  );
  if (group.ownerId) memberIds.add(group.ownerId);

  const members = [...memberIds]
    .map((id) => ({
      userId: id,
      name: person.get(id)?.name ?? "Unknown",
      university: person.get(id)?.university ?? null,
      role: id === group.ownerId ? ("owner" as const) : ("member" as const),
      isMe: id === userId,
    }))
    .sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || a.name.localeCompare(b.name));

  let pending: GroupDetail["pending"] = [];
  if (group.ownerId === userId) {
    const pendingRows = memberships.filter((m) => m.status === "pending");
    const skillRows = pendingRows.length
      ? await db
          .select({ userId: userSkills.userId, name: skills.name })
          .from(userSkills)
          .innerJoin(skills, eq(userSkills.skillId, skills.id))
          .where(inArray(userSkills.userId, pendingRows.map((m) => m.userId)))
      : [];
    pending = pendingRows
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => ({
        userId: m.userId,
        name: person.get(m.userId)?.name ?? "Unknown",
        university: person.get(m.userId)?.university ?? null,
        bio: person.get(m.userId)?.bio ?? null,
        skills: skillRows.filter((row) => row.userId === m.userId).map((row) => row.name),
        requestedAt: m.createdAt.toISOString(),
      }));
  }

  return {
    ...card,
    availability: group.availability,
    interests: group.interests,
    ownerName: group.ownerId ? (person.get(group.ownerId)?.name ?? null) : null,
    members,
    pending,
    skillIds: groupSkills.map((skill) => skill.id),
  };
}

/* ---------- Owner actions ---------- */

async function requireOwned(userId: string, groupId: string) {
  const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId));
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.ownerId !== userId) throw new ApiError(403, "Only the group's owner can do that");
  return group;
}

async function validateSkillIds(skillIds: string[]) {
  const unique = [...new Set(skillIds)];
  if (unique.length === 0) return unique;
  const found = await db.select({ id: skills.id }).from(skills).where(inArray(skills.id, unique));
  if (found.length !== unique.length) {
    throw new ApiError(400, "One or more skills no longer exist. Refresh and try again.", {
      skillIds: "Some of these skills are no longer available",
    });
  }
  return unique;
}

const dedupe = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export async function createGroup(userId: string, input: GroupInput): Promise<string> {
  const [{ total }] = await db.select({ total: count() }).from(studyGroups).where(eq(studyGroups.ownerId, userId));
  if (total >= MAX_OWNED_GROUPS) {
    throw new ApiError(409, `You can own up to ${MAX_OWNED_GROUPS} groups. Delete one to create another.`);
  }
  const skillIds = await validateSkillIds(input.skillIds);

  const id = await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(studyGroups)
      .values({
        ownerId: userId,
        name: input.name,
        subject: input.subject,
        description: input.description || null,
        experienceLevel: input.experienceLevel,
        studyMode: input.studyMode,
        location: input.location || null,
        availability: input.availability,
        interests: dedupe(input.interests),
        maxMembers: input.maxMembers,
      })
      .returning({ id: studyGroups.id });

    await tx.insert(groupMemberships).values({ userId, studyGroupId: group.id, role: "owner", status: "accepted" });
    if (skillIds.length) {
      await tx.insert(studyGroupSkills).values(skillIds.map((skillId) => ({ studyGroupId: group.id, skillId })));
    }
    return group.id;
  });
  await refreshGroupScores(id).catch((error) => console.error("Scoring new group failed:", error));
  return id;
}

export async function updateGroup(userId: string, groupId: string, input: GroupInput): Promise<void> {
  await requireOwned(userId, groupId);
  const skillIds = await validateSkillIds(input.skillIds);

  const accepted = await db
    .select({ n: count() })
    .from(groupMemberships)
    .where(and(eq(groupMemberships.studyGroupId, groupId), eq(groupMemberships.status, "accepted")));
  if (input.maxMembers < (accepted[0]?.n ?? 0)) {
    throw new ApiError(409, `The group already has ${accepted[0].n} members. Remove someone before lowering the size.`, {
      maxMembers: `Must be at least ${accepted[0].n}`,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(studyGroups)
      .set({
        name: input.name,
        subject: input.subject,
        description: input.description || null,
        experienceLevel: input.experienceLevel,
        studyMode: input.studyMode,
        location: input.location || null,
        availability: input.availability,
        interests: dedupe(input.interests),
        maxMembers: input.maxMembers,
      })
      .where(eq(studyGroups.id, groupId));
    await tx.delete(studyGroupSkills).where(eq(studyGroupSkills.studyGroupId, groupId));
    if (skillIds.length) {
      await tx.insert(studyGroupSkills).values(skillIds.map((skillId) => ({ studyGroupId: groupId, skillId })));
    }
  });
  await refreshGroupScores(groupId).catch((error) => console.error("Rescoring edited group failed:", error));
}

export async function deleteGroup(userId: string, groupId: string): Promise<void> {
  await requireOwned(userId, groupId);
  await db.delete(studyGroups).where(eq(studyGroups.id, groupId)); // memberships and skills cascade
}

/** Owner accepts or rejects a pending request. Capacity is re-checked inside the transaction. */
export async function decideRequest(
  ownerId: string,
  groupId: string,
  userId: string,
  status: "accepted" | "rejected",
): Promise<void> {
  const group = await requireOwned(ownerId, groupId);

  await db.transaction(async (tx) => {
    // Lock the group row so two owners' clicks (or two tabs) can't both take the last seat.
    await tx.select({ id: studyGroups.id }).from(studyGroups).where(eq(studyGroups.id, groupId)).for("update");

    const [membership] = await tx
      .select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.studyGroupId, groupId), eq(groupMemberships.userId, userId)));
    if (!membership || membership.status !== "pending") throw new ApiError(409, "That request is no longer pending");

    if (status === "accepted") {
      const [{ n }] = await tx
        .select({ n: count() })
        .from(groupMemberships)
        .where(and(eq(groupMemberships.studyGroupId, groupId), eq(groupMemberships.status, "accepted")));
      if (n >= group.maxMembers) throw new ApiError(409, "The group is full. Raise its size or remove someone first.");
    }

    await tx
      .update(groupMemberships)
      .set({ status })
      .where(and(eq(groupMemberships.studyGroupId, groupId), eq(groupMemberships.userId, userId)));
  });
}

/** Owner removes an accepted member. */
export async function removeMember(ownerId: string, groupId: string, userId: string): Promise<void> {
  await requireOwned(ownerId, groupId);
  if (userId === ownerId) throw new ApiError(409, "Owners can't be removed. Delete the group instead.");
  const updated = await db
    .update(groupMemberships)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(groupMemberships.studyGroupId, groupId),
        eq(groupMemberships.userId, userId),
        eq(groupMemberships.status, "accepted"),
      ),
    )
    .returning({ id: groupMemberships.id });
  if (updated.length === 0) throw new ApiError(404, "That person isn't a member");
}

/* ---------- Member actions ---------- */

/** Asks to join a group. Becomes a pending membership; the owner approves it later. */
export async function requestToJoin(userId: string, groupId: string): Promise<void> {
  const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId));
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.ownerId === userId) throw new ApiError(409, "You own this group");

  const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.studyGroupId, groupId));
  const mine = memberships.find((membership) => membership.userId === userId);
  if (mine?.status === "accepted") throw new ApiError(409, "You're already in this group");
  if (mine?.status === "pending") return; // already asked; nothing to do
  if (mine?.status === "rejected") throw new ApiError(409, "The owner declined your earlier request");

  const accepted = memberships.filter((membership) => membership.status === "accepted").length;
  if (accepted >= group.maxMembers) throw new ApiError(409, "This group is full");

  await db
    .insert(groupMemberships)
    .values({ userId, studyGroupId: groupId, status: "pending", role: "member" })
    .onConflictDoUpdate({
      target: [groupMemberships.userId, groupMemberships.studyGroupId],
      set: { status: "pending", role: "member" },
    });
}

/** Withdraws a pending request to join. */
export async function cancelJoinRequest(userId: string, groupId: string): Promise<void> {
  await db
    .update(groupMemberships)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(groupMemberships.userId, userId),
        eq(groupMemberships.studyGroupId, groupId),
        eq(groupMemberships.status, "pending"),
      ),
    );
}

/** A member leaves. Owners can't leave; they delete the group. */
export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId));
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.ownerId === userId) throw new ApiError(409, "Owners can't leave their own group. Delete it instead.");
  const updated = await db
    .update(groupMemberships)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(groupMemberships.userId, userId),
        eq(groupMemberships.studyGroupId, groupId),
        eq(groupMemberships.status, "accepted"),
      ),
    )
    .returning({ id: groupMemberships.id });
  if (updated.length === 0) throw new ApiError(404, "You're not in this group");
}
