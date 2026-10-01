import { requireSessionUser } from "@/services/auth.service";

// Every page in this group needs a signed-in user. Only /auth lives outside it.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireSessionUser();
  return children;
}
