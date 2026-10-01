import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ROUTES } from "@/config/constants";
import { requireSessionUser } from "@/services/auth.service";

export const metadata = { title: "Set up your profile · SG Match" };

export default async function OnboardingPage() {
  const user = await requireSessionUser();
  if (user.onboarded) redirect(ROUTES.home);

  return <OnboardingWizard firstName={user.name.split(" ")[0]} />;
}
