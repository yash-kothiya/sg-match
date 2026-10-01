import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ROUTES } from "@/config/constants";
import { getSessionUser } from "@/lib/auth/session";

// Everything under (app) requires a signed-in user; the check runs on the server.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect(ROUTES.auth);

  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppTopbar />
        {/* The single source of page gutters: pages render inside this and set no width or padding of their own. */}
        <div className="flex w-full flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
