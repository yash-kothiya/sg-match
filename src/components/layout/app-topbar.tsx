"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { APP_NAV } from "@/config/constants";

export function AppTopbar() {
  const pathname = usePathname();
  const current = APP_NAV.find((item) => item.href === pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:px-6 lg:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
      <span className="text-sm font-medium">{current?.title ?? ""}</span>
    </header>
  );
}
