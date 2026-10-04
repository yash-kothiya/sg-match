import "server-only";

import { listGroups } from "./groups.service";
import { getMatches, listRequests } from "./matches.service";
import { getProfile } from "./profile.service";
import { profileStrength } from "@/lib/profile-strength";

const TOP_MATCHES = 3;

/** Everything the dashboard shows, in one call. Read-only. */
export async function getDashboard(userId: string) {
  const [profile, groups, requests] = await Promise.all([
    getProfile(userId),
    listGroups(userId, { scope: "explore", q: "", open: false }),
    listRequests(userId),
  ]);

  const myGroups = groups.filter((group) => group.myStatus === "owner" || group.myStatus === "member");
  const sent = groups.filter((group) => group.myStatus === "pending");
  const toReview = groups.filter((group) => group.myStatus === "owner" && group.pendingCount > 0);
  const myRequests = requests.filter((request) => request.kind === "mine");
  // Listed oldest first, so the newest request is last. That's the one people are working on.
  const focus = myRequests.at(-1) ?? null;

  // The dashboard still loads if scoring can't (for example before the scores table exists).
  const topMatches = focus
    ? await getMatches(userId, focus.id, TOP_MATCHES)
        .then((result) => result.matches)
        .catch((error) => {
          console.error("Dashboard matches failed:", error);
          return [];
        })
    : [];

  return {
    profile,
    strength: profileStrength(profile),
    myGroups,
    sent,
    toReview,
    pendingToReview: toReview.reduce((sum, group) => sum + group.pendingCount, 0),
    myRequests,
    focus,
    topMatches,
  };
}
