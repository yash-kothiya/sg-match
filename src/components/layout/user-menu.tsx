"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/auth";
import type { AuthUser } from "@/schemas/auth";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Account card pinned to the sidebar footer; opens a menu with the account details and sign out. */
export function UserMenu({ user }: { user: AuthUser }) {
  const signOut = useSignOut();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              className="rounded-xl hover:bg-white/10 data-[state=open]:bg-white/10 data-[state=open]:text-sidebar-foreground"
            >
              <UserAvatar name={user.name} className="size-8" />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[15px] font-semibold">{user.name}</span>
                <span className="truncate text-[13px] text-sidebar-foreground/75">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-foreground/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl"
          >
            <DropdownMenuItem
              variant="destructive"
              disabled={signOut.isPending}
              onSelect={() => signOut.mutate()}
            >
              <LogOutIcon />
              {signOut.isPending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
