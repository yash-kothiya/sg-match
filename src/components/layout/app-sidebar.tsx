"use client";

import {
  LayoutDashboardIcon,
  MessagesSquareIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/common/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { APP_NAV } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/schemas/auth";
import { UserMenu } from "./user-menu";

const NAV_ICONS = {
  dashboard: LayoutDashboardIcon,
  matches: SparklesIcon,
  groups: UsersIcon,
  guide: MessagesSquareIcon,
} satisfies Record<(typeof APP_NAV)[number]["key"], React.ComponentType>;

// Roomier, higher-contrast nav rows. The active row is a solid light-lavender pill with dark text.
const NAV_BUTTON =
  "h-11 gap-3 rounded-xl px-3 text-[15px] font-medium text-sidebar-foreground/90 [&_svg]:size-5 " +
  "hover:bg-white/10 hover:text-sidebar-foreground " +
  "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-sm " +
  "data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground";

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Collapsed to icons there is no room for the logo, so the toggle takes its place. */}
      <SidebarHeader className="flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
        <Brand
          inverted
          className="px-2 text-sidebar-foreground group-data-[collapsible=icon]:hidden"
        />
        <SidebarTrigger className="text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {APP_NAV.map((item) => {
                const Icon = NAV_ICONS[item.key];

                if (item.href === null) {
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.title} (coming soon)`}
                        className={cn(NAV_BUTTON, "text-sidebar-foreground/60 disabled:opacity-100")}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="top-1/2! right-3 h-5 -translate-y-1/2 rounded-full bg-white/15 px-2 text-[10px] font-semibold tracking-wider text-sidebar-foreground uppercase">
                        Soon
                      </SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className={NAV_BUTTON}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
