"use client";

import { ArrowLeftIcon, CalendarClockIcon, CheckIcon, MapPinIcon, PencilIcon, TagIcon, Trash2Icon, UserMinusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { useDeleteGroup, useGroup, useGroupActions } from "@/hooks/groups";
import { initials, levelLabel, modeLabel, slotLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { GroupDetail, MemberItem } from "@/schemas/groups";
import type { Profile } from "@/schemas/profile";
import { GroupFormDialog } from "./group-form-dialog";
import { StatusAction } from "./status-action";

function Section({ title, count, children, className }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border bg-card p-5 shadow-sm sm:p-6", className)}>
      <h2 className="mb-4 flex items-baseline gap-2 font-heading text-lg font-semibold">
        {title}
        {count !== undefined && <span className="text-sm font-normal text-muted-foreground tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Chips({ icon: Icon, label, items }: { icon: React.ComponentType<{ className?: string }>; label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item}>
            <Badge variant="secondary" className="h-6 px-2.5 text-xs">{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Person({ name, sub, action }: { name: string; sub?: string | null; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

export function GroupDetailView({ initial, profile }: { initial: GroupDetail; profile: Profile }) {
  const router = useRouter();
  const { data: group } = useGroup(initial.id, initial);
  const { join, cancel, leave, decide, removeMember } = useGroupActions();
  const deleteGroup = useDeleteGroup();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "leave" | { remove: MemberItem } | null>(null);

  const isOwner = group.myStatus === "owner";
  const full = group.spotsLeft === 0;
  const others = group.members.filter((member) => member.role !== "owner").length;
  const busy = join.isPending || cancel.isPending || leave.isPending;

  const runConfirm = () => {
    if (confirm === "delete") {
      deleteGroup.mutate(group.id, {
        onSuccess: () => {
          toast.success("Group deleted");
          router.replace(ROUTES.groups);
        },
      });
    } else if (confirm === "leave") {
      leave.mutate(group.id, {
        onSuccess: () => {
          toast.success(`You left ${group.name}`);
          setConfirm(null);
        },
      });
    } else if (confirm) {
      const member = confirm.remove;
      removeMember.mutate(
        { groupId: group.id, userId: member.userId },
        {
          onSuccess: () => {
            toast.success(`${member.name} was removed`);
            setConfirm(null);
          },
        },
      );
    }
  };

  const confirmCopy =
    confirm === "delete"
      ? {
          title: "Delete this group?",
          body: (
            <>
              <strong className="font-medium text-foreground">{group.name}</strong> will be deleted for everyone.
              {others > 0 &&
                ` ${others} ${others === 1 ? "member" : "members"} will lose access to it.`}
              {group.pending.length > 0 &&
                ` ${group.pending.length} pending ${group.pending.length === 1 ? "request" : "requests"} will be cancelled.`}{" "}
              This can&apos;t be undone.
            </>
          ),
          label: "Delete group",
          pending: "Deleting…",
        }
      : confirm === "leave"
        ? { title: "Leave this group?", body: <>You&apos;ll lose your place in <strong className="font-medium text-foreground">{group.name}</strong>. You can ask to join again later if there&apos;s room.</>, label: "Leave group", pending: "Leaving…" }
        : confirm
          ? { title: "Remove this member?", body: <><strong className="font-medium text-foreground">{confirm.remove.name}</strong> will be taken out of the group.</>, label: "Remove member", pending: "Removing…" }
          : { title: "", body: "", label: "", pending: "" };

  return (
    <>
      <Link
        href={ROUTES.groups}
        className="group/back inline-flex h-10 w-fit items-center gap-2.5 rounded-full border bg-card py-1 pr-4 pl-1 text-sm font-semibold shadow-sm transition-colors outline-none hover:border-primary/50 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover/back:-translate-x-0.5">
          <ArrowLeftIcon className="size-4" aria-hidden />
        </span>
        Back to all groups
      </Link>

      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sidebar via-sidebar to-primary p-6 text-primary-foreground shadow-lg sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-white/8" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isOwner && <Badge className="h-5 bg-sidebar-primary text-sidebar-primary-foreground">You own this group</Badge>}
              {group.myStatus === "member" && <Badge className="h-5 bg-white/20 text-primary-foreground">You&apos;re a member</Badge>}
              {full && <Badge className="h-5 bg-white/20 text-primary-foreground">Full</Badge>}
            </div>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{group.name}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-foreground/80">
              {group.subject} · {levelLabel(group.level)} · {modeLabel(group.mode)}
              {group.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3.5" aria-hidden />
                  {group.location}
                </span>
              )}
              {group.ownerName && !isOwner && <span>Run by {group.ownerName}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOwner ? (
              <>
                <Button variant="secondary" size="lg" onClick={() => setEditing(true)}>
                  <PencilIcon aria-hidden />
                  Edit
                </Button>
                <Button
                  size="lg"
                  onClick={() => setConfirm("delete")}
                  className="bg-white/10 text-primary-foreground hover:bg-white/20"
                >
                  <Trash2Icon aria-hidden />
                  Delete
                </Button>
              </>
            ) : (
              <div className="rounded-2xl bg-white p-2 text-foreground">
                <StatusAction
                  groupId={group.id}
                  status={group.myStatus}
                  full={full}
                  busy={busy}
                  size="lg"
                  onJoin={() => join.mutate(group.id, { onSuccess: () => toast.success(`Request sent to ${group.name}`) })}
                  onCancel={() => cancel.mutate(group.id, { onSuccess: () => toast.success("Request cancelled") })}
                  onLeave={() => setConfirm("leave")}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Owner inbox */}
          {isOwner && (
            <Section title="Requests to join" count={group.pending.length} className={group.pending.length > 0 ? "border-sidebar-primary/60 ring-1 ring-sidebar-primary/30" : undefined}>
              {group.pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one is waiting. New requests will appear here.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {group.pending.map((request) => (
                    <li key={request.userId} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                      <Person
                        name={request.name}
                        sub={request.university}
                        action={
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={decide.isPending}
                              onClick={() =>
                                decide.mutate({ groupId: group.id, userId: request.userId, status: "rejected" }, { onSuccess: () => toast.success(`Declined ${request.name}`) })
                              }
                            >
                              <XIcon aria-hidden />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              disabled={decide.isPending || full}
                              title={full ? "The group is full. Raise its size or remove someone first." : undefined}
                              onClick={() =>
                                decide.mutate({ groupId: group.id, userId: request.userId, status: "accepted" }, { onSuccess: () => toast.success(`${request.name} joined the group`) })
                              }
                            >
                              <CheckIcon aria-hidden />
                              Accept
                            </Button>
                          </div>
                        }
                      />
                      {(request.bio || request.skills.length > 0) && (
                        <div className="flex flex-col gap-2 pl-[3.25rem]">
                          {request.bio && <p className="text-sm text-muted-foreground">{request.bio}</p>}
                          {request.skills.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                              {request.skills.slice(0, 6).map((skill) => (
                                <li key={skill}><Badge variant="secondary" className="h-6 px-2.5 text-xs">{skill}</Badge></li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {full && group.pending.length > 0 && (
                <p className="mt-4 text-sm text-warning-foreground">The group is full. Raise its size in Edit, or remove a member, to accept more people.</p>
              )}
            </Section>
          )}

          <Section title="About this group">
            <div className="flex flex-col gap-6">
              {group.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{group.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">The owner hasn&apos;t added a description yet.</p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Chips icon={TagIcon} label="Skills it covers" items={group.skills} />
                <Chips icon={TagIcon} label="Topics" items={group.interests} />
                <Chips icon={CalendarClockIcon} label="When it meets" items={group.availability.map(slotLabel)} />
              </div>
            </div>
          </Section>
        </div>

        {/* Members */}
        <Section title="Members" count={group.memberCount} className="lg:sticky lg:top-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Group size"
              aria-valuenow={group.memberCount}
              aria-valuemax={group.maxMembers}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div className={cn("h-full rounded-full", full ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min((group.memberCount / group.maxMembers) * 100, 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {group.memberCount}/{group.maxMembers}
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {group.members.map((member) => (
              <li key={member.userId}>
                <Person
                  name={member.isMe ? `${member.name} (you)` : member.name}
                  sub={member.role === "owner" ? `Owner${member.university ? ` · ${member.university}` : ""}` : member.university}
                  action={
                    isOwner && member.role !== "owner" ? (
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${member.name}`} onClick={() => setConfirm({ remove: member })} className="text-muted-foreground hover:text-destructive">
                        <UserMinusIcon aria-hidden />
                      </Button>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            {full ? "This group is full." : `${group.spotsLeft} ${group.spotsLeft === 1 ? "place" : "places"} left.`}
          </p>
        </Section>
      </div>

      <GroupFormDialog open={editing} onOpenChange={setEditing} profile={profile} group={group} onDone={() => setEditing(false)} />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirmCopy.title}
        description={confirmCopy.body}
        confirmLabel={confirmCopy.label}
        pendingLabel={confirmCopy.pending}
        pending={deleteGroup.isPending || leave.isPending || removeMember.isPending}
        onConfirm={runConfirm}
      />
    </>
  );
}
