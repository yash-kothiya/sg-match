"use client";

import { BellIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/config/constants";
import { levelLabel, modeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { GroupCardData } from "@/schemas/groups";
import { StatusAction } from "./status-action";

const MAX_SKILLS_SHOWN = 4;

export function GroupCard({
  group,
  busy,
  onJoin,
  onCancel,
  onLeave,
}: {
  group: GroupCardData;
  busy: boolean;
  onJoin: () => void;
  onCancel: () => void;
  onLeave: () => void;
}) {
  const shown = group.skills.slice(0, MAX_SKILLS_SHOWN);
  const extra = group.skills.length - shown.length;
  const fill = Math.min((group.memberCount / group.maxMembers) * 100, 100);
  const full = group.spotsLeft === 0;

  return (
    <article className="group relative flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {group.myStatus === "owner" && <Badge className="h-5">Owner</Badge>}
          {group.myStatus === "member" && <Badge variant="secondary" className="h-5">Member</Badge>}
          {group.pendingCount > 0 && (
            <Badge className="h-5 gap-1 bg-sidebar-primary text-sidebar-primary-foreground">
              <BellIcon aria-hidden />
              {group.pendingCount} to review
            </Badge>
          )}
          {full && group.myStatus !== "owner" && group.myStatus !== "member" && (
            <Badge variant="outline" className="h-5">Full</Badge>
          )}
        </div>
        <h3 className="font-heading text-lg leading-snug font-semibold">
          <Link
            href={ROUTES.group(group.id)}
            className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {group.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          {group.subject} · {levelLabel(group.level)} · {modeLabel(group.mode)}
          {group.location && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" aria-hidden />
              {group.location}
            </span>
          )}
        </p>
      </div>

      {group.description && <p className="line-clamp-2 text-sm text-muted-foreground">{group.description}</p>}

      {shown.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
          {shown.map((skill) => (
            <li key={skill}>
              <Badge variant="secondary" className="h-6 px-2.5 text-xs">{skill}</Badge>
            </li>
          ))}
          {extra > 0 && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{extra}</li>}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Members"
            aria-valuenow={group.memberCount}
            aria-valuemin={0}
            aria-valuemax={group.maxMembers}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div className={cn("h-full rounded-full", full ? "bg-warning" : "bg-primary")} style={{ width: `${fill}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {group.memberCount}/{group.maxMembers} members
          </span>
        </div>
        {/* relative z-10 keeps the action clickable above the card's full-surface link */}
        <div className="relative z-10 flex justify-end">
          <StatusAction
            groupId={group.id}
            status={group.myStatus}
            full={full}
            busy={busy}
            onJoin={onJoin}
            onCancel={onCancel}
            onLeave={onLeave}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
