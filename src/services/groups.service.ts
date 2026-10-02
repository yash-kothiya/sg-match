import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMemberships, studyGroups } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";

/** Asks to join a group. Becomes a pending membership; the owner approves it later. */
export async function requestToJoin(userId: string, groupId: string): Promise<void> {
  const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId));
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.ownerId === userId) throw new ApiError(409, "You own this group");

  const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.studyGroupId, groupId));
  const mine = memberships.find((membership) => membership.userId === userId);
  if (mine?.status === "accepted") throw new ApiError(409, "You're already in this group");
  if (mine?.status === "pending") return; // already asked; nothing to do

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
