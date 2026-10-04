"use client";

import { CheckIcon, Loader2Icon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import type { MyStatus } from "@/schemas/groups";

/** The one action that makes sense for the signed-in user's relationship to a group. */
export function StatusAction({
  groupId,
  status,
  full,
  busy,
  onJoin,
  onCancel,
  onLeave,
  size = "default",
}: {
  groupId: string;
  status: MyStatus;
  full: boolean;
  busy: boolean;
  onJoin: () => void;
  onCancel: () => void;
  onLeave: () => void;
  size?: "default" | "sm" | "lg";
}) {
  const spinner = busy && <Loader2Icon className="animate-spin" aria-hidden />;

  switch (status) {
    case "owner":
      return (
        <Button asChild size={size}>
          <Link href={ROUTES.group(groupId)}>
            <SettingsIcon aria-hidden />
            Manage
          </Link>
        </Button>
      );
    case "member":
      return (
        <Button variant="outline" size={size} onClick={onLeave} disabled={busy}>
          {spinner}
          Leave group
        </Button>
      );
    case "pending":
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckIcon className="size-4" aria-hidden />
            Request sent
          </span>
          <Button variant="ghost" size={size} onClick={onCancel} disabled={busy}>
            {spinner}
            Cancel
          </Button>
        </div>
      );
    case "rejected":
      return <span className="text-sm font-medium text-muted-foreground">Request declined</span>;
    default:
      return full ? (
        <span className="text-sm font-medium text-muted-foreground">Group is full</span>
      ) : (
        <Button size={size} onClick={onJoin} disabled={busy}>
          {spinner}
          Request to join
        </Button>
      );
  }
}
