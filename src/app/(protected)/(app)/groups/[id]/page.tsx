import { notFound } from "next/navigation";
import { GroupDetailView } from "@/components/groups/group-detail";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser } from "@/services/auth.service";
import { getGroup } from "@/services/groups.service";
import { getProfile } from "@/services/profile.service";

export const metadata = { title: "Study group · SG Match" };

export default async function GroupRoute({ params }: { params: Promise<{ id: string }> }) {
  const [user, { id }] = await Promise.all([requireSessionUser(), params]);
  const group = await getGroup(user.id, id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return <GroupDetailView initial={group} profile={await getProfile(user.id)} />;
}
