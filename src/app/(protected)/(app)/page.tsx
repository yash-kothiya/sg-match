import { Dashboard } from "@/components/dashboard/dashboard";
import { requireSessionUser } from "@/services/auth.service";
import { getDashboard } from "@/services/dashboard.service";

export const metadata = { title: "Dashboard · SG Match" };

export default async function DashboardPage() {
  // Memoized per request, so this doesn't repeat the layout's session check.
  const user = await requireSessionUser();
  return <Dashboard data={await getDashboard(user.id)} />;
}
