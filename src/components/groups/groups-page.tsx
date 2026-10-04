"use client";

import { LoaderCircleIcon, PlusIcon, SearchIcon, SearchXIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Notice } from "@/components/matches/notice";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EXPERIENCE_LEVELS, ROUTES, STUDY_MODES } from "@/config/constants";
import { useGroupActions, useGroups } from "@/hooks/groups";
import { cn } from "@/lib/utils";
import type { GroupCardData } from "@/schemas/groups";
import type { Profile } from "@/schemas/profile";
import { GroupCard } from "./group-card";
import { GroupFormDialog } from "./group-form-dialog";

type Tab = "mine" | "requests" | "explore";

const TABS: { value: Tab; label: string }[] = [
  { value: "mine", label: "My groups" },
  { value: "requests", label: "Requests" },
  { value: "explore", label: "Explore" },
];

const EMPTY: Record<Tab, { title: string; body: string }> = {
  mine: { title: "You're not in any groups yet", body: "Create your own, or find one in Explore and ask to join." },
  requests: { title: "No pending requests", body: "Groups you've asked to join will show up here until the owner replies." },
  explore: { title: "No groups match", body: "Try a different word, or clear the filters." },
};

const inTab = (group: GroupCardData, tab: Tab) =>
  tab === "mine"
    ? group.myStatus === "owner" || group.myStatus === "member"
    : tab === "requests"
      ? group.myStatus === "pending" || group.myStatus === "rejected"
      : true;

const ANY = "any";

/** Filter dropdown. Radix can't hold an empty value, so "any" is a real item that maps back to "". */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Select value={value || ANY} onValueChange={(next) => onChange(next === ANY ? "" : next)}>
      <SelectTrigger aria-label={label} className="min-w-40 font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GroupsPage({ profile }: { profile: Profile }) {
  const router = useRouter();
  const query = useGroups();
  const { join, cancel, leave } = useGroupActions();
  const [tab, setTab] = useState<Tab | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("");
  const [level, setLevel] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toLeave, setToLeave] = useState<GroupCardData | null>(null);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const counts = useMemo(
    () => ({
      mine: all.filter((g) => inTab(g, "mine")).length,
      requests: all.filter((g) => inTab(g, "requests")).length,
      explore: all.length,
    }),
    [all],
  );
  const pendingToReview = useMemo(() => all.reduce((sum, g) => sum + g.pendingCount, 0), [all]);

  // Land on "My groups" if there are any, otherwise on Explore, until the user picks a tab.
  const active: Tab = tab ?? (counts.mine > 0 ? "mine" : "explore");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((g) => {
      if (!inTab(g, active)) return false;
      if (mode && g.mode !== mode) return false;
      if (level && g.level !== level) return false;
      if (openOnly && g.spotsLeft === 0) return false;
      if (!needle) return true;
      return [g.name, g.subject, ...g.skills].some((text) => text.toLowerCase().includes(needle));
    });
  }, [all, active, search, mode, level, openOnly]);

  const filtered = Boolean(search || mode || level || openOnly);
  const busyId =
    (join.isPending && join.variables) || (cancel.isPending && cancel.variables) || (leave.isPending && leave.variables) || null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold sm:text-4xl">Study groups</h1>
          <p className="text-muted-foreground">Your groups, your requests, and everything you can join.</p>
        </div>
        <Button size="lg" onClick={() => setCreating(true)}>
          <PlusIcon aria-hidden />
          New group
        </Button>
      </div>

      {pendingToReview > 0 && (
        <button
          type="button"
          onClick={() => setTab("mine")}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-sidebar-primary/50 bg-sidebar-primary/15 px-4 py-3 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <UsersIcon className="size-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">{pendingToReview}</strong> {pendingToReview === 1 ? "person is" : "people are"}{" "}
            waiting to join your groups. Open one marked &ldquo;to review&rdquo;.
          </span>
        </button>
      )}

      <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="Group views" className="flex gap-1 self-start rounded-2xl bg-muted p-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active === item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                "h-9 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              <span className="ml-1.5 font-normal tabular-nums opacity-70">{counts[item.value]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1 sm:max-w-sm">
            <span className="sr-only">Search groups</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, subject or skill"
              className="h-10 w-full rounded-xl border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          <FilterSelect label="Any format" value={mode} onChange={setMode} options={STUDY_MODES} />
          <FilterSelect label="Any level" value={level} onChange={setLevel} options={EXPERIENCE_LEVELS} />
          {/* A pill like the dropdowns beside it: the whole thing toggles, and it tints when on. */}
          <label
            htmlFor="open-only"
            className={cn(
              "flex h-10 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              openOnly ? "border-primary bg-accent text-accent-foreground" : "bg-card hover:border-primary/50",
            )}
          >
            Open spots only
            <Switch id="open-only" size="sm" checked={openOnly} onCheckedChange={setOpenOnly} />
          </label>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setMode("");
                setLevel("");
                setOpenOnly(false);
              }}
              className="cursor-pointer text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Clear filters
            </button>
          )}
          {query.isFetching && !query.isPending && <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
        </div>
      </div>

      {query.isPending ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading groups">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-3xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Notice
          icon={TriangleAlertIcon}
          title="We couldn't load groups"
          action={
            <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
              Try again
            </Button>
          }
        >
          {query.error.message}
        </Notice>
      ) : visible.length === 0 ? (
        <Notice
          icon={SearchXIcon}
          title={filtered ? EMPTY.explore.title : EMPTY[active].title}
          action={
            !filtered && active !== "explore" ? (
              <Button variant="outline" onClick={() => setTab("explore")}>
                Explore groups
              </Button>
            ) : undefined
          }
        >
          {filtered ? EMPTY.explore.body : EMPTY[active].body}
        </Notice>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((group) => (
            <li key={group.id} className="flex">
              <div className="flex-1">
                <GroupCard
                  group={group}
                  busy={busyId === group.id}
                  onJoin={() => join.mutate(group.id, { onSuccess: () => toast.success(`Request sent to ${group.name}`) })}
                  onCancel={() => cancel.mutate(group.id, { onSuccess: () => toast.success("Request cancelled") })}
                  onLeave={() => setToLeave(group)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toLeave !== null}
        onOpenChange={(open) => !open && setToLeave(null)}
        title="Leave this group?"
        description={
          <>
            You&apos;ll lose your place in <strong className="font-medium text-foreground">{toLeave?.name}</strong>. You
            can ask to join again later if there&apos;s room.
          </>
        }
        confirmLabel="Leave group"
        pendingLabel="Leaving…"
        pending={leave.isPending}
        onConfirm={() => {
          if (!toLeave) return;
          const group = toLeave;
          leave.mutate(group.id, {
            onSuccess: () => {
              toast.success(`You left ${group.name}`);
              setToLeave(null);
            },
          });
        }}
      />

      <GroupFormDialog
        open={creating}
        onOpenChange={setCreating}
        profile={profile}
        onDone={(id) => {
          setCreating(false);
          router.push(ROUTES.group(id));
        }}
      />
    </>
  );
}
