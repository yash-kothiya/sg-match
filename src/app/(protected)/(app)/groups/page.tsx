import { GroupsPage } from "@/components/groups/groups-page";
import { requireSessionUser } from "@/services/auth.service";
import { getProfile } from "@/services/profile.service";

export const metadata = { title: "Study groups · SG Match" };

export default async function GroupsRoute() {
  const user = await requireSessionUser();
  return <GroupsPage profile={await getProfile(user.id)} />;
}
