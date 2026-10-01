import { ProfilePage } from "@/components/profile/profile-page";
import { requireSessionUser } from "@/services/auth.service";
import { getProfile } from "@/services/profile.service";

export const metadata = { title: "Profile · SG Match" };

export default async function ProfileRoute() {
  const user = await requireSessionUser();
  const profile = await getProfile(user.id);

  return <ProfilePage initialProfile={profile} />;
}
