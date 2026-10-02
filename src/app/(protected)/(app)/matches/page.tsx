import { MatchesPage } from "@/components/matches/matches-page";
import { requireSessionUser } from "@/services/auth.service";
import { listRequests } from "@/services/matches.service";
import { getProfile } from "@/services/profile.service";

export const metadata = { title: "Matches · SG Match" };

export default async function MatchesRoute({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const user = await requireSessionUser();
  const [requests, profile, { request }] = await Promise.all([listRequests(user.id), getProfile(user.id), searchParams]);

  return <MatchesPage initialRequests={requests} initialRequestId={request} profile={profile} />;
}
