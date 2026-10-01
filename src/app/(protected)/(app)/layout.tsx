import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROUTES } from "@/config/constants";
import { requireSessionUser } from "@/services/auth.service";

// The app shell (sidebar; no top bar). Sign-in is enforced by the parent (protected) layout; this one also requires finished onboarding.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();
  if (!user.onboarded) redirect(ROUTES.onboarding);

  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* On phones the sidebar is an off-canvas drawer, so it needs a way in; on larger screens the toggle lives in the sidebar. */}
        <SidebarTrigger className="fixed top-3 left-3 z-40 border bg-card shadow-sm md:hidden" />
        {/* The single source of page gutters: pages render inside this and set no width or padding of their own. */}
        <div className="flex w-full flex-1 flex-col gap-8 p-4 max-md:pt-16 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
